export async function fetchCoachRecords(coachId: string | number): Promise<any> {
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

        console.log('Fetching coach records for coach ID:', coachId);

        // Most faced opponent - need to determine if RM is local or visitante
        const mostFacedResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre_club
                        ELSE cl.nombre_club
                    END as rival,
                    COUNT(*) as partidos
                FROM partidos p
                LEFT JOIN rivales cl ON p.id_club_local = cl.id_rival
                LEFT JOIN rivales cv ON p.id_club_visitante = cv.id_rival
                WHERE p.id_entrenador = ?
                GROUP BY rival
                ORDER BY partidos DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Most faced:', mostFacedResult.rows[0]);

        // Most wins against
        const mostWinsResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre_club
                        ELSE cl.nombre_club
                    END as rival,
                    COUNT(*) as victorias
                FROM partidos p
                LEFT JOIN rivales cl ON p.id_club_local = cl.id_rival
                LEFT JOIN rivales cv ON p.id_club_visitante = cv.id_rival
                WHERE p.id_entrenador = ? AND p.goles_rm > p.goles_rival
                GROUP BY rival
                ORDER BY victorias DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Most wins:', mostWinsResult.rows[0]);

        // Most draws against
        const mostDrawsResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre_club
                        ELSE cl.nombre_club
                    END as rival,
                    COUNT(*) as empates
                FROM partidos p
                LEFT JOIN rivales cl ON p.id_club_local = cl.id_rival
                LEFT JOIN rivales cv ON p.id_club_visitante = cv.id_rival
                WHERE p.id_entrenador = ? AND p.goles_rm = p.goles_rival
                GROUP BY rival
                ORDER BY empates DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Most draws:', mostDrawsResult.rows[0]);

        // Biggest win
        const biggestWinResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre_club
                        ELSE cl.nombre_club
                    END as rival,
                    p.goles_rm, 
                    p.goles_rival,
                    (p.goles_rm - p.goles_rival) as diferencia
                FROM partidos p
                LEFT JOIN rivales cl ON p.id_club_local = cl.id_rival
                LEFT JOIN rivales cv ON p.id_club_visitante = cv.id_rival
                WHERE p.id_entrenador = ? AND p.goles_rm > p.goles_rival
                ORDER BY diferencia DESC, p.goles_rm DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Biggest win:', biggestWinResult.rows[0]);

        // Biggest loss
        const biggestLossResult = await db.execute({
            sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre_club
                        ELSE cl.nombre_club
                    END as rival,
                    p.goles_rm, 
                    p.goles_rival,
                    (p.goles_rival - p.goles_rm) as diferencia
                FROM partidos p
                LEFT JOIN rivales cl ON p.id_club_local = cl.id_rival
                LEFT JOIN rivales cv ON p.id_club_visitante = cv.id_rival
                WHERE p.id_entrenador = ? AND p.goles_rm < p.goles_rival
                ORDER BY diferencia DESC, p.goles_rival DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Biggest loss:', biggestLossResult.rows[0]);

        // Most repeated result
        const mostRepeatedResult = await db.execute({
            sql: `
                SELECT p.goles_rm || '-' || p.goles_rival as resultado, COUNT(*) as veces
                FROM partidos p
                WHERE p.id_entrenador = ?
                GROUP BY resultado
                ORDER BY veces DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Most repeated:', mostRepeatedResult.rows[0]);

        const records = {
            mas_partido: mostFacedResult.rows[0] || null,
            mas_victorias: mostWinsResult.rows[0] || null,
            mas_empates: mostDrawsResult.rows[0] || null,
            mayor_victoria: biggestWinResult.rows[0] || null,
            mayor_derrota: biggestLossResult.rows[0] || null,
            mas_repetido: mostRepeatedResult.rows[0] || null,
        };

        console.log('Final records object:', records);
        return records;
    } catch (error) {
        console.error("Error fetching coach records:", error);
        return null;
    }
}
