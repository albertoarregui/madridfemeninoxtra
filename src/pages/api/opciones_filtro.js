import { getDbClient } from '../../db/client';
import { jsonResponse, jsonError } from '../../lib/api-cache';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
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
        return jsonError('Fallo de conexión: Credenciales de Turso (URL o Token) no configuradas en el entorno.');
    }

    try {
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
            competiciones: competicionesResult.rows.map((row) => row.competicion),
            temporadas: temporadasResult.rows.map((row) => row.temporada),
        };

        return jsonResponse(opciones, { sMaxage: 3600, swr: 86400 });
    } catch (error) {
        console.error('Error al obtener opciones de filtro (DB):', error.message);
        return jsonError('Fallo en la conexión o consulta de la base de datos: ' + error.message);
    }
};
