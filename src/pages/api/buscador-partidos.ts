import type { APIRoute } from 'astro';
import { slugify } from '../../utils/players';
import { getDbClient } from '../../db/client';
import { jsonResponse, jsonError } from '../../lib/api-cache';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const RM_ID = 1;

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const temporada   = url.searchParams.get('temporada')   ?? '';
    const competicion = url.searchParams.get('competicion') ?? '';
    const condicion   = url.searchParams.get('condicion')   ?? '';
    const resultado   = url.searchParams.get('resultado')   ?? '';
    const idRival     = url.searchParams.get('id_rival')    ?? '';
    const fechaDesde  = url.searchParams.get('fecha_desde') ?? '';
    const fechaHasta  = url.searchParams.get('fecha_hasta') ?? '';

    const client = await getDbClient();
    if (!client) {
        return jsonError('DB not configured');
    }

    try {
        const where: string[] = ['p.goles_rm IS NOT NULL', 'p.fecha <= ?'];
        const params: (string | number)[] = [new Date().toISOString().split('T')[0]];

        if (temporada) {
            where.push('t.temporada = ?');
            params.push(temporada);
        }

        if (competicion === 'oficiales') {
            where.push("c.competicion IN ('Liga F', 'Primera Iberdrola', 'UWCL', 'Copa de la Reina', 'Supercopa de España')");
        } else if (competicion) {
            where.push('c.competicion = ?');
            params.push(competicion);
        }

        if (condicion === 'local') {
            where.push('p.id_club_local = ?');
            params.push(RM_ID);
        } else if (condicion === 'visitante') {
            where.push('p.id_club_visitante = ?');
            params.push(RM_ID);
        }

        if (resultado === 'V') {
            where.push('CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER)');
        } else if (resultado === 'D') {
            where.push('CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER)');
        } else if (resultado === 'E') {
            where.push('CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER)');
        }

        if (idRival) {
            where.push('(CASE WHEN p.id_club_local = ? THEN p.id_club_visitante ELSE p.id_club_local END) = ?');
            params.push(RM_ID, Number(idRival));
        }

        if (fechaDesde) {
            where.push('p.fecha >= ?');
            params.push(fechaDesde);
        }
        if (fechaHasta) {
            where.push('p.fecha <= ?');
            params.push(fechaHasta);
        }

        const whereStr = `WHERE ${where.join(' AND ')}`;

        const side = (localCol: string, awayCol: string, alias: string) =>
            `CASE WHEN p.id_club_local = ${RM_ID} THEN COALESCE(ep.${localCol}, 0) ELSE COALESCE(ep.${awayCol}, 0) END AS ${alias}`;
        const rmStats = [
            side('posesion_rm', 'posesion_rival', 'posesion'),
            side('xg_a_favor', 'xg_en_contra', 'xg'),
            side('xg_en_contra', 'xg_a_favor', 'xg_contra'),
            side('rm_asistencias_esperadas', 'rival_asistencias_esperadas', 'xa'),
            side('rm_grandes_ocasiones', 'rival_grandes_ocasiones', 'grandes_ocasiones'),
            side('rm_tiros', 'rival_tiros', 'tiros'),
            side('rm_tiros_puerta', 'rival_tiros_puerta', 'tiros_puerta'),
            side('rm_tiros_palo', 'rival_tiros_palo', 'tiros_palo'),
            side('rm_tiros_libres', 'rival_tiros_libres', 'tiros_libres'),
            side('rm_corners', 'rival_corners', 'corners'),
            side('rm_paradas', 'rival_paradas', 'paradas'),
            side('rm_toques_area_rival', 'rival_toques_area_rival', 'toques_area'),
            side('rm_regates', 'rival_regates', 'regates'),
            side('rm_pases_completados', 'rival_pases_completados', 'pases_completados'),
            side('rm_pases_totales', 'rival_pases_totales', 'pases_totales'),
            side('rm_pases_largo_completados', 'rival_pases_largo_completados', 'pases_largo_completados'),
            side('rm_pases_largo_totales', 'rival_pases_largo_totales', 'pases_largo_totales'),
            side('rm_pases_tercio_completados', 'rival_pases_tercio_completados', 'pases_tercio_completados'),
            side('rm_pases_tercio_totales', 'rival_pases_tercio_totales', 'pases_tercio_totales'),
            side('rm_centros_completados', 'rival_centros_completados', 'centros_completados'),
            side('rm_centros_totales', 'rival_centros_totales', 'centros_totales'),
            side('rm_entradas_ganadas', 'rival_entradas_ganadas', 'entradas_ganadas'),
            side('rm_entradas_totales', 'rival_entradas_totales', 'entradas_totales'),
            side('rm_intercepciones', 'rival_intercepciones', 'intercepciones'),
            side('rm_recuperaciones', 'rival_recuperaciones', 'recuperaciones'),
            side('rm_despejes', 'rival_despejes', 'despejes'),
            side('rm_duelos_suelo_ganados', 'rival_duelos_suelo_ganados', 'duelos_suelo_ganados'),
            side('rm_duelos_suelo_totales', 'rival_duelos_suelo_totales', 'duelos_suelo_totales'),
            side('rm_duelos_aereos_ganados', 'rival_duelos_aereos_ganados', 'duelos_aereos_ganados'),
            side('rm_duelos_aereos_totales', 'rival_duelos_aereos_totales', 'duelos_aereos_totales'),
            side('rm_fueras_juego', 'rival_fueras_juego', 'fueras_juego'),
        ].join(',\n                ');

        const query = `
            SELECT
                p.id_partido, p.fecha, p.jornada,
                t.temporada,
                c.competicion,
                cl.nombre AS club_local,  cl.foto_url AS local_foto,
                cv.nombre AS club_visitante, cv.foto_url AS visitante_foto,
                CAST(p.goles_rm AS INTEGER)    AS goles_rm,
                CAST(p.goles_rival AS INTEGER) AS goles_rival,
                CASE WHEN p.id_club_local = ${RM_ID} THEN 'local' ELSE 'visitante' END AS condicion,
                CASE WHEN p.id_club_local = ${RM_ID} THEN cv.nombre   ELSE cl.nombre   END AS rival,
                CASE WHEN p.id_club_local = ${RM_ID} THEN cv.foto_url ELSE cl.foto_url END AS rival_foto,
                CASE WHEN p.id_club_local = ${RM_ID} THEN p.id_club_visitante ELSE p.id_club_local END AS id_rival,
                CASE
                    WHEN CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 'V'
                    WHEN CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 'D'
                    ELSE 'E'
                END AS resultado,
                ${rmStats}
            FROM partidos p
            JOIN temporadas t    ON p.id_temporada = t.id_temporada
            JOIN competiciones c ON p.id_competicion = c.id_competicion
            JOIN clubes cl       ON p.id_club_local = cl.id_club
            JOIN clubes cv       ON p.id_club_visitante = cv.id_club
            LEFT JOIN estadisticas_partidos ep ON p.id_partido = ep.id_partido
            ${whereStr}
            ORDER BY p.fecha DESC, p.id_partido DESC
        `;

        const result = await client.execute({ sql: query, args: params });
        const data = result.rows.map((row: any) => {
                const fecha = String(row.fecha ?? '');
                return {
                    id_partido: Number(row.id_partido),
                    slug: `${slugify(String(row.club_local))}-vs-${slugify(String(row.club_visitante))}-${fecha}`,
                    fecha,
                    jornada: row.jornada != null ? String(row.jornada) : '',
                    temporada: String(row.temporada ?? ''),
                    competicion: String(row.competicion ?? ''),
                    condicion: String(row.condicion),
                    resultado: String(row.resultado),
                    rival: String(row.rival ?? ''),
                    rival_foto: row.rival_foto ?? null,
                    id_rival: Number(row.id_rival),
                    goles_rm: Number(row.goles_rm),
                    goles_rival: Number(row.goles_rival),
                    diferencia: Number(row.goles_rm) - Number(row.goles_rival),
                    posesion: Number(row.posesion),
                    xg: Number(row.xg),
                    xg_contra: Number(row.xg_contra),
                    xa: Number(row.xa),
                    grandes_ocasiones: Number(row.grandes_ocasiones),
                    tiros: Number(row.tiros),
                    tiros_puerta: Number(row.tiros_puerta),
                    tiros_palo: Number(row.tiros_palo),
                    tiros_libres: Number(row.tiros_libres),
                    corners: Number(row.corners),
                    paradas: Number(row.paradas),
                    toques_area: Number(row.toques_area),
                    regates: Number(row.regates),
                    pases_completados: Number(row.pases_completados),
                    pases_totales: Number(row.pases_totales),
                    pases_largo_completados: Number(row.pases_largo_completados),
                    pases_largo_totales: Number(row.pases_largo_totales),
                    pases_tercio_completados: Number(row.pases_tercio_completados),
                    pases_tercio_totales: Number(row.pases_tercio_totales),
                    centros_completados: Number(row.centros_completados),
                    centros_totales: Number(row.centros_totales),
                    entradas_ganadas: Number(row.entradas_ganadas),
                    entradas_totales: Number(row.entradas_totales),
                    intercepciones: Number(row.intercepciones),
                    recuperaciones: Number(row.recuperaciones),
                    despejes: Number(row.despejes),
                    duelos_suelo_ganados: Number(row.duelos_suelo_ganados),
                    duelos_suelo_totales: Number(row.duelos_suelo_totales),
                    duelos_aereos_ganados: Number(row.duelos_aereos_ganados),
                    duelos_aereos_totales: Number(row.duelos_aereos_totales),
                    fueras_juego: Number(row.fueras_juego),
                };
        });

        return jsonResponse(data, { sMaxage: 3600, swr: 86400 });
    } catch (err: any) {
        console.error('[buscador-partidos]', err);
        return jsonError(err.message);
    }
};
