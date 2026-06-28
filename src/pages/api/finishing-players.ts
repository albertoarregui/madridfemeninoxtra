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

        const [shotsRow, goalsRow, optionsRow] = await Promise.all([
            client.execute({
                sql: `
                    SELECT
                        ej.id_jugadora                       AS id,
                        j.nombre                             AS name,
                        SUM(COALESCE(ej.tiros_totales, 0))   AS tiros,
                        SUM(COALESCE(ej.tiros_puerta, 0))    AS tiros_puerta
                    FROM estadisticas_jugadoras ej
                    JOIN partidos p      ON ej.id_partido     = p.id_partido
                    JOIN temporadas t    ON p.id_temporada    = t.id_temporada
                    JOIN competiciones c ON p.id_competicion  = c.id_competicion
                    JOIN jugadoras j     ON ej.id_jugadora    = j.id_jugadora
                    WHERE 1=1 ${seasonFilter} ${competitionFilter}
                    GROUP BY ej.id_jugadora
                    HAVING tiros > 0
                    ORDER BY tiros DESC
                `,
                args: filterArgs,
            }),
            client.execute({
                sql: `
                    SELECT g.goleadora AS id, COUNT(*) AS goles
                    FROM goles_y_asistencias g
                    JOIN partidos p      ON g.id_partido      = p.id_partido
                    JOIN temporadas t    ON p.id_temporada    = t.id_temporada
                    JOIN competiciones c ON p.id_competicion  = c.id_competicion
                    WHERE g.goleadora IS NOT NULL AND g.goleadora != '' AND g.goleadora != '0'
                      AND EXISTS (
                          SELECT 1 FROM estadisticas_jugadoras ej2
                          WHERE ej2.id_partido = g.id_partido AND ej2.id_jugadora = g.goleadora
                      )
                      ${seasonFilter} ${competitionFilter}
                    GROUP BY g.goleadora
                `,
                args: filterArgs,
            }),
            client.execute({
                sql: `
                    SELECT DISTINCT t.temporada, c.competicion
                    FROM estadisticas_jugadoras ej
                    JOIN partidos p      ON ej.id_partido     = p.id_partido
                    JOIN temporadas t    ON p.id_temporada    = t.id_temporada
                    JOIN competiciones c ON p.id_competicion  = c.id_competicion
                    ORDER BY t.temporada DESC, c.competicion ASC
                `,
                args: [],
            }),
        ]);

        const goalsById = new Map<string, number>();
        for (const g of goalsRow.rows as any[]) goalsById.set(String(g.id), Number(g.goles) || 0);

        const players = (shotsRow.rows as any[])
            .map(r => ({
                id:          String(r.id),
                name:        String(r.name ?? ''),
                tiros:       Math.round(Number(r.tiros) || 0),
                tirosPuerta: Math.round(Number(r.tiros_puerta) || 0),
                goles:       goalsById.get(String(r.id)) ?? 0,
            }))
            .filter(p => p.tiros >= p.tirosPuerta && p.tirosPuerta >= p.goles && p.tiros > 0)
            .sort((a, b) => b.goles - a.goles || b.tiros - a.tiros);

        const seasons      = [...new Set((optionsRow.rows as any[]).map(x => x.temporada as string))];
        const competitions = [...new Set((optionsRow.rows as any[]).map(x => x.competicion as string))];

        return jsonResponse({ players, seasons, competitions });
    } catch (e) {
        console.error('[finishing-players]', e);
        return jsonError('Internal error', 500);
    }
};
