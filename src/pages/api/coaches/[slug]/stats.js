import { getDbClient } from '../../../../db/client';
import { jsonResponse, jsonError } from '../../../../lib/api-cache';

const JSON_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

function slugToProperName(slug) {
    if (!slug) return '';
    return slug.replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: JSON_HEADERS
    });
};
export const GET = async ({ params }) => {

    const slug = params.slug;

    if (!slug) {
        return jsonError('Falta el slug del entrenador en la URL.', 400);
    }

    const client = await getDbClient();
    if (!client) {
        return jsonError('Fallo de conexión: Credenciales de Turso no configuradas.');
    }

    const nombreEntrenador = slugToProperName(slug);

    try {
        let entrenador;

        const fichaQuery = `
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
                nombre = ?
        `;

        const fichaResult = await client.execute({ sql: fichaQuery, args: [nombreEntrenador] });

        if (fichaResult.rows.length === 0) {
            return jsonError(`Entrenador con nombre '${nombreEntrenador}' no encontrado.`, 404);
        }

        entrenador = fichaResult.rows[0];
        const id_entrenador = entrenador.id_entrenador;

        const excludedNames = ["jose manuel lara", "antonio rodriguez"];
        if (entrenador.nombre && excludedNames.includes(entrenador.nombre.toLowerCase().trim())) {
            return jsonError('Este entrenador no tiene ficha pública disponible.', 403);
        }

        const statsQuery = `
            SELECT
                t.temporada,
                c.competicion,
                COUNT(p.id_partido) AS total_partidos,
                SUM(CASE WHEN p.goles_rm > p.goles_rival THEN 1 ELSE 0 END) AS victorias,
                SUM(CASE WHEN p.goles_rm = p.goles_rival THEN 1 ELSE 0 END) AS empates,
                SUM(CASE WHEN p.goles_rm < p.goles_rival THEN 1 ELSE 0 END) AS derrotas
            FROM
                partidos p
            JOIN
                temporadas t ON p.id_temporada = t.id_temporada
            JOIN
                competiciones c ON p.id_competicion = c.id_competicion
            WHERE
                p.id_entrenador = ?
            GROUP BY
                t.temporada, c.competicion
            ORDER BY
                t.temporada DESC, c.competicion ASC
        `;

        const statsResult = await client.execute({
            sql: statsQuery,
            args: [id_entrenador],
            parse: true
        });

        const estadisticasCalculadas = statsResult.rows.map(row => {
            const total = row.total_partidos;
            const victorias = row.victorias;
            const empates = row.empates;
            const derrotas = row.derrotas;

            const statRecord = {
                temporada: row.temporada,
                competicion: row.competicion,
                total_partidos: total,
                victorias: victorias,
                empates: empates,
                derrotas: derrotas,
                porc_victorias: total > 0 ? ((victorias / total) * 100).toFixed(1) + '%' : '0.0%',
                porc_empates: total > 0 ? ((empates / total) * 100).toFixed(1) + '%' : '0.0%',
                porc_derrotas: total > 0 ? ((derrotas / total) * 100).toFixed(1) + '%' : '0.0%'
            };
            return statRecord;
        });

        return jsonResponse(
            {
                ficha: entrenador,
                estadisticas: estadisticasCalculadas,
            },
            { sMaxage: 3600, swr: 86400 },
        );
    } catch (error) {
        console.error('Turso DB Error (Stats Entrenador):', error.message);
        return jsonError('Fallo en la conexión o consulta de la base de datos: ' + error.message);
    }
};