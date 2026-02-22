import { createClient } from '@libsql/client';

let dbClient = null;

const JSON_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
};

async function getDb() {
    const { getPlayersDbClient } = await import('../../db/client');
    return await getPlayersDbClient();
}

export const GET = async () => {

    const client = await getDb();

    if (!client) {
        return new Response(
            JSON.stringify({ error: "Fallo de conexión: Credenciales de Turso (URL o Token) no configuradas en el entorno." }),
            { status: 500, headers: JSON_HEADERS }
        );
    }

    try {
        const query = `
            SELECT 
                id_jugadora, 
                nombre, 
                fecha_nacimiento, 
                pais_origen, 
                altura, 
                peso, 
                posicion
            FROM 
                jugadoras
            ORDER BY 
                nombre ASC
        `;

        const result = await client.execute({ sql: query, params: [], parse: true });


        return new Response(
            JSON.stringify(result.rows),
            { status: 200, headers: JSON_HEADERS }
        );

    } catch (error) {
        console.error("Error FATAL al procesar el listado de jugadoras:", error.stack);

        return new Response(
            JSON.stringify({
                error: "Fallo en la consulta de la base de datos.",
                details: error.message
            }),
            { status: 500, headers: JSON_HEADERS }
        );
    }
};
