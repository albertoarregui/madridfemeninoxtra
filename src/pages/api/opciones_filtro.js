import { createClient } from '@libsql/client';

const dbUrl = import.meta.env.TURSO_DATABASE_URL;
const dbToken = import.meta.env.TURSO_AUTH_TOKEN;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export const OPTIONS = () => {
    return new Response(null, {
        status: 204, // 204 No Content
        headers: CORS_HEADERS
    });
};

export const GET = async () => {

    if (!dbUrl || !dbToken) {
        return new Response(
            JSON.stringify({ error: "Fallo de conexión: Credenciales de Turso (URL o Token) no configuradas en el entorno." }),
            { status: 500, headers: CORS_HEADERS }
        );
    }

    try {
        const client = createClient({ url: dbUrl, authToken: dbToken });

        const competicionesQuery = `
            SELECT DISTINCT c.competicion
            FROM partidos p
            JOIN competiciones c ON p.id_competicion = c.id_competicion
            ORDER BY c.competicion ASC
        `;
        const competicionesResult = await client.execute(competicionesQuery);

        const temporadasQuery = `
            SELECT DISTINCT t.temporada
            FROM partidos p
            JOIN temporadas t ON p.id_temporada = t.id_temporada
            ORDER BY t.temporada DESC
        `;
        const temporadasResult = await client.execute(temporadasQuery);

        const opciones = {
            competiciones: competicionesResult.rows.map(row => row.competicion),
            temporadas: temporadasResult.rows.map(row => row.temporada),
        };

        return new Response(
            JSON.stringify(opciones),
            { status: 200, headers: CORS_HEADERS }
        );

    } catch (error) {
        console.error("Error al obtener opciones de filtro (DB):", error.message);
        return new Response(
            JSON.stringify({ error: 'Fallo en la conexión o consulta de la base de datos: ' + error.message }),
            { status: 500, headers: CORS_HEADERS }
        );
    }
};