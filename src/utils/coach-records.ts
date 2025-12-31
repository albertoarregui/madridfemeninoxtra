import { dbMain } from "../lib/turso";

export async function getCoachRecords(slug: string) {
    try {
        const client = dbMain;

        // The original code used 'coachId'. If 'slug' is meant to replace 'coachId' directly in queries,
        // you might need to rename 'coachId' to 'slug' in the SQL args, or derive 'coachId' from 'slug'.
        // For now, assuming 'coachId' is still the variable to be used in the queries,
        // but its origin from 'slug' is not specified in the instruction.
        // If 'slug' is the actual ID to be used, replace 'coachId' with 'slug' in the args arrays below.
        const coachId = slug; // Placeholder: assuming slug is the coachId for now based on context.

        console.log('Fetching coach records for coach ID:', coachId);

        const mostFacedResult = await client.execute({
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
                GROUP BY rival
                ORDER BY partidos DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Most faced:', mostFacedResult.rows[0]);

        const mostWinsResult = await client.execute({
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
                GROUP BY rival
                ORDER BY victorias DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Most wins:', mostWinsResult.rows[0]);

        const mostDrawsResult = await client.execute({
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
                GROUP BY rival
                ORDER BY empates DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Most draws:', mostDrawsResult.rows[0]);

        const biggestWinResult = await client.execute({
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
                ORDER BY diferencia DESC, p.goles_rm DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Biggest win:', biggestWinResult.rows[0]);

        const biggestLossResult = await client.execute({
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
                ORDER BY diferencia DESC, p.goles_rival DESC
                LIMIT 1
            `,
            args: [coachId],
        });
        console.log('Biggest loss:', biggestLossResult.rows[0]);

        const mostRepeatedResult = await client.execute({
            sql: `
                SELECT p.goles_rm || '-' || p.goles_rival as resultado, COUNT(*) as veces
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso'
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
