import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getPlayersDbClient } from '../../db/client';

export const prerender = false;

export const POST = async ({ request }: { request: Request }) => {
    try {
        const { messages } = await request.json();

        const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY || (typeof process !== 'undefined' ? process.env.GOOGLE_GENERATIVE_AI_API_KEY : null);

        if (!apiKey) {
            console.error('[CHAT API] GOOGLE_GENERATIVE_AI_API_KEY not found');
            return new Response(
                JSON.stringify({
                    error: 'Falta la configuración de la clave de IA. Por favor, contacta con el administrador.'
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const result = streamText({
            model: google('gemini-1.5-flash'),
            messages,
            system: `Eres un asistente experto en el Real Madrid Femenino (MFX - Madrid Femenino Xtra). 
            Tu objetivo es ayudar a los fans con estadísticas, resultados y curiosidades del equipo.
            Sé amable, entusiasta y preciso. Responde en español.
            
            TIENES ACCESO A HERRAMIENTAS DE BASE DE DATOS. ÚSALAS SIEMPRE QUE TE PREGUNTEN DATOS ESPECÍFICOS.
            - Si te preguntan sobre jugadoras, goleadoras o estadísticas, USA 'getPlayersStats'.
            - Si te preguntan sobre el calendario o próximos partidos, USA 'getNextMatches'.
            - Si te preguntan sobre resultados pasados, USA 'getResults'.
            
            Información importante:
            - La sección femenina nació oficialmente el 1 de julio de 2020 (antes era el CD Tacón).
            - Jugadoras clave: Caroline Weir (la estrella), Linda Caicedo, Athenea, Misa Rodríguez (portera), Olga Carmona (capitana y goleadora en la final del mundial).
            - Entrenadores: David Aznar (primero), Alberto Toril, y recientemente Pau Quesada.
            
            Responde de forma concisa pero completa.`,
            tools: {
                getPlayersStats: tool({
                    description: 'Obtener estadísticas de jugadoras (goles, asistencias). Útil para preguntas como "¿Quién es la máxima goleadora?" o "Estadísticas de Weir".',
                    parameters: z.object({
                        playerName: z.string().optional().describe('Nombre de la jugadora'),
                    }),
                    execute: async ({ playerName }: { playerName?: string }) => {
                        let query = `
                            SELECT 
                                j.nombre as player, 
                                COUNT(g.id_gol) as goals,
                                (SELECT COUNT(*) FROM goles_y_asistencias a WHERE a.asistente = j.id_jugadora) as assists
                            FROM jugadoras j
                            LEFT JOIN goles_y_asistencias g ON j.id_jugadora = g.goleadora
                            WHERE 1=1
                        `;
                        const params: any[] = [];

                        if (playerName) {
                            query += ` AND j.nombre LIKE ?`;
                            params.push(`%${playerName}%`);
                        }

                        query += ` GROUP BY j.id_jugadora ORDER BY goals DESC LIMIT 10`;

                        try {
                            const client = await getPlayersDbClient();
                            if (!client) return "Error conectando a la base de datos.";
                            const res = await client.execute({ sql: query, args: params });
                            return JSON.stringify(res.rows);
                        } catch (e) {
                            console.error(e);
                            return "Error al consultar la base de datos de estadísticas.";
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
                            const query = `
                                SELECT 
                                    p.fecha, 
                                    p.hora, 
                                    cl.nombre as local, 
                                    cv.nombre as visitante,
                                    c.competicion
                                FROM partidos p
                                JOIN clubes cl ON p.id_club_local = cl.id_club
                                JOIN clubes cv ON p.id_club_visitante = cv.id_club
                                JOIN competiciones c ON p.id_competicion = c.id_competicion
                                WHERE p.fecha >= date('now')
                                ORDER BY p.fecha ASC LIMIT 5
                            `;
                            const res = await client.execute(query);
                            return JSON.stringify(res.rows);
                        } catch (e) {
                            console.error(e);
                            return "No se pudo obtener el calendario.";
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
                            const query = `
                                SELECT 
                                    p.fecha, 
                                    cl.nombre as local, 
                                    cv.nombre as visitante,
                                    p.goles_rm,
                                    p.goles_rival,
                                    c.competicion
                                FROM partidos p
                                JOIN clubes cl ON p.id_club_local = cl.id_club
                                JOIN clubes cv ON p.id_club_visitante = cv.id_club
                                JOIN competiciones c ON p.id_competicion = c.id_competicion
                                WHERE p.fecha < date('now') AND p.goles_rm IS NOT NULL
                                ORDER BY p.fecha DESC LIMIT 5
                            `;
                            const res = await client.execute(query);
                            return JSON.stringify(res.rows);
                        } catch (e) {
                            console.error(e);
                            return "No se pudieron obtener resultados pasados.";
                        }
                    },
                }),
            },
            maxSteps: 5,
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Error en chat API:', error);
        return new Response(
            JSON.stringify({ error: 'Hubo un error al procesar tu solicitud.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
