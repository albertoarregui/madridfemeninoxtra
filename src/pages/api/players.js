import { getPlayersDbClient } from '../../db/client';
import { jsonResponse, jsonError } from '../../lib/api-cache';

export const GET = async () => {
    const client = await getPlayersDbClient();

    if (!client) {
        return jsonError(
            'Fallo de conexión: Credenciales de Turso (URL o Token) no configuradas en el entorno.',
        );
    }

    try {
        const query = `
            WITH ultima_dorsal AS (
                SELECT
                    id_jugadora,
                    foto_url,
                    foto_perfil_url,
                    ROW_NUMBER() OVER (
                        PARTITION BY id_jugadora
                        ORDER BY id_temporada DESC
                    ) AS rn
                FROM dorsales
            )
            SELECT
                j.id_jugadora,
                j.nombre,
                j.fecha_nacimiento,
                j.pais_origen,
                j.iso,
                j.altura,
                j.peso,
                j.posicion,
                ud.foto_url,
                ud.foto_perfil_url
            FROM jugadoras j
            LEFT JOIN ultima_dorsal ud
                ON ud.id_jugadora = j.id_jugadora
               AND ud.rn = 1
            ORDER BY j.nombre ASC
        `;

        const result = await client.execute({ sql: query, params: [], parse: true });

        return jsonResponse(result.rows, { sMaxage: 3600, swr: 86400 });
    } catch (error) {
        console.error('Error FATAL al procesar el listado de jugadoras:', error.stack);
        return jsonError('Fallo en la consulta de la base de datos.', 500, {
            details: error.message,
        });
    }
};
