import type { APIRoute } from 'astro';
import { fetchPlayersDirectly } from '../../../utils/players';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
    const { slug } = params;
    if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 });

    const season      = url.searchParams.get('season')      ?? '';
    const competition = url.searchParams.get('competition') ?? '';

    try {
        const players = await fetchPlayersDirectly();
        const player = players.find((p: any) => p.slug === slug);
        if (!player) return Response.json({ error: 'Not found' }, { status: 404 });

        const { getPlayersDbClient } = await import('../../../db/client');
        const client = await getPlayersDbClient();
        if (!client) return Response.json({ error: 'DB unavailable' }, { status: 500 });

        const id = player.id_jugadora;

        const OFFICIAL_COMPS = ['Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España'];
        const isOfficial = competition === 'Partidos oficiales';

        const seasonFilter = season ? `AND t.temporada = ?` : '';
        const competitionFilter = isOfficial
            ? `AND c.competicion IN (${OFFICIAL_COMPS.map(() => '?').join(',')})`
            : competition ? `AND c.competicion = ?` : '';
        const compArgs = isOfficial ? OFFICIAL_COMPS : competition ? [competition] : [];
        const filterArgs = [
            ...(season ? [season] : []),
            ...compArgs,
        ];

        const lineupRow = await client.execute({
            sql: `
                SELECT
                    SUM(CASE WHEN al.minutos_jugados > 0 THEN 1 ELSE 0 END) AS partidos,
                    SUM(CASE WHEN al.titular = 1 THEN 1 ELSE 0 END)         AS titularidades,
                    SUM(al.minutos_jugados)                                  AS minutos,
                    SUM(CASE WHEN p.goles_rival = 0 AND al.minutos_jugados > 0 THEN 1 ELSE 0 END) AS porterias_cero,
                    SUM(CASE WHEN al.minutos_jugados > 0 AND p.goles_rm > p.goles_rival THEN 1 ELSE 0 END) AS victorias
                FROM alineaciones al
                JOIN partidos p ON al.id_partido = p.id_partido
                JOIN temporadas t ON p.id_temporada = t.id_temporada
                JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE al.id_jugadora = ? ${seasonFilter} ${competitionFilter}`,
            args: [id, ...filterArgs],
        });

        const golesRow = await client.execute({
            sql: `
                SELECT COUNT(*) AS goles
                FROM goles_y_asistencias g
                JOIN partidos p ON g.id_partido = p.id_partido
                JOIN temporadas t ON p.id_temporada = t.id_temporada
                JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE g.goleadora = ? ${seasonFilter} ${competitionFilter}`,
            args: [id, ...filterArgs],
        });

        const asistRow = await client.execute({
            sql: `
                SELECT COUNT(*) AS asistencias
                FROM goles_y_asistencias g
                JOIN partidos p ON g.id_partido = p.id_partido
                JOIN temporadas t ON p.id_temporada = t.id_temporada
                JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE g.asistente = ? ${seasonFilter} ${competitionFilter}`,
            args: [id, ...filterArgs],
        });

        const cardsRow = await client.execute({
            sql: `
                SELECT
                    SUM(CASE WHEN UPPER(tk.tipo_tarjeta) = 'AMARILLA' THEN 1 ELSE 0 END) AS amarillas,
                    SUM(CASE WHEN UPPER(tk.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(tk.tipo_tarjeta) LIKE '%DOBLE%' THEN 1 ELSE 0 END) AS rojas
                FROM tarjetas tk
                JOIN partidos p ON tk.id_partido = p.id_partido
                JOIN temporadas t ON p.id_temporada = t.id_temporada
                JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE tk.id_jugadora = ? ${seasonFilter} ${competitionFilter}`,
            args: [id, ...filterArgs],
        });

        const ejRow = await client.execute({
            sql: `
                SELECT
                    SUM(COALESCE(ej.pases_clave, 0))               AS pases_clave,
                    SUM(COALESCE(ej.tiros_totales, 0))              AS tiros_totales,
                    SUM(COALESCE(ej.tiros_puerta, 0))               AS tiros_puerta,
                    SUM(COALESCE(ej.toques, 0))                     AS toques,
                    SUM(COALESCE(ej.toques_area_rival, 0))          AS toques_area_rival,
                    SUM(COALESCE(ej.pases_completados, 0))          AS pases_completados,
                    SUM(COALESCE(ej.pases_totales, 0))              AS pases_totales,
                    SUM(COALESCE(ej.regates_completados, 0))        AS regates_completados,
                    SUM(COALESCE(ej.regates_totales, 0))            AS regates_totales,
                    SUM(COALESCE(ej.duelos_suelo_ganados, 0))       AS duelos_suelo_ganados,
                    SUM(COALESCE(ej.duelos_suelo_totales, 0))       AS duelos_suelo_totales,
                    SUM(COALESCE(ej.duelos_aereos_ganados, 0))      AS duelos_aereos_ganados,
                    SUM(COALESCE(ej.duelos_aereos_totales, 0))      AS duelos_aereos_totales,
                    SUM(COALESCE(ej.intercepciones, 0))             AS intercepciones,
                    SUM(COALESCE(ej.entradas, 0))                   AS entradas,
                    SUM(COALESCE(ej.bloqueos, 0))                   AS bloqueos,
                    SUM(COALESCE(ej.recuperaciones, 0))             AS recuperaciones,
                    SUM(COALESCE(ej.perdidas, 0))                   AS perdidas,
                    SUM(COALESCE(ej.faltas_recibidas, 0))           AS faltas_recibidas,
                    SUM(COALESCE(ej.faltas_cometidas, 0))           AS faltas_cometidas,
                    SUM(COALESCE(ej.valoracion, 0))                 AS valoracion_total,
                    SUM(CASE WHEN ej.valoracion > 0 THEN 1 ELSE 0 END) AS valoracion_count
                FROM estadisticas_jugadoras ej
                JOIN partidos p ON ej.id_partido = p.id_partido
                JOIN temporadas t ON p.id_temporada = t.id_temporada
                JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE ej.id_jugadora = ? ${seasonFilter} ${competitionFilter}`,
            args: [id, ...filterArgs],
        });

        const optionsRow = await client.execute({
            sql: `
                SELECT DISTINCT t.temporada, c.competicion
                FROM alineaciones al
                JOIN partidos p ON al.id_partido = p.id_partido
                JOIN temporadas t ON p.id_temporada = t.id_temporada
                JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE al.id_jugadora = ? AND al.minutos_jugados > 0
                ORDER BY t.temporada DESC, c.competicion ASC`,
            args: [id],
        });

        const seasons = [...new Set((optionsRow.rows as any[]).map(r => r.temporada))];
        const competitions = [...new Set((optionsRow.rows as any[]).map(r => r.competicion))];

        const l  = lineupRow.rows[0]  as any;
        const g  = golesRow.rows[0]   as any;
        const a  = asistRow.rows[0]   as any;
        const c  = cardsRow.rows[0]   as any;
        const ej = ejRow.rows[0]      as any;

        const vCount = Number(ej?.valoracion_count ?? 0);

        return Response.json({
            slug,
            nombre:       player.nombre,
            imageUrl:     player.imageUrl,
            posicion:     player.posicion,
            seasons,
            competitions,
            stats: {
                partidos:            Number(l?.partidos        ?? 0),
                titularidades:       Number(l?.titularidades   ?? 0),
                minutos:             Number(l?.minutos         ?? 0),
                victorias:           Number(l?.victorias       ?? 0),
                porterias_cero:      Number(l?.porterias_cero  ?? 0),
                goles:               Number(g?.goles           ?? 0),
                asistencias:         Number(a?.asistencias     ?? 0),
                amarillas:           Number(c?.amarillas       ?? 0),
                rojas:               Number(c?.rojas           ?? 0),
                pases_clave:         Number(ej?.pases_clave          ?? 0),
                tiros_totales:       Number(ej?.tiros_totales        ?? 0),
                tiros_puerta:        Number(ej?.tiros_puerta         ?? 0),
                toques:              Number(ej?.toques               ?? 0),
                toques_area_rival:   Number(ej?.toques_area_rival    ?? 0),
                pases_completados:   Number(ej?.pases_completados    ?? 0),
                pases_totales:       Number(ej?.pases_totales        ?? 0),
                regates_completados: Number(ej?.regates_completados  ?? 0),
                regates_totales:     Number(ej?.regates_totales      ?? 0),
                duelos_suelo_ganados:   Number(ej?.duelos_suelo_ganados   ?? 0),
                duelos_suelo_totales:   Number(ej?.duelos_suelo_totales  ?? 0),
                duelos_aereos_ganados:  Number(ej?.duelos_aereos_ganados ?? 0),
                duelos_aereos_totales:  Number(ej?.duelos_aereos_totales ?? 0),
                intercepciones:      Number(ej?.intercepciones       ?? 0),
                entradas:            Number(ej?.entradas             ?? 0),
                bloqueos:            Number(ej?.bloqueos             ?? 0),
                recuperaciones:      Number(ej?.recuperaciones       ?? 0),
                perdidas:            Number(ej?.perdidas             ?? 0),
                faltas_recibidas:    Number(ej?.faltas_recibidas     ?? 0),
                faltas_cometidas:    Number(ej?.faltas_cometidas     ?? 0),
                valoracion_media:    vCount > 0 ? Math.round((Number(ej.valoracion_total) / vCount) * 10) / 10 : 0,
            },
        });
    } catch (e) {
        console.error('[player-radar]', e);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
};
