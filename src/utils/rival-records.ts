export async function fetchRivalRecords(rivalId: string | number): Promise<any> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('Credenciales de Turso no configuradas');
            return null;
        }

        const db = createClient({
            url: url,
            authToken: authToken,
        });

        console.log('Fetching rival records for rival ID:', rivalId);

        // Top scorer from Real Madrid against this rival
        const topScorerResult = await db.execute({
            sql: `
                SELECT 
                    j.nombre,
                    COUNT(*) as goles
                FROM goles_asistencias ga
                INNER JOIN partidos p ON ga.id_partido = p.id_partido
                INNER JOIN jugadoras j ON ga.id_jugadora = j.id_jugadora
                WHERE ga.tipo = 'Gol' 
                AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                GROUP BY j.id_jugadora, j.nombre
                ORDER BY goles DESC
                LIMIT 1
            `,
            args: [rivalId, rivalId],
        });
        console.log('Top scorer:', topScorerResult.rows[0]);

        // Top scorer from rival team
        const rivalTopScorerResult = await db.execute({
            sql: `
                SELECT 
                    'Dato no disponible' as nombre,
                    0 as goles
            `,
            args: [],
        });
        console.log('Rival top scorer:', rivalTopScorerResult.rows[0]);

        // Player with most appearances against this rival
        const mostAppearancesResult = await db.execute({
            sql: `
                SELECT 
                    j.nombre,
                    COUNT(DISTINCT p.id_partido) as partidos
                FROM alineaciones a
                INNER JOIN partidos p ON a.id_partido = p.id_partido
                INNER JOIN jugadoras j ON a.id_jugadora = j.id_jugadora
                WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
                GROUP BY j.id_jugadora, j.nombre
                ORDER BY partidos DESC
                LIMIT 1
            `,
            args: [rivalId, rivalId],
        });
        console.log('Most appearances:', mostAppearancesResult.rows[0]);

        // Biggest win
        const biggestWinResult = await db.execute({
            sql: `
                SELECT 
                    p.goles_rm, 
                    p.goles_rival,
                    (p.goles_rm - p.goles_rival) as diferencia,
                    p.goles_rm || '-' || p.goles_rival as resultado
                FROM partidos p
                WHERE (p.id_club_local = ? OR p.id_club_visitante = ?) 
                AND p.goles_rm > p.goles_rival
                ORDER BY diferencia DESC, p.goles_rm DESC
                LIMIT 1
            `,
            args: [rivalId, rivalId],
        });
        console.log('Biggest win:', biggestWinResult.rows[0]);

        // Biggest loss
        const biggestLossResult = await db.execute({
            sql: `
                SELECT 
                    p.goles_rm, 
                    p.goles_rival,
                    (p.goles_rival - p.goles_rm) as diferencia,
                    p.goles_rm || '-' || p.goles_rival as resultado
                FROM partidos p
                WHERE (p.id_club_local = ? OR p.id_club_visitante = ?) 
                AND p.goles_rm < p.goles_rival
                ORDER BY diferencia DESC, p.goles_rival DESC
                LIMIT 1
            `,
            args: [rivalId, rivalId],
        });
        console.log('Biggest loss:', biggestLossResult.rows[0]);

        // Most repeated result
        const mostRepeatedResult = await db.execute({
            sql: `
                SELECT 
                    p.goles_rm || '-' || p.goles_rival as resultado, 
                    COUNT(*) as veces
                FROM partidos p
                WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
                GROUP BY resultado
                ORDER BY veces DESC
                LIMIT 1
            `,
            args: [rivalId, rivalId],
        });
        console.log('Most repeated:', mostRepeatedResult.rows[0]);

        const records = {
            maximo_goleador: topScorerResult.rows[0] || null,
            goleador_rival: rivalTopScorerResult.rows[0] || null,
            mas_partidos: mostAppearancesResult.rows[0] || null,
            mayor_victoria: biggestWinResult.rows[0] || null,
            mayor_derrota: biggestLossResult.rows[0] || null,
            mas_repetido: mostRepeatedResult.rows[0] || null,
        };

        console.log('Final rival records object:', records);
        return records;
    } catch (error) {
        console.error("Error fetching rival records:", error);
        return null;
    }
}
