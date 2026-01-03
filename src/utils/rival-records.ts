export async function fetchRivalRecords(rivalId: string | number): Promise<any> {
    try {
        const { getDbClient } = await import('../db/client');
        const db = await getDbClient();

        if (!db) {
            return null;
        }

        console.log('Fetching rival records for rival ID:', rivalId);

        let topScorer = null;
        let mostAppearances = null;
        let biggestWin = null;
        let biggestLoss = null;
        let mostRepeated = null;

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
            goleador_rival: null,
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
        const { getDbClient } = await import('../db/client');
        const db = await getDbClient();

        if (!db) {
            return { topScorers: [], topAssisters: [], topContributors: [] };
        }

        console.log('Fetching rival top players for rival ID:', rivalId);

        const topScorersResult = await db.execute({
            sql: `
                SELECT 
                    j.nombre,
                    COUNT(*) as goles
                FROM goles_y_asistencias ga
                INNER JOIN partidos p ON ga.id_partido = p.id_partido
                INNER JOIN jugadoras j ON ga.goleadora = j.id_jugadora
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE ga.goleadora IS NOT NULL
                AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                AND c.competicion IN ('Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España')
                GROUP BY j.id_jugadora, j.nombre
                ORDER BY goles DESC
                LIMIT 10
            `,
            args: [rivalId, rivalId],
        });

        const topAssistersResult = await db.execute({
            sql: `
                SELECT 
                    j.nombre,
                    COUNT(*) as asistencias
                FROM goles_y_asistencias ga
                INNER JOIN partidos p ON ga.id_partido = p.id_partido
                INNER JOIN jugadoras j ON ga.asistente = j.id_jugadora
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE ga.asistente IS NOT NULL
                AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                AND c.competicion IN ('Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España')
                GROUP BY j.id_jugadora, j.nombre
                ORDER BY asistencias DESC
                LIMIT 10
            `,
            args: [rivalId, rivalId],
        });

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
                    INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                    WHERE ga.goleadora IS NOT NULL
                    AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                    AND c.competicion IN ('Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España')
                    GROUP BY j.id_jugadora, j.nombre
                    
                    UNION ALL
                    
                    SELECT j.id_jugadora, j.nombre, 0 as goles, COUNT(*) as asistencias
                    FROM goles_y_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.asistente = j.id_jugadora
                    INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                    WHERE ga.asistente IS NOT NULL
                    AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                    AND c.competicion IN ('Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España')
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
        const { getDbClient } = await import('../db/client');
        const db = await getDbClient();

        if (!db) {
            return [];
        }

        console.log('========== DEBUG: Fetching matches ==========');
        console.log('Rival ID:', rivalId, 'Type:', typeof rivalId);

        const countResult = await db.execute({
            sql: 'SELECT COUNT(*) as total FROM partidos',
            args: []
        });
        console.log('Total matches in database:', countResult.rows[0]);

        const matchesResult = await db.execute({
            sql: `
                SELECT 
                    p.id_partido,
                    p.fecha,
                    p.id_competicion,
                    c.competicion,
                    p.id_club_local,
                    p.id_club_visitante,
                    p.goles_rm,
                    p.goles_rival,
                    p.id_arbitra,
                    a.nombre as arbitra,
                    p.id_estadio,
                    e.nombre as estadio,
                    p.asistencia,
                    0 as amarillas_rm,
                    0 as rojas_rm
                FROM partidos p
                LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN arbitras a ON p.id_arbitra = a.id_arbitra
                LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
                WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
                ORDER BY p.fecha DESC
            `,
            args: [rivalId, rivalId],
        });

        const rows = matchesResult.rows;

        if (rows.length === 0) return [];

        // Fetch cards for these matches separately to avoid subquery issues
        const matchIds = rows.map((m: any) => m.id_partido);
        // Create placeholders ? for the IN clause
        const placeholders = matchIds.map(() => '?').join(',');

        const cardsResult = await db.execute({
            sql: `SELECT * FROM tarjetas WHERE id_partido IN (${placeholders})`,
            args: matchIds
        });

        // Map cards by match ID
        const cardsByMatch: Record<string, { yellow: number; red: number }> = {};
        matchIds.forEach((id: any) => {
            cardsByMatch[id] = { yellow: 0, red: 0 };
        });

        cardsResult.rows.forEach((card: any) => {
            // Count card if it is NOT for the rival (so it is for RM)
            // Logic: if id_equipo != rivalId OR id_equipo IS NULL (assuming 2 team match)
            const cardTeamId = Number(card.id_equipo);
            const rId = Number(rivalId);

            if (cardTeamId !== rId) {
                const matchId = card.id_partido;
                if (cardsByMatch[matchId]) {
                    const type = (card.tipo_tarjeta || '').toUpperCase();
                    // Exclude double yellow from yellow count? Logic says yes if it counts as red.
                    // But usually:
                    // Yellow = 'AMARILLA' or 'YELLOW' (excluding double)
                    // Red = 'ROJA' or 'RED' or 'DOBLE'

                    if ((type.includes('AMARILLA') || type.includes('YELLOW')) && !type.includes('DOBLE')) {
                        cardsByMatch[matchId].yellow++;
                    } else if (type.includes('ROJA') || type.includes('RED') || type.includes('DOBLE')) {
                        cardsByMatch[matchId].red++;
                    }
                }
            }
        });

        return rows.map((match: any) => {
            const cards = cardsByMatch[match.id_partido] || { yellow: 0, red: 0 };

            // Check if the displayed rival is the local team in this match
            // If match.id_club_local === rivalId, then Rival is Local.
            const esLocal = Number(match.id_club_local) === Number(rivalId);

            // Format result as Home-Away
            // If Rival is Local, Home score is match.goles_rival (Rival Goals), Away score is match.goles_rm (Opponent/RM Goals).
            // If Rival is Visitor, Home score is match.goles_rm (Opponent/RM Goals), Away score is match.goles_rival (Rival Goals).
            const statsLocal = esLocal ? match.goles_rival : match.goles_rm;
            const statsVisitor = esLocal ? match.goles_rm : match.goles_rival;

            return {
                id: match.id_partido,
                fecha: match.fecha,
                competicion: match.competicion || '-',
                esLocal: esLocal,
                ubicacion: esLocal ? 'Local' : 'Visitante',
                resultado: `${statsLocal}-${statsVisitor}`,
                golesRM: match.goles_rm,
                golesRival: match.goles_rival,
                arbitra: match.arbitra || '-',
                estadio: match.estadio || '-',
                amarillas: cards.yellow,
                rojas: cards.red,
                // Debug log for attendance
                asistencia: match.asistencia ? match.asistencia.toString().trim() : null,
            };
        });
    } catch (error) {
        console.error("Error fetching rival matches:", error);
        return [];
    }
}

export function calculateRivalStats(matches: any[]) {
    const stats = {
        home: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, cleanSheets: 0, conceded: 0, yellowCards: 0, redCards: 0 },
        away: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, cleanSheets: 0, conceded: 0, yellowCards: 0, redCards: 0 },
        total: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, cleanSheets: 0, conceded: 0, yellowCards: 0, redCards: 0 }
    };

    matches.forEach(match => {
        const golesRM = parseInt(match.golesRM) || 0;
        const golesRival = parseInt(match.golesRival) || 0;
        const isHome = match.esLocal;

        const location = isHome ? stats.home : stats.away;

        location.pj++;
        location.gf += golesRM;
        location.gc += golesRival;

        if (golesRival === 0) {
            location.cleanSheets = (location.cleanSheets || 0) + 1;
        } else {
            location.conceded = (location.conceded || 0) + 1;
        }

        location.yellowCards = (location.yellowCards || 0) + (match.amarillas || 0);
        location.redCards = (location.redCards || 0) + (match.rojas || 0);

        if (golesRM > golesRival) {
            location.pg++;
        } else if (golesRM === golesRival) {
            location.pe++;
        } else {
            location.pp++;
        }
    });

    stats.total.pj = stats.home.pj + stats.away.pj;
    stats.total.pg = stats.home.pg + stats.away.pg;
    stats.total.pe = stats.home.pe + stats.away.pe;
    stats.total.pp = stats.home.pp + stats.away.pp;
    stats.total.gf = stats.home.gf + stats.away.gf;
    stats.total.gc = stats.home.gc + stats.away.gc;
    stats.total.cleanSheets = stats.home.cleanSheets + stats.away.cleanSheets;
    stats.total.conceded = stats.home.conceded + stats.away.conceded;
    stats.total.yellowCards = stats.home.yellowCards + stats.away.yellowCards;
    stats.total.redCards = stats.home.redCards + stats.away.redCards;

    const addCalculatedFields = (obj: any) => ({
        ...obj,
        percPG: obj.pj > 0 ? ((obj.pg / obj.pj) * 100).toFixed(1) : '0.0',
        percPE: obj.pj > 0 ? ((obj.pe / obj.pj) * 100).toFixed(1) : '0.0',
        percPP: obj.pj > 0 ? ((obj.pp / obj.pj) * 100).toFixed(1) : '0.0',
        avg: obj.pj > 0 ? (obj.gf / obj.pj).toFixed(2) : '0.00',
        dif: obj.gf - obj.gc,
    });

    return {
        home: addCalculatedFields(stats.home),
        away: addCalculatedFields(stats.away),
        total: addCalculatedFields(stats.total),
    };
}

export function calculateStreaks(matches: any[]) {
    // Sort matches by date ascending for streak calculation
    const sortedMatches = [...matches].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let currentWinStreak = 0;
    let maxWinStreak = 0;

    let currentDrawStreak = 0;
    let maxDrawStreak = 0;

    let currentLossStreak = 0;
    let maxLossStreak = 0;

    let currentNoWinStreak = 0;
    let maxNoWinStreak = 0;

    let currentCleanSheetStreak = 0;
    let maxCleanSheetStreak = 0;

    let currentUndefeatedStreak = 0;
    let maxUndefeatedStreak = 0;

    sortedMatches.forEach(match => {
        const golesRM = parseInt(match.golesRM) || 0;
        const golesRival = parseInt(match.golesRival) || 0;

        // Win Streak
        if (golesRM > golesRival) {
            currentWinStreak++;
        } else {
            currentWinStreak = 0;
        }
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;

        // Draw Streak
        if (golesRM === golesRival) {
            currentDrawStreak++;
        } else {
            currentDrawStreak = 0;
        }
        if (currentDrawStreak > maxDrawStreak) maxDrawStreak = currentDrawStreak;

        // Loss Streak
        if (golesRM < golesRival) {
            currentLossStreak++;
        } else {
            currentLossStreak = 0;
        }
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;

        // No Win Streak (Draw or Loss)
        if (golesRM <= golesRival) {
            currentNoWinStreak++;
        } else {
            currentNoWinStreak = 0;
        }
        if (currentNoWinStreak > maxNoWinStreak) maxNoWinStreak = currentNoWinStreak;

        // Undefeated Streak (Win or Draw)
        if (golesRM >= golesRival) {
            currentUndefeatedStreak++;
        } else {
            currentUndefeatedStreak = 0;
        }
        if (currentUndefeatedStreak > maxUndefeatedStreak) maxUndefeatedStreak = currentUndefeatedStreak;

        // Clean Sheet Streak
        if (golesRival === 0) {
            currentCleanSheetStreak++;
        } else {
            currentCleanSheetStreak = 0;
        }
        if (currentCleanSheetStreak > maxCleanSheetStreak) maxCleanSheetStreak = currentCleanSheetStreak;
    });

    return {
        wins: maxWinStreak,
        draws: maxDrawStreak,
        losses: maxLossStreak,
        noWins: maxNoWinStreak,
        undefeated: maxUndefeatedStreak,
        cleanSheets: maxCleanSheetStreak
    };
}
