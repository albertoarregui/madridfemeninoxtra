import type { APIRoute } from 'astro';
import { jsonResponse, jsonError } from '../../lib/api-cache';

export const prerender = false;

const OFFICIAL_COMPS = ['Liga F', 'Primera Iberdrola', 'UWCL', 'Copa de la Reina', 'Supercopa de España'];

export const GET: APIRoute = async ({ url }) => {
    const season      = url.searchParams.get('season')      ?? '';
    const competition = url.searchParams.get('competition') ?? '';
    const isOfficial  = competition === 'Partidos oficiales';

    const seasonFilter      = season ? `AND t.temporada = ?` : '';
    const competitionFilter = isOfficial
        ? `AND c.competicion IN (${OFFICIAL_COMPS.map(() => '?').join(',')})`
        : competition ? `AND c.competicion = ?` : '';
    const compArgs   = isOfficial ? OFFICIAL_COMPS : competition ? [competition] : [];
    const filterArgs = [...(season ? [season] : []), ...compArgs];

    try {
        const { getPlayersDbClient } = await import('../../db/client');
        const client = await getPlayersDbClient();
        if (!client) return jsonError('DB unavailable', 500);

        const num = (col: string) => `CAST(NULLIF(${col}, '') AS REAL)`;

        const [aggRow, optionsRow] = await Promise.all([
            client.execute({
                sql: `
                    SELECT
                        COUNT(*)                          AS partidos,
                        SUM(${num('ep.rm_tiros')})        AS sum_tiros,
                        SUM(${num('ep.rm_tiros_puerta')}) AS sum_tiros_puerta,
                        SUM(${num('p.goles_rm')})         AS sum_goles
                    FROM estadisticas_partidos ep
                    JOIN partidos p      ON ep.id_partido     = p.id_partido
                    JOIN temporadas t    ON p.id_temporada    = t.id_temporada
                    JOIN competiciones c ON p.id_competicion  = c.id_competicion
                    WHERE NULLIF(ep.rm_tiros, '') IS NOT NULL ${seasonFilter} ${competitionFilter}
                `,
                args: filterArgs,
            }),
            client.execute({
                sql: `
                    SELECT DISTINCT t.temporada, c.competicion
                    FROM estadisticas_partidos ep
                    JOIN partidos p      ON ep.id_partido     = p.id_partido
                    JOIN temporadas t    ON p.id_temporada    = t.id_temporada
                    JOIN competiciones c ON p.id_competicion  = c.id_competicion
                    ORDER BY t.temporada DESC, c.competicion ASC
                `,
                args: [],
            }),
        ]);

        const r = (aggRow.rows[0] ?? {}) as Record<string, unknown>;
        const i0 = (x: unknown) => Math.round(Number(x) || 0);

        const tiros  = i0(r.sum_tiros);
        const tirosP = i0(r.sum_tiros_puerta);
        const goles  = i0(r.sum_goles);
        const funnel = [
            { stage: 'Tiros',          value: tiros },
            { stage: 'Tiros a puerta', value: tirosP },
            { stage: 'Goles',          value: goles },
        ];
        const conversion = tiros ? Math.round((goles / tiros) * 1000) / 10 : 0;

        const seasons      = [...new Set((optionsRow.rows as any[]).map(x => x.temporada as string))];
        const competitions = [...new Set((optionsRow.rows as any[]).map(x => x.competicion as string))];

        return jsonResponse({ funnel, conversion, matchCount: i0(r.partidos), seasons, competitions });
    } catch (e) {
        console.error('[team-stats]', e);
        return jsonError('Internal error', 500);
    }
};
