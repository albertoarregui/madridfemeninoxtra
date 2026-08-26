import { getDbClient } from '../../../db/client';
import { jsonResponse, jsonError } from '../../../lib/api-cache';
import { cacheTags, tagsAfterWrite } from '../../../lib/cache-tags';
import { invalidarTags } from '../../../utils/cache';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
};

export const GET = async () => {
    const client = await getDbClient();
    if (!client) {
        return jsonError('Fallo de conexión: Credenciales de Turso no configuradas.');
    }

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

        const entrenadores = result.rows.map((row) => {
            let record = {};
            result.columns.forEach((col, index) => {
                record[col] = row[index];
            });
            return record;
        });

        return jsonResponse(entrenadores, { sMaxage: 21600, swr: 86400, tags: [cacheTags.coaches] });
    } catch (error) {
        console.error('Turso DB Error (GET Entrenadores):', error.message);
        return jsonError('Fallo en la consulta de la base de datos: ' + error.message);
    }
};

export const POST = async ({ request }) => {
    const client = await getDbClient();
    if (!client) {
        return jsonError('Fallo de conexión: Credenciales de Turso no configuradas.');
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return jsonError('Formato JSON no válido en el cuerpo de la solicitud.', 400);
    }

    const { nombre, ciudad, pais, fecha_nacimiento, foto_url } = body;

    if (!nombre || !ciudad || !pais || !fecha_nacimiento) {
        return jsonError('Faltan campos obligatorios (nombre, ciudad, pais, fecha_nacimiento).', 400);
    }

    const sql = `
        INSERT INTO entrenadores (nombre, ciudad, pais, fecha_nacimiento, foto_url)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        const result = await client.execute({
            sql,
            args: [nombre, ciudad, pais, fecha_nacimiento, foto_url],
        });

        await invalidarTags(tagsAfterWrite.coach(String(result.lastInsertRowid)));

        return jsonResponse({ message: 'Entrenador creado exitosamente.' }, { sMaxage: 0, status: 201 });
    } catch (error) {
        console.error('Turso DB Error (POST Entrenadores):', error.message);
        return jsonError('Fallo al insertar el entrenador: ' + error.message);
    }
};

export const PUT = async ({ request, url }) => {
    const client = await getDbClient();
    if (!client) {
        return jsonError('Fallo de conexión: Credenciales de Turso no configuradas.');
    }

    const id_entrenador = url.searchParams.get('id');

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return jsonError('Formato JSON no válido en el cuerpo de la solicitud.', 400);
    }

    const { nombre, ciudad, pais, fecha_nacimiento, foto_url } = body;

    if (!id_entrenador || !nombre || !ciudad || !pais || !fecha_nacimiento) {
        return jsonError('Faltan campos obligatorios para la actualización (ID o datos del entrenador).', 400);
    }

    const sql = `
        UPDATE entrenadores
        SET nombre = ?, ciudad = ?, pais = ?, fecha_nacimiento = ?, foto_url = ?
        WHERE id_entrenador = ?
    `;

    try {
        const result = await client.execute({
            sql,
            args: [nombre, ciudad, pais, fecha_nacimiento, foto_url, id_entrenador],
        });

        if (result.rowsAffected === 0) {
            return jsonResponse({ message: 'No se encontró el entrenador con ese ID.' }, { sMaxage: 0, status: 404 });
        }
        await invalidarTags(tagsAfterWrite.coach(id_entrenador));
        return jsonResponse({ message: 'Entrenador actualizado exitosamente.' }, { sMaxage: 0 });
    } catch (error) {
        console.error('Turso DB Error (PUT Entrenadores):', error.message);
        return jsonError('Fallo al actualizar el entrenador: ' + error.message);
    }
};

export const DELETE = async ({ url }) => {
    const client = await getDbClient();
    if (!client) {
        return jsonError('Fallo de conexión: Credenciales de Turso no configuradas.');
    }

    const id_entrenador = url.searchParams.get('id');

    if (!id_entrenador) {
        return jsonError('El ID del entrenador es obligatorio para eliminar.', 400);
    }

    const sql = `DELETE FROM entrenadores WHERE id_entrenador = ?`;

    try {
        const result = await client.execute({ sql, args: [id_entrenador] });

        if (result.rowsAffected === 0) {
            return jsonResponse({ message: 'No se encontró el entrenador con ese ID.' }, { sMaxage: 0, status: 404 });
        }

        await invalidarTags(tagsAfterWrite.coach(id_entrenador));

        return new Response(null, { status: 204, headers: CORS_HEADERS });
    } catch (error) {
        console.error('Turso DB Error (DELETE Entrenadores):', error.message);
        return jsonError('Fallo al eliminar el entrenador: ' + error.message);
    }
};
