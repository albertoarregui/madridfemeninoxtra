import { createClient } from '@libsql/client';

const dbUrl = import.meta.env.TURSO_DATABASE_URL;
const dbToken = import.meta.env.TURSO_AUTH_TOKEN;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const getDbClient = () => {
    if (!dbUrl || !dbToken) {
        return {
            error: new Response(
                JSON.stringify({ error: "Fallo de conexión: Credenciales de Turso no configuradas." }),
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
                id_entrenador, 
                nombre, 
                ciudad, 
                pais, 
                fecha_nacimiento,
                foto_url
            FROM 
                entrenadores 
            WHERE 
                nombre NOT IN ('José Manuel Lara', 'Antonio Rodríguez')
            ORDER BY 
                id_entrenador ASC
        `;

        const result = await client.execute(sqlQuery);

        const entrenadores = result.rows.map(row => {
            let record = {};
            result.columns.forEach((col, index) => {
                record[col] = row[index];
            });
            return record;
        });

        return new Response(
            JSON.stringify(entrenadores),
            { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Turso DB Error (GET Entrenadores):", error.message);
        return new Response(
            JSON.stringify({ error: 'Fallo en la consulta de la base de datos: ' + error.message }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }
};

export const POST = async ({ request }) => {
    const { client, error } = getDbClient();
    if (error) return error;

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return new Response(
            JSON.stringify({ error: "Formato JSON no válido en el cuerpo de la solicitud." }),
            { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

    const { nombre, ciudad, pais, fecha_nacimiento, foto_url } = body;

    if (!nombre || !ciudad || !pais || !fecha_nacimiento) {
        return new Response(
            JSON.stringify({ error: "Faltan campos obligatorios (nombre, ciudad, pais, fecha_nacimiento)." }),
            { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

    const sql = `
        INSERT INTO entrenadores (nombre, ciudad, pais, fecha_nacimiento, foto_url)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        await client.execute({
            sql: sql,
            args: [nombre, ciudad, pais, fecha_nacimiento, foto_url]
        });

        return new Response(
            JSON.stringify({ message: "Entrenador creado exitosamente." }),
            { status: 201, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error("Turso DB Error (POST Entrenadores):", error.message);
        return new Response(
            JSON.stringify({ error: 'Fallo al insertar el entrenador: ' + error.message }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }
};

export const PUT = async ({ request, url }) => {
    const { client, error } = getDbClient();
    if (error) return error;

    const id_entrenador = url.searchParams.get('id');

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return new Response(
            JSON.stringify({ error: "Formato JSON no válido en el cuerpo de la solicitud." }),
            { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

    const { nombre, ciudad, pais, fecha_nacimiento, foto_url } = body;

    if (!id_entrenador || !nombre || !ciudad || !pais || !fecha_nacimiento) {
        return new Response(
            JSON.stringify({ error: "Faltan campos obligatorios para la actualización (ID o datos del entrenador)." }),
            { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

    const sql = `
        UPDATE entrenadores
        SET nombre = ?, ciudad = ?, pais = ?, fecha_nacimiento = ?, foto_url = ?
        WHERE id_entrenador = ?
    `;

    try {
        const result = await client.execute({
            sql: sql,
            args: [nombre, ciudad, pais, fecha_nacimiento, foto_url, id_entrenador]
        });

        if (result.rowsAffected === 0) {
            return new Response(
                JSON.stringify({ message: "No se encontró el entrenador con ese ID." }),
                { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }
        return new Response(
            JSON.stringify({ message: "Entrenador actualizado exitosamente." }),
            { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error("Turso DB Error (PUT Entrenadores):", error.message);
        return new Response(
            JSON.stringify({ error: 'Fallo al actualizar el entrenador: ' + error.message }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }
};

export const DELETE = async ({ url }) => {
    const { client, error } = getDbClient();
    if (error) return error;

    const id_entrenador = url.searchParams.get('id');

    if (!id_entrenador) {
        return new Response(
            JSON.stringify({ error: "El ID del entrenador es obligatorio para eliminar." }),
            { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

    const sql = `DELETE FROM entrenadores WHERE id_entrenador = ?`;

    try {
        const result = await client.execute({
            sql: sql,
            args: [id_entrenador]
        });

        if (result.rowsAffected === 0) {
            return new Response(
                JSON.stringify({ message: "No se encontró el entrenador con ese ID." }),
                { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(null, {
            status: 204,
            headers: CORS_HEADERS
        });
    } catch (error) {
        console.error("Turso DB Error (DELETE Entrenadores):", error.message);
        return new Response(
            JSON.stringify({ error: 'Fallo al eliminar el entrenador: ' + error.message }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }
};
