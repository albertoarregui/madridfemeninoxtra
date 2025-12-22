import { fetchRivalMatches } from './src/utils/rival-records';
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "libsql://madridfemeninoxtra-albertoarregui.turso.io";
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

async function debug() {
    const rivalId = 32; // Use a valid ID
    const matches = await fetchRivalMatches(rivalId);
    console.log("Matches found:", matches.length);

    if (matches.length > 0) {
        const matchId = matches[0].id_partido; // Use first match ID
        console.log(`Checking cards for Match ID: ${matchId}`);

        const cardQuery = `SELECT * FROM tarjetas WHERE id_partido = ?`;
        const result = await client.execute({ sql: cardQuery, args: [matchId] });
        console.log("Raw Cards in DB for this match:", result.rows);
    }
}

debug();
