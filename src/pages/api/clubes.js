import { getDbClient } from '../../db/client';
import { jsonResponse, jsonError } from '../../lib/api-cache';

export const GET = async () => {
    const client = await getDbClient();
    if (!client) {
        return jsonError('Credenciales de Turso no configuradas.');
    }

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

        return jsonResponse(result.rows, { sMaxage: 21600, swr: 86400 });
    } catch (error) {
        console.error('Turso DB Error en clubes:', error);
        return jsonError('Fallo al consultar clubes: ' + error.message);
    }
};
