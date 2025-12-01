import { createClient } from '@libsql/client';

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = import.meta.env;

const JSON_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
};

export const GET = async () => {
    if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
        return new Response(
            JSON.stringify({ error: "Credenciales de Turso no configuradas." }),
            { status: 500, headers: JSON_HEADERS }
        );
    }

    const client = createClient({
        url: TURSO_DATABASE_URL,
        authToken: TURSO_AUTH_TOKEN,
    });

    try {
        const query = `
            SELECT 
                id_club,
                nombre,
                ciudad,
                pais
            FROM clubes
            WHERE id_club != 1 
            ORDER BY nombre ASC
        `;

        const result = await client.execute(query);
        const todosLosClubes = result.rows;

        return new Response(
            JSON.stringify(todosLosClubes),
            { status: 200, headers: JSON_HEADERS }
        );

    } catch (error) {
        console.error("Turso DB Error en clubes:", error);

        return new Response(
            JSON.stringify({ error: 'Fallo al consultar clubes: ' + error.message }),
            { status: 500, headers: JSON_HEADERS }
        );
    }
}