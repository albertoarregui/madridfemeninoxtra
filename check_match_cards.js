
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
});

async function checkMatchesAndCards() {
    try {
        // Find a rival with many matches
        const matchesResult = await client.execute(`
            SELECT id_club_local, id_club_visitante, COUNT(*) as count 
            FROM partidos 
            GROUP BY id_club_local, id_club_visitante 
            ORDER BY count DESC 
            LIMIT 5
        `);
        console.log("Common Matchups:", matchesResult.rows);

        const rivalId = 4; // Let's try 4 (maybe it's a common one)
        const matches = await client.execute({
            sql: "SELECT id_partido FROM partidos WHERE id_club_local = ? OR id_club_visitante = ?",
            args: [rivalId, rivalId]
        });
        const matchIds = matches.rows.map(m => m.id_partido);
        console.log(`Match IDs for rival ${rivalId}:`, matchIds);

        if (matchIds.length > 0) {
            const placeholders = matchIds.map(() => '?').join(',');
            const cards = await client.execute({
                sql: `SELECT * FROM tarjetas WHERE id_partido IN (${placeholders})`,
                args: matchIds
            });
            console.log(`Cards in 'tarjetas' for these matches:`, cards.rows.length);

            const rivalCards = await client.execute({
                sql: `SELECT * FROM tarjetas_rival WHERE id_partido IN (${placeholders})`,
                args: matchIds
            });
            console.log(`Cards in 'tarjetas_rival' for these matches:`, rivalCards.rows.length);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

checkMatchesAndCards();
