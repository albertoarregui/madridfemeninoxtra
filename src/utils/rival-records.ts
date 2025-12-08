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

        let topScorer = null;
        let rivalTopScorer = null;
        let mostAppearances = null;
        let biggestWin = null;
        let biggestLoss = null;
        let mostRepeated = null;

        // Top scorer from Real Madrid against this rival
        try {
            const topScorerResult = await db.execute({
                sql: `
                    SELECT 
                        j.nombre,
                        COUNT(*) as goles
                    FROM goles_y_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.goleadora = j.id_jugadora
                    WHERE ga.goleadora IS NOT NULL
                    AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY j.id_jugadora, j.nombre
                    ORDER BY goles DESC
                    LIMIT 1
                `,
                args: [rivalId, rivalId],
            });
            topScorer = topScorerResult.rows[0] || null;
            console.log('Top scorer:', topScorer);
        } catch (error) {
            console.error('Error fetching top scorer:', error);
        }

        // Biggest win
        try {
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
            biggestWin = biggestWinResult.rows[0] || null;
            console.log('Biggest win:', biggestWin);
        } catch (error) {
            console.error('Error fetching biggest win:', error);
        }

        // Biggest loss
        try {
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
            biggestLoss = biggestLossResult.rows[0] || null;
            console.log('Biggest loss:', biggestLoss);
        } catch (error) {
            console.error('Error fetching biggest loss:', error);
        }

        // Most repeated result
        try {
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
            mostRepeated = mostRepeatedResult.rows[0] || null;
            console.log('Most repeated:', mostRepeated);
        } catch (error) {
            console.error('Error fetching most repeated:', error);
        }

        // Player with most appearances against this rival - usando goles_asistencias como alternativa
        try {
            const mostAppearancesResult = await db.execute({
                sql: `
                    SELECT 
                        j.nombre,
                        COUNT(DISTINCT ga.id_partido) as partidos
                    FROM goles_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.id_jugadora = j.id_jugadora
                    WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY j.id_jugadora, j.nombre
                    ORDER BY partidos DESC
                    LIMIT 1
                `,
                args: [rivalId, rivalId],
            });
            mostAppearances = mostAppearancesResult.rows[0] || null;
            console.log('Most appearances:', mostAppearances);
        } catch (error) {
            console.error('Error fetching most appearances:', error);
        }

        const records = {
            maximo_goleador: topScorer,
            goleador_rival: null, // No disponible por ahora
            mas_partidos: mostAppearances,
            mayor_victoria: biggestWin,
            mayor_derrota: biggestLoss,
            mas_repetido: mostRepeated,
        };

        console.log('Final rival records object:', records);
        return records;
    } catch (error) {
        console.error("Error fetching rival records:", error);
        return null;
    }
}

export async function fetchRivalTopPlayers(rivalId: string | number): Promise<any> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('Credenciales de Turso no configuradas');
            return { topScorers: [], topAssisters: [], topContributors: [] };
        }

        const db = createClient({
            url: url,
            authToken: authToken,
        });

        console.log('Fetching rival top players for rival ID:', rivalId);

        // Top scorers against this rival
        const topScorersResult = await db.execute({
            sql: `
                SELECT 
                    j.nombre,
                    COUNT(*) as goles
                FROM goles_y_asistencias ga
                INNER JOIN partidos p ON ga.id_partido = p.id_partido
                INNER JOIN jugadoras j ON ga.goleadora = j.id_jugadora
                WHERE ga.goleadora IS NOT NULL
                AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                GROUP BY j.id_jugadora, j.nombre
                ORDER BY goles DESC
                LIMIT 10
            `,
            args: [rivalId, rivalId],
        });

        // Top assisters against this rival
        const topAssistersResult = await db.execute({
            sql: `
                SELECT 
                    j.nombre,
                    COUNT(*) as asistencias
                FROM goles_y_asistencias ga
                INNER JOIN partidos p ON ga.id_partido = p.id_partido
                INNER JOIN jugadoras j ON ga.asistente = j.id_jugadora
                WHERE ga.asistente IS NOT NULL
                AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                GROUP BY j.id_jugadora, j.nombre
                ORDER BY asistencias DESC
                LIMIT 10
            `,
            args: [rivalId, rivalId],
        });

        // Top contributors (goals + assists)
        const topContributorsResult = await db.execute({
            sql: `
                SELECT 
                    nombre,
                    SUM(goles) as goles,
                    SUM(asistencias) as asistencias,
                    SUM(goles) + SUM(asistencias) as total
                FROM (
                    SELECT j.id_jugadora, j.nombre, COUNT(*) as goles, 0 as asistencias
                    FROM goles_y_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.goleadora = j.id_jugadora
                    WHERE ga.goleadora IS NOT NULL
                    AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY j.id_jugadora, j.nombre
                    
                    UNION ALL
                    
                    SELECT j.id_jugadora, j.nombre, 0 as goles, COUNT(*) as asistencias
                    FROM goles_y_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.asistente = j.id_jugadora
                    WHERE ga.asistente IS NOT NULL
                    AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY j.id_jugadora, j.nombre
                )
                GROUP BY nombre
                ORDER BY total DESC
                LIMIT 10
            `,
            args: [rivalId, rivalId, rivalId, rivalId],
        });

        return {
            topScorers: topScorersResult.rows || [],
            topAssisters: topAssistersResult.rows || [],
            topContributors: topContributorsResult.rows || [],
        };
    } catch (error) {
        console.error("Error fetching rival top players:", error);
        return { topScorers: [], topAssisters: [], topContributors: [] };
    }
}

export async function fetchRivalMatches(rivalId: string | number): Promise<any[]> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('Credenciales de Turso no configuradas');
            return [];
        }

        const db = createClient({
            url: url,
            authToken: authToken,
        });

        console.log('Fetching matches against rival ID:', rivalId);
        console.log('Query args:', [rivalId, rivalId]);

        const matchesResult = await db.execute({
            sql: `
                SELECT 
                    p.id_partido,
                    p.fecha,
                    p.id_competicion,
                    c.nombre as competicion,
                    p.id_club_local,
                    p.id_club_visitante,
                    p.goles_rm,
                    p.goles_rival,
                    p.id_arbitra,
                    a.nombre as arbitra,
                    p.id_estadio,
                    e.nombre as estadio,
                    p.asistencia
                FROM partidos p
                LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN arbitras a ON p.id_arbitra = a.id_arbitra
                LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
                WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
                ORDER BY p.fecha DESC
            `,
            args: [rivalId, rivalId],
        });

        console.log('Matches found:', matchesResult.rows.length);
        console.log('First match:', matchesResult.rows[0]);


        return matchesResult.rows.map((match: any) => {
            // Determinar si el Real Madrid jugó como local o visitante
            // Si el rival fue visitante, entonces RM jugó en casa (Local)
            // Si el rival fue local, entonces RM jugó fuera (Visitante)
            const esLocal = match.id_club_visitante === Number(rivalId);

            return {
                id: match.id_partido,
                fecha: match.fecha,
                competicion: match.competicion || '-',
                esLocal: esLocal,
                ubicacion: esLocal ? 'Local' : 'Visitante',
                resultado: `${match.goles_rm}-${match.goles_rival}`,
                golesRM: match.goles_rm,
                golesRival: match.goles_rival,
                arbitra: match.arbitra || '-',
                estadio: match.estadio || '-',
                asistencia: match.asistencia || null,
            };
        });
    } catch (error) {
        console.error("Error fetching rival matches:", error);
        return [];
    }
}
