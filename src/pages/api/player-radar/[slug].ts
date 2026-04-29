import type { APIRoute } from 'astro';
import { fetchPlayersDirectly } from '../../../utils/players';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
    const { slug } = params;
    if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 });

    try {
        const players = await fetchPlayersDirectly();
        const player = players.find((p: any) => p.slug === slug);
        if (!player) return Response.json({ error: 'Not found' }, { status: 404 });

        const { getPlayersDbClient } = await import('../../../db/client');
        const client = await getPlayersDbClient();
        if (!client) return Response.json({ error: 'DB unavailable' }, { status: 500 });

        const id = player.id_jugadora;

        const row = await client.execute({
            sql: `
                SELECT
                    COALESCE(SUM(CASE WHEN al.minutos_jugados > 0 THEN 1 ELSE 0 END), 0)   AS partidos,
                    COALESCE(SUM(al.titularidades_calc), 0)                                  AS titularidades,
                    COALESCE(SUM(al.minutos_jugados), 0)                                     AS minutos
                FROM (
                    SELECT
                        al.id_jugadora,
                        al.minutos_jugados,
                        CASE WHEN al.titular = 1 THEN 1 ELSE 0 END AS titularidades_calc
                    FROM alineaciones al
                    WHERE al.id_jugadora = ?
                ) al
            `,
            args: [id],
        });

        const golesRow = await client.execute({
            sql: `SELECT COUNT(*) AS goles FROM goles_y_asistencias WHERE goleadora = ?`,
            args: [id],
        });

        const asistRow = await client.execute({
            sql: `SELECT COUNT(*) AS asistencias FROM goles_y_asistencias WHERE asistente = ?`,
            args: [id],
        });

        const cardsRow = await client.execute({
            sql: `
                SELECT
                    SUM(CASE WHEN UPPER(tipo_tarjeta) = 'AMARILLA' THEN 1 ELSE 0 END) AS amarillas,
                    SUM(CASE WHEN UPPER(tipo_tarjeta) LIKE '%ROJA%' OR UPPER(tipo_tarjeta) LIKE '%DOBLE%' THEN 1 ELSE 0 END) AS rojas
                FROM tarjetas WHERE id_jugadora = ?
            `,
            args: [id],
        });

        const r   = row.rows[0]   as any;
        const g   = golesRow.rows[0]   as any;
        const a   = asistRow.rows[0]   as any;
        const c   = cardsRow.rows[0]   as any;

        const partidos     = Number(r?.partidos     ?? 0);
        const titularidades = Number(r?.titularidades ?? 0);
        const minutos      = Number(r?.minutos      ?? 0);
        const goles        = Number(g?.goles        ?? 0);
        const asistencias  = Number(a?.asistencias  ?? 0);
        const amarillas    = Number(c?.amarillas     ?? 0);
        const rojas        = Number(c?.rojas         ?? 0);

        return Response.json({
            slug,
            nombre:   player.nombre,
            imageUrl: player.imageUrl,
            posicion: player.posicion,
            stats: { partidos, titularidades, minutos, goles, asistencias, amarillas, rojas },
        });
    } catch (e) {
        console.error('[player-radar]', e);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
};
