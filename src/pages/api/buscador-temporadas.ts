import type { APIRoute } from 'astro';
import { getDbClient } from '../../db/client';
import { jsonResponse, jsonError } from '../../lib/api-cache';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const competicion = url.searchParams.get('competicion') ?? '';

    const client = await getDbClient();
    if (!client) {
        return jsonError('DB not configured');
    }

    try {
        const where: string[] = ['p.goles_rm IS NOT NULL', 'p.fecha <= ?'];
        const params: (string | number)[] = [new Date().toISOString().split('T')[0]];

        if (competicion === 'oficiales') {
            where.push("c.competicion IN ('Liga F', 'Primera Iberdrola', 'UWCL', 'Copa de la Reina', 'Supercopa de España')");
        } else if (competicion) {
            where.push('c.competicion = ?');
            params.push(competicion);
        }

        const whereStr = `WHERE ${where.join(' AND ')}`;

        const query = `
            SELECT
                t.temporada,
                COUNT(*) AS pj,
                SUM(CASE WHEN CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 1 ELSE 0 END) AS victorias,
                SUM(CASE WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) THEN 1 ELSE 0 END) AS empates,
                SUM(CASE WHEN CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 1 ELSE 0 END) AS derrotas,
                SUM(CAST(p.goles_rm AS INTEGER))    AS gf,
                SUM(CAST(p.goles_rival AS INTEGER)) AS gc,
                SUM(CASE WHEN CAST(p.goles_rival AS INTEGER) = 0 THEN 1 ELSE 0 END) AS porterias_cero,
                AVG(CASE WHEN p.id_club_local = 1 THEN ep.posesion_rm ELSE ep.posesion_rival END) AS posesion,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.xg_a_favor, 0)  ELSE COALESCE(ep.xg_en_contra, 0) END) AS xg,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.xg_en_contra, 0) ELSE COALESCE(ep.xg_a_favor, 0)  END) AS xg_contra,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_tiros, 0)        ELSE COALESCE(ep.rival_tiros, 0)        END) AS tiros,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_tiros_puerta, 0) ELSE COALESCE(ep.rival_tiros_puerta, 0) END) AS tiros_puerta,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_corners, 0)      ELSE COALESCE(ep.rival_corners, 0)      END) AS corners,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_paradas, 0)      ELSE COALESCE(ep.rival_paradas, 0)      END) AS paradas,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_grandes_ocasiones, 0) ELSE COALESCE(ep.rival_grandes_ocasiones, 0) END) AS grandes_ocasiones,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_asistencias_esperadas, 0) ELSE COALESCE(ep.rival_asistencias_esperadas, 0) END) AS xa,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_pases_completados, 0) ELSE COALESCE(ep.rival_pases_completados, 0) END) AS pases_completados,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_regates, 0)      ELSE COALESCE(ep.rival_regates, 0)      END) AS regates,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_entradas_ganadas, 0) ELSE COALESCE(ep.rival_entradas_ganadas, 0) END) AS entradas_ganadas,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_intercepciones, 0) ELSE COALESCE(ep.rival_intercepciones, 0) END) AS intercepciones,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_recuperaciones, 0) ELSE COALESCE(ep.rival_recuperaciones, 0) END) AS recuperaciones,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_despejes, 0)     ELSE COALESCE(ep.rival_despejes, 0)     END) AS despejes,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_duelos_suelo_ganados, 0) ELSE COALESCE(ep.rival_duelos_suelo_ganados, 0) END) AS duelos_suelo_ganados,
                SUM(CASE WHEN p.id_club_local = 1 THEN COALESCE(ep.rm_duelos_aereos_ganados, 0) ELSE COALESCE(ep.rival_duelos_aereos_ganados, 0) END) AS duelos_aereos_ganados
            FROM partidos p
            JOIN temporadas t    ON p.id_temporada = t.id_temporada
            JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN estadisticas_partidos ep ON p.id_partido = ep.id_partido
            ${whereStr}
            GROUP BY t.id_temporada, t.temporada
            ORDER BY t.temporada DESC
        `;

        const result = await client.execute({ sql: query, args: params });
        const data = result.rows.map((row: any) => {
                const pj = Number(row.pj);
                const victorias = Number(row.victorias);
                const empates = Number(row.empates);
                const gf = Number(row.gf);
                const gc = Number(row.gc);
                return {
                    temporada: String(row.temporada ?? ''),
                    pj,
                    victorias,
                    empates,
                    derrotas: Number(row.derrotas),
                    gf,
                    gc,
                    dg: gf - gc,
                    puntos: victorias * 3 + empates,
                    pct_victorias: pj > 0 ? Math.round((victorias / pj) * 100) : 0,
                    porterias_cero: Number(row.porterias_cero),
                    posesion: row.posesion != null ? Math.round(Number(row.posesion)) : 0,
                    xg: Number(row.xg),
                    xg_contra: Number(row.xg_contra),
                    xa: Number(row.xa),
                    tiros: Number(row.tiros),
                    tiros_puerta: Number(row.tiros_puerta),
                    corners: Number(row.corners),
                    paradas: Number(row.paradas),
                    grandes_ocasiones: Number(row.grandes_ocasiones),
                    pases_completados: Number(row.pases_completados),
                    regates: Number(row.regates),
                    entradas_ganadas: Number(row.entradas_ganadas),
                    intercepciones: Number(row.intercepciones),
                    recuperaciones: Number(row.recuperaciones),
                    despejes: Number(row.despejes),
                    duelos_suelo_ganados: Number(row.duelos_suelo_ganados),
                    duelos_aereos_ganados: Number(row.duelos_aereos_ganados),
                };
        });

        return jsonResponse(data, { sMaxage: 3600, swr: 86400 });
    } catch (err: any) {
        console.error('[buscador-temporadas]', err);
        return jsonError(err.message);
    }
};
