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

        // Most faced opponent
        const mostFacedResult = await db.execute({
            sql: `
                SELECT r.nombre_rival as rival, COUNT(*) as partidos
                FROM partidos p
                INNER JOIN rivales r ON p.id_rival = r.id_rival
                WHERE p.id_entrenador = ?
                GROUP BY r.nombre_rival
                ORDER BY partidos DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        // Most wins against
        const mostWinsResult = await db.execute({
            sql: `
                SELECT r.nombre_rival as rival, COUNT(*) as victorias
                FROM partidos p
                INNER JOIN rivales r ON p.id_rival = r.id_rival
                WHERE p.id_entrenador = ? AND p.goles_rm > p.goles_rival
                GROUP BY r.nombre_rival
                ORDER BY victorias DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        // Most draws against
        const mostDrawsResult = await db.execute({
            sql: `
                SELECT r.nombre_rival as rival, COUNT(*) as empates
                FROM partidos p
                INNER JOIN rivales r ON p.id_rival = r.id_rival
                WHERE p.id_entrenador = ? AND p.goles_rm = p.goles_rival
                GROUP BY r.nombre_rival
                ORDER BY empates DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        // Biggest win
        const biggestWinResult = await db.execute({
            sql: `
                SELECT r.nombre_rival as rival, p.goles_rm, p.goles_rival,
                       (p.goles_rm - p.goles_rival) as diferencia
                FROM partidos p
                INNER JOIN rivales r ON p.id_rival = r.id_rival
                WHERE p.id_entrenador = ? AND p.goles_rm > p.goles_rival
                ORDER BY diferencia DESC, p.goles_rm DESC
                LIMIT 1
            `,
            args: [coachId],
        });

        // Biggest loss
        const biggestLossResult = await db.execute({
            sql: `
                SELECT r.nombre_rival as rival, p.goles_rm, p.goles_rival,
                       (p.goles_rival - p.goles_rm) as diferencia
                FROM partidos p
                INNER JOIN rivales r ON p.id_rival = r.id_rival
                WHERE p.id_entrenador = ? AND p.goles_rm < p.goles_rival
                ORDER BY diferencia DESC, p.goles_rival DESC
                LIMIT 1
            `,
            args: [coachId],
        });

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
