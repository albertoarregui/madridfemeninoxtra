import { createClient } from '@libsql/client';
import type { APIRoute } from 'astro';
import { slugify } from '../../utils/players';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const temporada    = url.searchParams.get('temporada')     ?? '';
    const competicion  = url.searchParams.get('competicion')   ?? '';
    const posicion     = url.searchParams.get('posicion')      ?? '';
    const participacion = url.searchParams.get('participacion') ?? 'todos';
    const fechaDesde   = url.searchParams.get('fecha_desde')   ?? '';
    const fechaHasta   = url.searchParams.get('fecha_hasta')   ?? '';
    const idPartido    = url.searchParams.get('id_partido')    ?? '';

    const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = import.meta.env;

    if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
        return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500, headers: CORS_HEADERS });
    }

    const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

    try {
        const matchWhere: string[] = ['p.goles_rm IS NOT NULL'];
        const params: (string | number)[] = [];

        if (temporada) {
            matchWhere.push('t.temporada = ?');
            params.push(temporada);
        }

        if (competicion === 'oficiales') {
            matchWhere.push("c.competicion IN ('Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España')");
        } else if (competicion) {
            matchWhere.push('c.competicion = ?');
            params.push(competicion);
        }

        if (fechaDesde) {
            matchWhere.push("(substr(p.fecha,7,4)||'-'||substr(p.fecha,4,2)||'-'||substr(p.fecha,1,2)) >= ?");
            params.push(fechaDesde);
        }

        if (fechaHasta) {
            matchWhere.push("(substr(p.fecha,7,4)||'-'||substr(p.fecha,4,2)||'-'||substr(p.fecha,1,2)) <= ?");
            params.push(fechaHasta);
        }

        if (idPartido) {
            matchWhere.push('p.id_partido = ?');
            params.push(Number(idPartido));
        }

        const matchWhereStr = `WHERE ${matchWhere.join(' AND ')}`;

        let alineacionCond = '';
        if (participacion === 'titular') {
            alineacionCond = 'AND a.titular = 1';
        } else if (participacion === 'suplente') {
            alineacionCond = 'AND a.titular = 0 AND a.minuto_entrada IS NOT NULL';
        }

        const playerWhere: string[] = [];
        if (posicion) {
            playerWhere.push('j.posicion = ?');
            params.push(posicion);
        }
        const playerWhereStr = playerWhere.length > 0 ? `WHERE ${playerWhere.join(' AND ')}` : '';

        const query = `
            WITH
            filtered_matches AS (
                SELECT p.id_partido, p.id_temporada, p.id_competicion,
                       CAST(p.goles_rm AS INTEGER) as goles_rm,
                       CAST(p.goles_rival AS INTEGER) as goles_rival
                FROM partidos p
                JOIN temporadas t ON p.id_temporada = t.id_temporada
                JOIN competiciones c ON p.id_competicion = c.id_competicion
                ${matchWhereStr}
            ),
            player_matches AS (
                SELECT a.id_jugadora, fm.id_partido,
                       fm.goles_rm, fm.goles_rival,
                       a.titular, a.minutos_jugados,
                       a.minuto_entrada, a.minuto_salida, a.convocada
                FROM alineaciones a
                JOIN filtered_matches fm ON a.id_partido = fm.id_partido
                ${alineacionCond}
            ),
            player_ids AS (
                SELECT DISTINCT id_jugadora FROM player_matches
            ),
            player_base AS (
                SELECT id_jugadora,
                    SUM(CASE WHEN convocada = 1 THEN 1 ELSE 0 END) as convocatorias,
                    SUM(CASE WHEN minutos_jugados > 0 THEN 1 ELSE 0 END) as partidos,
                    SUM(CASE WHEN titular = 1 THEN 1 ELSE 0 END) as titularidades,
                    SUM(minutos_jugados) as minutos,
                    SUM(CASE WHEN minuto_entrada IS NOT NULL THEN 1 ELSE 0 END) as cambio_entrada,
                    SUM(CASE WHEN minuto_salida IS NOT NULL THEN 1 ELSE 0 END) as cambio_salida,
                    SUM(CASE WHEN minutos_jugados > 0 AND goles_rm > goles_rival THEN 1 ELSE 0 END) as victorias,
                    SUM(CASE WHEN minutos_jugados > 0 AND goles_rival = 0 THEN 1 ELSE 0 END) as porterias_cero
                FROM player_matches
                GROUP BY id_jugadora
            ),
            goal_details AS (
                SELECT ga.goleadora as id_jugadora, ga.id_partido,
                       fm.goles_rm, fm.goles_rival,
                       ROW_NUMBER() OVER (PARTITION BY ga.id_partido ORDER BY ga.minuto ASC) as goal_rank
                FROM goles_y_asistencias ga
                JOIN filtered_matches fm ON ga.id_partido = fm.id_partido
                WHERE ga.goleadora IS NOT NULL AND ga.goleadora IN (SELECT id_jugadora FROM player_ids)
            ),
            goals AS (
                SELECT id_jugadora, COUNT(*) as goles FROM goal_details GROUP BY id_jugadora
            ),
            adv_goals AS (
                SELECT id_jugadora,
                    SUM(CASE WHEN goal_rank = 1 THEN 1 ELSE 0 END) as goles_abrelatas,
                    SUM(CASE WHEN goles_rm > goles_rival AND goal_rank = (goles_rival + 1) THEN 1 ELSE 0 END) as goles_victoria,
                    SUM(CASE WHEN goles_rm = goles_rival AND goal_rank = goles_rm THEN 1 ELSE 0 END) as goles_empate
                FROM goal_details GROUP BY id_jugadora
            ),
            penalties AS (
                SELECT ga.goleadora as id_jugadora, COUNT(*) as penaltis
                FROM goles_y_asistencias ga
                JOIN filtered_matches fm ON ga.id_partido = fm.id_partido
                WHERE ga.goleadora IS NOT NULL
                    AND (LOWER(ga.tipo) = 'penalti' OR LOWER(ga.tipo) = 'p')
                    AND ga.goleadora IN (SELECT id_jugadora FROM player_ids)
                GROUP BY ga.goleadora
            ),
            assists AS (
                SELECT ga.asistente as id_jugadora, COUNT(*) as asistencias
                FROM goles_y_asistencias ga
                JOIN filtered_matches fm ON ga.id_partido = fm.id_partido
                WHERE ga.asistente IS NOT NULL AND ga.asistente IN (SELECT id_jugadora FROM player_ids)
                GROUP BY ga.asistente
            ),
            cards AS (
                SELECT t.id_jugadora,
                    SUM(CASE WHEN UPPER(t.tipo_tarjeta) = 'AMARILLA' THEN 1 ELSE 0 END) as tarjetas_amarillas,
                    SUM(CASE WHEN UPPER(t.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(t.tipo_tarjeta) LIKE '%DOBLE%' OR UPPER(t.tipo_tarjeta) = 'RED' THEN 1 ELSE 0 END) as tarjetas_rojas
                FROM tarjetas t
                JOIN filtered_matches fm ON t.id_partido = fm.id_partido
                WHERE t.id_jugadora IN (SELECT id_jugadora FROM player_ids)
                GROUP BY t.id_jugadora
            ),
            captaincy AS (
                SELECT p.capitana as id_jugadora, COUNT(*) as capitanias
                FROM partidos p
                JOIN filtered_matches fm ON p.id_partido = fm.id_partido
                WHERE p.capitana IS NOT NULL AND p.capitana IN (SELECT id_jugadora FROM player_ids)
                GROUP BY p.capitana
            ),
            indiv AS (
                SELECT ej.id_jugadora,
                    SUM(COALESCE(ej.pases_clave, 0)) as pases_clave,
                    SUM(COALESCE(ej.tiros_totales, 0)) as tiros_totales,
                    SUM(COALESCE(ej.tiros_puerta, 0)) as tiros_puerta,
                    SUM(COALESCE(ej.toques, 0)) as toques,
                    SUM(COALESCE(ej.toques_area_rival, 0)) as toques_area_rival,
                    SUM(COALESCE(ej.pases_completados, 0)) as pases_completados,
                    SUM(COALESCE(ej.pases_totales, 0)) as pases_totales,
                    SUM(COALESCE(ej.pases_ultimo_tercio_completados, 0)) as pases_ultimo_tercio_completados,
                    SUM(COALESCE(ej.pases_ultimo_tercio_totales, 0)) as pases_ultimo_tercio_totales,
                    SUM(COALESCE(ej.pases_largo_completados, 0)) as pases_largo_completados,
                    SUM(COALESCE(ej.pases_largo_totales, 0)) as pases_largo_totales,
                    SUM(COALESCE(ej.centros_completados, 0)) as centros_completados,
                    SUM(COALESCE(ej.centros_totales, 0)) as centros_totales,
                    SUM(COALESCE(ej.regates_completados, 0)) as regates_completados,
                    SUM(COALESCE(ej.regates_totales, 0)) as regates_totales,
                    SUM(COALESCE(ej.duelos_suelo_ganados, 0)) as duelos_suelo_ganados,
                    SUM(COALESCE(ej.duelos_suelo_totales, 0)) as duelos_suelo_totales,
                    SUM(COALESCE(ej.duelos_aereos_ganados, 0)) as duelos_aereos_ganados,
                    SUM(COALESCE(ej.duelos_aereos_totales, 0)) as duelos_aereos_totales,
                    SUM(COALESCE(ej.intercepciones, 0)) as intercepciones,
                    SUM(COALESCE(ej.despejes, 0)) as despejes,
                    SUM(COALESCE(ej.bloqueos, 0)) as bloqueos,
                    SUM(COALESCE(ej.entradas, 0)) as entradas,
                    SUM(COALESCE(ej.recuperaciones, 0)) as recuperaciones,
                    SUM(COALESCE(ej.perdidas, 0)) as perdidas,
                    SUM(COALESCE(ej.fueras_juego, 0)) as fueras_juego,
                    SUM(COALESCE(ej.regateada, 0)) as regateada,
                    SUM(COALESCE(ej.faltas_recibidas, 0)) as faltas_recibidas,
                    SUM(COALESCE(ej.faltas_cometidas, 0)) as faltas_cometidas,
                    SUM(COALESCE(ej.valoracion, 0)) as valoracion,
                    SUM(CASE WHEN ej.valoracion > 0 THEN 1 ELSE 0 END) as valoracion_count
                FROM estadisticas_jugadoras ej
                JOIN filtered_matches fm ON ej.id_partido = fm.id_partido
                WHERE ej.id_jugadora IN (SELECT id_jugadora FROM player_ids)
                GROUP BY ej.id_jugadora
            )
            SELECT
                j.id_jugadora, j.nombre, j.posicion,
                COALESCE(pb.convocatorias, 0) as convocatorias,
                COALESCE(pb.partidos, 0) as partidos,
                COALESCE(pb.titularidades, 0) as titularidades,
                COALESCE(pb.minutos, 0) as minutos,
                COALESCE(pb.cambio_entrada, 0) as cambio_entrada,
                COALESCE(pb.cambio_salida, 0) as cambio_salida,
                COALESCE(pb.victorias, 0) as victorias,
                COALESCE(pb.porterias_cero, 0) as porterias_cero,
                COALESCE(g.goles, 0) as goles,
                COALESCE(a.asistencias, 0) as asistencias,
                COALESCE(g.goles, 0) + COALESCE(a.asistencias, 0) as goles_generados,
                COALESCE(pen.penaltis, 0) as penaltis,
                COALESCE(adv.goles_abrelatas, 0) as goles_abrelatas,
                COALESCE(adv.goles_victoria, 0) as goles_victoria,
                COALESCE(adv.goles_empate, 0) as goles_empate,
                COALESCE(c.tarjetas_amarillas, 0) as tarjetas_amarillas,
                COALESCE(c.tarjetas_rojas, 0) as tarjetas_rojas,
                COALESCE(cap.capitanias, 0) as capitanias,
                COALESCE(i.pases_clave, 0) as pases_clave,
                COALESCE(i.tiros_totales, 0) as tiros_totales,
                COALESCE(i.tiros_puerta, 0) as tiros_puerta,
                COALESCE(i.toques, 0) as toques,
                COALESCE(i.toques_area_rival, 0) as toques_area_rival,
                COALESCE(i.pases_completados, 0) as pases_completados,
                COALESCE(i.pases_totales, 0) as pases_totales,
                COALESCE(i.pases_ultimo_tercio_completados, 0) as pases_ultimo_tercio_completados,
                COALESCE(i.pases_ultimo_tercio_totales, 0) as pases_ultimo_tercio_totales,
                COALESCE(i.pases_largo_completados, 0) as pases_largo_completados,
                COALESCE(i.pases_largo_totales, 0) as pases_largo_totales,
                COALESCE(i.centros_completados, 0) as centros_completados,
                COALESCE(i.centros_totales, 0) as centros_totales,
                COALESCE(i.regates_completados, 0) as regates_completados,
                COALESCE(i.regates_totales, 0) as regates_totales,
                COALESCE(i.duelos_suelo_ganados, 0) as duelos_suelo_ganados,
                COALESCE(i.duelos_suelo_totales, 0) as duelos_suelo_totales,
                COALESCE(i.duelos_aereos_ganados, 0) as duelos_aereos_ganados,
                COALESCE(i.duelos_aereos_totales, 0) as duelos_aereos_totales,
                COALESCE(i.intercepciones, 0) as intercepciones,
                COALESCE(i.despejes, 0) as despejes,
                COALESCE(i.bloqueos, 0) as bloqueos,
                COALESCE(i.entradas, 0) as entradas,
                COALESCE(i.recuperaciones, 0) as recuperaciones,
                COALESCE(i.perdidas, 0) as perdidas,
                COALESCE(i.fueras_juego, 0) as fueras_juego,
                COALESCE(i.regateada, 0) as regateada,
                COALESCE(i.faltas_recibidas, 0) as faltas_recibidas,
                COALESCE(i.faltas_cometidas, 0) as faltas_cometidas,
                COALESCE(i.valoracion, 0) as valoracion,
                COALESCE(i.valoracion_count, 0) as valoracion_count
            FROM jugadoras j
            LEFT JOIN player_base pb ON j.id_jugadora = pb.id_jugadora
            LEFT JOIN goals g ON j.id_jugadora = g.id_jugadora
            LEFT JOIN assists a ON j.id_jugadora = a.id_jugadora
            LEFT JOIN penalties pen ON j.id_jugadora = pen.id_jugadora
            LEFT JOIN adv_goals adv ON j.id_jugadora = adv.id_jugadora
            LEFT JOIN cards c ON j.id_jugadora = c.id_jugadora
            LEFT JOIN captaincy cap ON j.id_jugadora = cap.id_jugadora
            LEFT JOIN indiv i ON j.id_jugadora = i.id_jugadora
            ${playerWhereStr}
            ORDER BY j.nombre
        `;

        const result = params.length > 0
            ? await client.execute({ sql: query, args: params })
            : await client.execute(query);

        const data = result.rows.map((row: any) => ({
            id_jugadora: Number(row.id_jugadora),
            nombre: String(row.nombre),
            slug: slugify(String(row.nombre)),
            posicion: String(row.posicion ?? ''),
            convocatorias: Number(row.convocatorias),
            partidos: Number(row.partidos),
            titularidades: Number(row.titularidades),
            minutos: Number(row.minutos),
            cambio_entrada: Number(row.cambio_entrada),
            cambio_salida: Number(row.cambio_salida),
            victorias: Number(row.victorias),
            porterias_cero: Number(row.porterias_cero),
            goles: Number(row.goles),
            asistencias: Number(row.asistencias),
            goles_generados: Number(row.goles_generados),
            penaltis: Number(row.penaltis),
            goles_abrelatas: Number(row.goles_abrelatas),
            goles_victoria: Number(row.goles_victoria),
            goles_empate: Number(row.goles_empate),
            tarjetas_amarillas: Number(row.tarjetas_amarillas),
            tarjetas_rojas: Number(row.tarjetas_rojas),
            capitanias: Number(row.capitanias),
            pases_clave: Number(row.pases_clave),
            tiros_totales: Number(row.tiros_totales),
            tiros_puerta: Number(row.tiros_puerta),
            toques: Number(row.toques),
            toques_area_rival: Number(row.toques_area_rival),
            pases_completados: Number(row.pases_completados),
            pases_totales: Number(row.pases_totales),
            pases_ultimo_tercio_completados: Number(row.pases_ultimo_tercio_completados),
            pases_ultimo_tercio_totales: Number(row.pases_ultimo_tercio_totales),
            pases_largo_completados: Number(row.pases_largo_completados),
            pases_largo_totales: Number(row.pases_largo_totales),
            centros_completados: Number(row.centros_completados),
            centros_totales: Number(row.centros_totales),
            regates_completados: Number(row.regates_completados),
            regates_totales: Number(row.regates_totales),
            duelos_suelo_ganados: Number(row.duelos_suelo_ganados),
            duelos_suelo_totales: Number(row.duelos_suelo_totales),
            duelos_aereos_ganados: Number(row.duelos_aereos_ganados),
            duelos_aereos_totales: Number(row.duelos_aereos_totales),
            intercepciones: Number(row.intercepciones),
            despejes: Number(row.despejes),
            bloqueos: Number(row.bloqueos),
            entradas: Number(row.entradas),
            recuperaciones: Number(row.recuperaciones),
            perdidas: Number(row.perdidas),
            fueras_juego: Number(row.fueras_juego),
            regateada: Number(row.regateada),
            faltas_recibidas: Number(row.faltas_recibidas),
            faltas_cometidas: Number(row.faltas_cometidas),
            valoracion: Number(row.valoracion),
            valoracion_count: Number(row.valoracion_count),
        }));

        return new Response(JSON.stringify(data), { status: 200, headers: CORS_HEADERS });
    } catch (err: any) {
        console.error('[buscador-avanzado]', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
};
