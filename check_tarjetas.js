
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkTables() {
    try {
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", tables.rows.map(r => r.name));

        const tarjetasCols = await client.execute("PRAGMA table_info(tarjetas)");
        console.log("\nColumns in 'tarjetas':", tarjetasCols.rows.map(r => r.name));

        const hasTarjetasRival = tables.rows.some(r => r.name === 'tarjetas_rival');
        if (hasTarjetasRival) {
            const tarjetasRivalCols = await client.execute("PRAGMA table_info(tarjetas_rival)");
            console.log("\nColumns in 'tarjetas_rival':", tarjetasRivalCols.rows.map(r => r.name));
        } else {
            console.log("\nNo 'tarjetas_rival' table found.");
        }

        // Check a few rows of tarjetas to see if they relate to matches with specific rivals
        const sampleCards = await client.execute("SELECT * FROM tarjetas LIMIT 5");
        console.log("\nSample from 'tarjetas':", sampleCards.rows);

    } catch (e) {
        console.error(e);
    }
}

checkTables();
