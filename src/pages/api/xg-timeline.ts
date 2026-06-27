import type { APIRoute } from 'astro';
import { jsonResponse, jsonError } from '../../lib/api-cache';

export const prerender = false;

const OFFICIAL_COMPS = ['Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España'];

export const GET: APIRoute = async ({ url }) => {
    const season      = url.searchParams.get('season')      ?? '';
    const competition = url.searchParams.get('competition') ?? '';
    const isOfficial  = competition === 'Partidos oficiales';

    const seasonFilter      = season ? `AND t.temporada = ?` : '';
    const competitionFilter = isOfficial
        ? `AND c.competicion IN (${OFFICIAL_COMPS.map(() => '?').join(',')})`
        : competition ? `AND c.competicion = ?` : '';
    const compArgs  = isOfficial ? OFFICIAL_COMPS : competition ? [competition] : [];
    const filterArgs = [...(season ? [season] : []), ...compArgs];

    try {
        const { getPlayersDbClient } = await import('../../db/client');
        const client = await getPlayersDbClient();
        if (!client) return jsonError('DB unavailable', 500);

        const [matchesRow, optionsRow] = await Promise.all([
            client.execute({
                sql: `
                    SELECT
                        p.id_partido,
                        p.fecha,
                        CAST(p.goles_rm AS INTEGER)     AS goles_rm,
                        CAST(ep.xg_a_favor AS REAL)     AS xg_a_favor,
                        c.competicion,
                        t.temporada,
                        cl.nombre AS club_local,
                        cv.nombre AS club_visitante
                    FROM estadisticas_partidos ep
                    JOIN partidos p      ON ep.id_partido     = p.id_partido
                    JOIN temporadas t    ON p.id_temporada    = t.id_temporada
                    JOIN competiciones c ON p.id_competicion  = c.id_competicion
                    LEFT JOIN clubes cl  ON p.id_club_local     = cl.id_club
                    LEFT JOIN clubes cv  ON p.id_club_visitante = cv.id_club
                    WHERE ep.xg_a_favor IS NOT NULL
                      AND p.goles_rm IS NOT NULL
                      AND p.goles_rm != ''
                      ${seasonFilter} ${competitionFilter}
                    ORDER BY p.fecha ASC, p.id_partido ASC
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
                    WHERE ep.xg_a_favor IS NOT NULL
                    ORDER BY t.temporada DESC, c.competicion ASC
                `,
                args: [],
            }),
        ]);

        const seasons      = [...new Set((optionsRow.rows as any[]).map(r => r.temporada as string))];
        const competitions = [...new Set((optionsRow.rows as any[]).map(r => r.competicion as string))];

        let cumXg    = 0;
        let cumGoals = 0;
        const matches = (matchesRow.rows as any[]).map((r, i) => {
            const xg    = Number(r.xg_a_favor ?? 0);
            const goals = Number(r.goles_rm   ?? 0);
            cumXg    += xg;
            cumGoals += goals;
            return {
                matchNum:    i + 1,
                fecha:       r.fecha,
                goles:       goals,
                xg:          Math.round(xg    * 100) / 100,
                cumXg:       Math.round(cumXg  * 100) / 100,
                cumGoals,
                competicion: r.competicion,
                temporada:   r.temporada,
                rival:       r.club_local && r.club_visitante
                    ? `${r.club_local} vs ${r.club_visitante}`
                    : '',
            };
        });

        return jsonResponse({ matches, seasons, competitions });
    } catch (e) {
        console.error('[xg-timeline]', e);
        return jsonError('Internal error', 500);
    }
};
