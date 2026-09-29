export async function fetchCoachRecords(coachId: string | number): Promise<any> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const db = await getPlayersDbClient();

        if (!db) return null;

        const playedFilter = `
            AND p.goles_rm IS NOT NULL AND p.goles_rm != ''
            AND p.goles_rival IS NOT NULL AND p.goles_rival != ''
        `;

        const mostFacedResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    COUNT(*) as partidos
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso'
                ${playedFilter}
                GROUP BY rival
                ORDER BY partidos DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        const mostWinsResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    COUNT(*) as victorias
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso' AND p.goles_rm > p.goles_rival
                ${playedFilter}
                GROUP BY rival
                ORDER BY victorias DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        const mostDrawsResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    COUNT(*) as empates
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso' AND p.goles_rm = p.goles_rival
                ${playedFilter}
                GROUP BY rival
                ORDER BY empates DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        const biggestWinResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    p.goles_rm, 
                    p.goles_rival,
                    (p.goles_rm - p.goles_rival) as diferencia
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso' AND p.goles_rm > p.goles_rival
                ${playedFilter}
                ORDER BY diferencia DESC, p.goles_rm DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        const biggestLossResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    p.goles_rm, 
                    p.goles_rival,
                    (p.goles_rival - p.goles_rm) as diferencia
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso' AND p.goles_rm < p.goles_rival
                ${playedFilter}
                ORDER BY diferencia DESC, p.goles_rival DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        const mostRepeatedResult = await db.execute({
            sql: `
                SELECT p.goles_rm || '-' || p.goles_rival as resultado, COUNT(*) as veces
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso'
                ${playedFilter}
                GROUP BY resultado
                ORDER BY veces DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        return {
            mas_partido: mostFacedResult.rows[0] || null,
            mas_victorias: mostWinsResult.rows[0] || null,
            mas_empates: mostDrawsResult.rows[0] || null,
            mayor_victoria: biggestWinResult.rows[0] || null,
            mayor_derrota: biggestLossResult.rows[0] || null,
            mas_repetido: mostRepeatedResult.rows[0] || null,
        };
    } catch (error) {
        console.error("Error fetching coach records:", error);
        return null;
    }
}
