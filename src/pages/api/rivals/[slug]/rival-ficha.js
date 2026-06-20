import { getDbClient } from '../../../../db/client';
import { jsonResponse, jsonError } from '../../../../lib/api-cache';

function mapRowToObject(row, columns) {
    if (!row) return null;
    if (Array.isArray(row) && columns) {
        return columns.reduce((obj, col, index) => {
            obj[col] = row[index];
            return obj;
        }, {});
    }
    return row;
}

function slugToProperName(slug) {
    if (!slug) return '';

    let name = slug.replace(/-/g, ' ');

    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    name = name.replace(/ Del /g, ' del ').replace(/ De La /g, ' de la ');

    return name;
}

function calcularEstadisticasRival(enfrentamientos) {
    let stats = { victorias: 0, empates: 0, derrotas: 0, goles_a_favor: 0, goles_en_contra: 0 };

    for (const p of enfrentamientos) {
        const goles_rm = p.goles_rm || 0;
        const goles_rival = p.goles_rival || 0;

        stats.goles_a_favor += goles_rm;
        stats.goles_en_contra += goles_rival;

        if (goles_rm > goles_rival) {
            stats.victorias++;
        } else if (goles_rm < goles_rival) {
            stats.derrotas++;
        } else {
            stats.empates++;
        }
    }

    const total = enfrentamientos.length;
    stats.total_partidos = total;
    stats.diferencia_goles = stats.goles_a_favor - stats.goles_en_contra;

    stats.porc_victorias = total > 0 ? ((stats.victorias / total) * 100).toFixed(1) + '%' : '0.0%';
    stats.porc_empates = total > 0 ? ((stats.empates / total) * 100).toFixed(1) + '%' : '0.0%';
    stats.porc_derrotas = total > 0 ? ((stats.derrotas / total) * 100).toFixed(1) + '%' : '0.0%';

    return stats;
}

function calcularRankingGA(goleadoras, asistentes) {
    const gaMap = new Map();

    goleadoras.forEach(j => {
        gaMap.set(j.nombre, {
            nombre: j.nombre,
            total: j.total_goles,
            goles: j.total_goles,
            asistencias: 0
        });
    });

    asistentes.forEach(j => {
        const current = gaMap.get(j.nombre);
        if (current) {
            current.total += j.total_asistencias;
            current.asistencias = j.total_asistencias;
        } else {
            gaMap.set(j.nombre, {
                nombre: j.nombre,
                total: j.total_asistencias,
                goles: 0,
                asistencias: j.total_asistencias
            });
        }
    });

    return Array.from(gaMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
}

const JSON_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: JSON_HEADERS
    });
};

export const GET = async ({ params }) => {

    const clubSlugLimpio = params.slug;
    const rivalNombre = slugToProperName(clubSlugLimpio);

    if (!rivalNombre) {
        return jsonError('Slug de club rival no válido o vacío.', 400);
    }

    const client = await getDbClient();
    if (!client) {
        return jsonError('Fallo de conexión: Credenciales de Turso no configuradas.');
    }

    try {
        let club;

        const clubQuery = `
            SELECT 
                id_club, 
                nombre, 
                ciudad, 
                pais,
                fecha_fundacion,
                estadio
            FROM clubes 
            WHERE nombre = ?
        `;

        const clubResult = await client.execute({ sql: clubQuery, args: [rivalNombre] });

        if (clubResult.rows.length === 0) {
            return jsonError(`Club rival con nombre '${rivalNombre}' no encontrado.`, 404);
        }

        club = mapRowToObject(clubResult.rows[0], clubResult.columns);
        const id_club = club.id_club;

        const goleadorasQuery = `
            SELECT
                j.nombre,
                COUNT(g.id_gol_asistencia) AS total_goles
            FROM goles_y_asistencias g
            JOIN partidos p ON g.id_partido = p.id_partido
            JOIN jugadoras j ON g.id_jugadora = j.id_jugadora
            WHERE g.tipo = 'GOL' AND (p.id_club_local = ? OR p.id_club_visitante = ?)
            GROUP BY j.nombre
            ORDER BY total_goles DESC
            LIMIT 5
        `;

        const asistentesQuery = `
            SELECT
                j.nombre,
                COUNT(g.id_gol_asistencia) AS total_asistencias
            FROM goles_y_asistencias g
            JOIN partidos p ON g.id_partido = p.id_partido
            JOIN jugadoras j ON g.id_jugadora_asistente = j.id_jugadora
            WHERE g.tipo = 'ASISTENCIA' AND (p.id_club_local = ? OR p.id_club_visitante = ?)
            GROUP BY j.nombre
            ORDER BY total_asistencias DESC
            LIMIT 5
        `;

        const partidosQuery = `
            SELECT
                IFNULL(p.goles_rm, 0) AS goles_rm,
                IFNULL(p.goles_rival, 0) AS goles_rival
            FROM partidos p
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
            WHERE cl.nombre = ? OR cv.nombre = ?
        `;

        const [goleadorasResult, asistentesResult, partidosResult] = await Promise.all([
            client.execute({ sql: goleadorasQuery, args: [id_club, id_club], parse: true }),
            client.execute({ sql: asistentesQuery, args: [id_club, id_club], parse: true }),
            client.execute({ sql: partidosQuery, args: [rivalNombre, rivalNombre], parse: true }),
        ]);

        const goleadoras = goleadorasResult.rows;
        const asistentes = asistentesResult.rows;
        const enfrentamientos = partidosResult.rows;
        const stats = calcularEstadisticasRival(enfrentamientos);
        const rankingGA = calcularRankingGA(goleadoras, asistentes);

        const fichaClub = {
            ...club,
            slug: clubSlugLimpio,
            estadisticas: stats,
            ranking_goleadoras: goleadoras.map(j => ({ nombre: j.nombre, total: j.total_goles })),
            ranking_asistentes: asistentes.map(j => ({ nombre: j.nombre, total: j.total_asistencias })),
            ranking_ga: rankingGA,
        };

        return jsonResponse(fichaClub, { sMaxage: 3600, swr: 86400 });
    } catch (error) {
        console.error('Error durante la ejecución de la API Ficha Rival:', error.message);
        return jsonError('Fallo en la conexión o consulta de la base de datos: ' + error.message);
    }
};