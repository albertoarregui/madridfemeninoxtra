import { getDbClient } from '../../../../db/client';
import { jsonResponse, jsonError } from '../../../../lib/api-cache';

const JSON_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};
function parseSlugPartido(slug) {
    if (!slug) return null;

    const parts = slug.split('-');

    const dateIndex = parts.findIndex(p =>
        p.match(/^\d{4}$/) &&
        parts[parts.indexOf(p) + 1] && parts[parts.indexOf(p) + 1].match(/^\d{2}$/) &&
        parts[parts.indexOf(p) + 2] && parts[parts.indexOf(p) + 2].match(/^\d{2}$/)
    );

    if (dateIndex === -1) {
        return null;
    }

    const fecha = parts.slice(dateIndex, dateIndex + 3).join('-');

    return { fecha };
}

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: JSON_HEADERS
    });
};
export const GET = async ({ params }) => {

    const slug = params.slug;
    const slugData = parseSlugPartido(slug);

    if (!slugData) {
        return jsonError('Slug de partido no válido o mal formado.', 400);
    }

    const client = await getDbClient();
    if (!client) {
        return jsonError('Fallo de conexión: Credenciales de Turso no configuradas.');
    }

    try {
        const partidoQuery = `
            SELECT 
                p.club_local, p.club_visitante, p.goles_rm, p.goles_rival,
                p.fecha, p.hora, p.estadio, p.arbitra, p.entrenador,
                c.competicion AS competicion_nombre, t.temporada AS temporada_nombre
            FROM partidos p
            LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
            WHERE p.fecha = ?
        `;

        const partidoResult = await client.execute({
            sql: partidoQuery,
            args: [slugData.fecha],
            parse: true
        });

        const partido = partidoResult.rows[0] || null;

        if (!partido) {
            return jsonError(`Partido no encontrado para la fecha: ${slugData.fecha}.`, 404);
        }

        return jsonResponse(partido, { sMaxage: 21600, swr: 86400 });
    } catch (error) {
        console.error('Turso DB Error (Ficha Partido):', error.message);
        return jsonError('Fallo en la conexión o consulta de la base de datos: ' + error.message);
    }
};