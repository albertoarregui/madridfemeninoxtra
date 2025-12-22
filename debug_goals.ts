
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

async function checkData() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        // Find a match with rival goals
        const matchQuery = `
      SELECT id_partido, goles_rm, goles_rival 
      FROM partidos 
      WHERE goles_rival > 0 AND goles_rm > 0 
      LIMIT 1
    `;
        const matchResult = await client.execute(matchQuery);

        if (matchResult.rows.length === 0) {
            console.log("No matches found with both teams scoring.");
            return;
        }

        const match = matchResult.rows[0];
        console.log("Checking match:", match);

        // Fetch goals for this match
        const goalsQuery = `
      SELECT * FROM goles_y_asistencias WHERE id_partido = ?
    `;
        const goalsResult = await client.execute({
            sql: goalsQuery,
            args: [match.id_partido]
        });

        console.log("Goals found:", goalsResult.rows);

    } catch (e) {
        console.error(e);
    }
}

checkData();
