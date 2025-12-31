export async function fetchCoachStreaks(coachId: string | number): Promise<any> {
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

        const matchesResult = await db.execute({
            sql: `
                SELECT p.goles_rm, p.goles_rival, p.fecha
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso'
                ORDER BY p.fecha DESC
            `,
            args: [coachId],
        });

        const matches = matchesResult.rows.map((row: any) => ({
            goles_rm: Number(row.goles_rm),
            goles_rival: Number(row.goles_rival),
            fecha: row.fecha,
        }));

        if (matches.length === 0) {
            return null;
        }

        const isWin = (m: any) => m.goles_rm > m.goles_rival;
        const isDraw = (m: any) => m.goles_rm === m.goles_rival;
        const isLoss = (m: any) => m.goles_rm < m.goles_rival;
        const isUnbeaten = (m: any) => m.goles_rm >= m.goles_rival;
        const isWinless = (m: any) => m.goles_rm <= m.goles_rival;
        const isScoring = (m: any) => m.goles_rm > 0;
        const isNotScoring = (m: any) => m.goles_rm === 0;
        const isConceding = (m: any) => m.goles_rival > 0;
        const isCleanSheet = (m: any) => m.goles_rival === 0;
        const isNoGoals = (m: any) => m.goles_rm === 0 && m.goles_rival === 0;

        const calculateCurrentStreak = (condition: (m: any) => boolean): number => {
            let count = 0;
            for (const match of matches) {
                if (condition(match)) {
                    count++;
                } else {
                    break;
                }
            }
            return count;
        };

        const calculateBestStreak = (condition: (m: any) => boolean): number => {
            let maxStreak = 0;
            let currentStreak = 0;

            const chronologicalMatches = [...matches].reverse();

            for (const match of chronologicalMatches) {
                if (condition(match)) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            }
            return maxStreak;
        };

        return {
            current: {
                ganando: calculateCurrentStreak(isWin),
                empatando: calculateCurrentStreak(isDraw),
                perdiendo: calculateCurrentStreak(isLoss),
                sin_perder: calculateCurrentStreak(isUnbeaten),
                sin_ganar: calculateCurrentStreak(isWinless),
                sin_marcar: calculateCurrentStreak(isNotScoring),
                marcando: calculateCurrentStreak(isScoring),
                encajando: calculateCurrentStreak(isConceding),
                sin_encajar: calculateCurrentStreak(isCleanSheet),
                sin_goles: calculateCurrentStreak(isNoGoals),
            },
            best: {
                ganando: calculateBestStreak(isWin),
                empatando: calculateBestStreak(isDraw),
                perdiendo: calculateBestStreak(isLoss),
                sin_perder: calculateBestStreak(isUnbeaten),
                sin_ganar: calculateBestStreak(isWinless),
                sin_marcar: calculateBestStreak(isNotScoring),
                marcando: calculateBestStreak(isScoring),
                encajando: calculateBestStreak(isConceding),
                sin_encajar: calculateBestStreak(isCleanSheet),
                sin_goles: calculateBestStreak(isNoGoals),
            },
        };
    } catch (error) {
        console.error("Error fetching coach streaks:", error);
        return null;
    }
}
