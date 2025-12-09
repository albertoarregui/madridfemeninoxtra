import { createClient } from '@libsql/client';

const dbUrl = import.meta.env.TURSO_DATABASE_URL;
const dbToken = import.meta.env.TURSO_AUTH_TOKEN;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const getDbClient = () => {
    if (!dbUrl || !dbToken) {
        return {
            error: new Response(
                JSON.stringify({ error: "Credenciales de Turso no configuradas." }),
                { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            )
        };
    }
    try {
        const client = createClient({ url: dbUrl, authToken: dbToken });
        return { client };
    } catch (err) {
        return {
            error: new Response(
                JSON.stringify({ error: 'Error al crear el cliente de Turso.' }),
                { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            )
        };
    }
};

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
};

export const GET = async () => {
    const { client, error } = getDbClient();
    if (error) return error;

    try {
        const sqlQuery = `
            SELECT 
                c.id_club,
                c.nombre,
                c.ciudad,
                c.pais,
                c.fundacion,
                c.id_estadio,
                e.nombre AS estadio_nombre,
                e.ciudad AS estadio_ciudad,
                e.capacidad AS estadio_capacidad
            FROM 
                clubes c
            LEFT JOIN
                estadios e ON c.id_estadio = e.id_estadio
            WHERE
                c.nombre != 'Real Madrid Femenino'
            ORDER BY 
                c.nombre ASC
        `;

        const result = await client.execute(sqlQuery);

        return new Response(
            JSON.stringify(result.rows),
            { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Turso DB Error (GET Rivals):", error.message);
        return new Response(
            JSON.stringify({ error: 'Fallo en la consulta de la base de datos: ' + error.message }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }
};
