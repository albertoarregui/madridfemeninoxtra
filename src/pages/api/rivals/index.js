import { getDbClient } from '../../../db/client';
import { jsonResponse, jsonError } from '../../../lib/api-cache';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
        return jsonError('Credenciales de Turso no configuradas.');
    }

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

        return jsonResponse(result.rows, { sMaxage: 21600, swr: 86400 });
    } catch (error) {
        console.error('Turso DB Error (GET Rivals):', error.message);
        return jsonError('Fallo en la consulta de la base de datos: ' + error.message);
    }
};
