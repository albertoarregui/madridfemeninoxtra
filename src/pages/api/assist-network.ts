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

        const [edgesRow, optionsRow] = await Promise.all([
            client.execute({
                sql: `
                    SELECT
                        COALESCE(ja.nombre,  g.asistente) AS from_name,
                        COALESCE(jg.nombre,  g.goleadora)  AS to_name,
                        g.asistente  AS from_id,
                        g.goleadora  AS to_id,
                        COUNT(*)     AS weight,
                        (SELECT foto_url FROM dorsales WHERE id_jugadora = g.asistente ORDER BY id_temporada DESC LIMIT 1) AS from_img,
                        (SELECT foto_url FROM dorsales WHERE id_jugadora = g.goleadora  ORDER BY id_temporada DESC LIMIT 1) AS to_img
                    FROM goles_y_asistencias g
                    JOIN  partidos p      ON g.id_partido      = p.id_partido
                    JOIN  temporadas t    ON p.id_temporada    = t.id_temporada
                    JOIN  competiciones c ON p.id_competicion  = c.id_competicion
                    LEFT JOIN jugadoras ja   ON g.asistente = ja.id_jugadora
                    LEFT JOIN jugadoras jg   ON g.goleadora  = jg.id_jugadora
                    WHERE g.asistente IS NOT NULL
                      AND g.asistente != ''
                      AND g.asistente != '0'
                      ${seasonFilter} ${competitionFilter}
                    GROUP BY g.asistente, g.goleadora
                    ORDER BY weight DESC
                `,
                args: filterArgs,
            }),
            client.execute({
                sql: `
                    SELECT DISTINCT t.temporada, c.competicion
                    FROM goles_y_asistencias g
                    JOIN partidos p      ON g.id_partido     = p.id_partido
                    JOIN temporadas t    ON p.id_temporada   = t.id_temporada
                    JOIN competiciones c ON p.id_competicion = c.id_competicion
                    WHERE g.asistente IS NOT NULL AND g.asistente != '' AND g.asistente != '0'
                    ORDER BY t.temporada DESC, c.competicion ASC
                `,
                args: [],
            }),
        ]);

        const seasons      = [...new Set((optionsRow.rows as any[]).map(r => r.temporada as string))];
        const competitions = [...new Set((optionsRow.rows as any[]).map(r => r.competicion as string))];

        const nodeMap = new Map<string, {
            id: string; name: string; img: string | null; assists: number; goals: number;
        }>();

        for (const row of edgesRow.rows as any[]) {
            const fromId   = String(row.from_id   ?? row.from_name ?? '');
            const toId     = String(row.to_id     ?? row.to_name   ?? '');
            const fromName = String(row.from_name ?? '');
            const toName   = String(row.to_name   ?? '');
            const weight   = Number(row.weight    ?? 1);

            if (fromId && !nodeMap.has(fromId))
                nodeMap.set(fromId, { id: fromId, name: fromName, img: row.from_img ?? null, assists: 0, goals: 0 });
            if (toId && !nodeMap.has(toId))
                nodeMap.set(toId,   { id: toId,   name: toName,   img: row.to_img   ?? null, assists: 0, goals: 0 });

            if (fromId) nodeMap.get(fromId)!.assists += weight;
            if (toId)   nodeMap.get(toId)!.goals     += weight;
        }

        const edges = (edgesRow.rows as any[])
            .filter(row => row.from_id && row.to_id)
            .map(row => ({
                from:     String(row.from_id),
                to:       String(row.to_id),
                fromName: String(row.from_name ?? ''),
                toName:   String(row.to_name   ?? ''),
                weight:   Number(row.weight ?? 1),
            }));

        return jsonResponse({
            nodes: Array.from(nodeMap.values()),
            edges,
            seasons,
            competitions,
        });
    } catch (e) {
        console.error('[assist-network]', e);
        return jsonError('Internal error', 500);
    }
};
