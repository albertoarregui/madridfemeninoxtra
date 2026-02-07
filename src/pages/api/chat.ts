import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getPlayersDbClient } from '../../db/client';

export const prerender = false;

export const POST = async ({ request }: { request: Request }) => {
    try {
        const { messages } = await request.json();

        const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: 'No se encontró la API Key de Google (GOOGLE_GENERATIVE_AI_API_KEY). Por favor configúrala en el archivo .env.'
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const result = streamText({
            model: google('gemini-1.5-flash'),
            messages,
            system: `Eres un asistente experto en el Real Madrid Femenino. 
            Tu objetivo es ayudar a los fans con estadísticas, resultados y curiosidades del equipo.
            Sé amable, entusiasta y preciso. Responde en español.
            
            TIENES ACCESO A HERRAMIENTAS DE BASE DE DATOS. ÚSALAS.
            - Si te preguntan sobre jugadoras, goleadoras o estadísticas, USA 'getPlayersStats'.
            - Si te preguntan sobre el calendario o próximos partidos, USA 'getNextMatches'.
            - Si te preguntan sobre resultados pasados, USA 'getResults'.
            
            NO inventes datos. Si la herramienta no devuelve nada, dilo.`,
            tools: {
                getPlayersStats: tool({
                    description: 'Obtener estadísticas de jugadoras (goles, asistencias, minutos, etc). Útil para preguntas como "¿Quién es la máxima goleadora?" o "Estadísticas de Weir".',
                    parameters: z.object({
                        playerName: z.string().optional().describe('Nombre de la jugadora si se pregunta por una específica'),
                        stat: z.enum(['goals', 'assists', 'minutes', 'all']).optional().describe('Estadística específica a buscar'),
                    }),
                    execute: async ({ playerName }: { playerName?: string }) => {
                        let query = `SELECT player, goals, assists, minutes FROM players_stats_24_25`;
                        const params: any[] = [];

                        if (playerName) {
                            query += ` WHERE player LIKE ?`;
                            params.push(`%${playerName}%`);
                        } else {
                            // If generic stats, order by goals by default
                            query += ` ORDER BY goals DESC LIMIT 10`;
                        }

                        try {
                            const client = await getPlayersDbClient();
                            if (!client) return "Error conectando a la base de datos.";
                            const { rows } = await client.execute({ sql: query, args: params });
                            return JSON.stringify(rows);
                        } catch (e) {
                            console.error(e);
                            return "Error al consultar la base de datos.";
                        }
                    },
                }),
                getNextMatches: tool({
                    description: 'Consultar el calendario de los próximos partidos.',
                    parameters: z.object({}),
                    execute: async () => {
                        try {
                            const client = await getPlayersDbClient();
                            if (!client) return "Error conectando a la base de datos.";
                            const { rows } = await client.execute("SELECT * FROM matches WHERE date >= date('now') ORDER BY date ASC LIMIT 5");
                            return JSON.stringify(rows);
                        } catch (e) {
                            return "No se pudo obtener el calendario (posiblemente la tabla no exista o haya error).";
                        }
                    },
                }),
                getResults: tool({
                    description: 'Consultar resultados de partidos jugados anteriormente.',
                    parameters: z.object({}),
                    execute: async () => {
                        try {
                            const client = await getPlayersDbClient();
                            if (!client) return "Error conectando a la base de datos.";
                            const { rows } = await client.execute("SELECT * FROM matches WHERE date < date('now') ORDER BY date DESC LIMIT 5");
                            return JSON.stringify(rows);
                        } catch (e) {
                            return "No se pudieron obtener resultados pasados.";
                        }
                    },
                }),
            },
            maxSteps: 5, // Allow up to 5 steps for tool usage
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Error en chat API:', error);
        return new Response(
            JSON.stringify({ error: 'Hubo un error al procesar tu solicitud.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
