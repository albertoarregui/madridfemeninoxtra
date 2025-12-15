
import { createClient } from "@libsql/client";

export const GET = async ({ params, request }) => {
    const url = import.meta.env.TURSO_DATABASE_URL;
    const authToken = import.meta.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        return new Response(JSON.stringify({ error: "Missing credentials" }), {
            status: 500
        });
    }

    const client = createClient({ url, authToken });

    // 1. Find the ID for RM vs Barcelona (2020-10-04)
    const matchQuery = `
        SELECT * 
        FROM partidos 
        WHERE rival LIKE '%Barcelona%' AND fecha LIKE '2020-10-04%'
    `;

    const matchResult = await client.execute(matchQuery);
    let debugInfo = { matches: matchResult.rows };

    if (matchResult.rows.length > 0) {
        const matchId = matchResult.rows[0].id_partido;
        debugInfo['selectedMatchId'] = matchId;

        // 2. Check goals for this ID
        const goalsQuery = `SELECT * FROM goles_y_asistencias WHERE id_partido = ?`;
        const goalsResult = await client.execute({ sql: goalsQuery, args: [matchId] });
        debugInfo['goals'] = goalsResult.rows;
    }

    return new Response(JSON.stringify(debugInfo, null, 2), {
        headers: {
            "Content-Type": "application/json"
        }
    });
};
