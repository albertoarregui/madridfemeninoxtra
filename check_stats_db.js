
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
});

async function checkTables() {
    try {
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", tables.rows.map(r => r.name));

        if (tables.rows.some(r => r.name === 'tarjetas')) {
            const tarjetasCols = await client.execute("PRAGMA table_info(tarjetas)");
            console.log("\nColumns in 'tarjetas':", tarjetasCols.rows.map(r => r.name));
            const sample = await client.execute("SELECT * FROM tarjetas LIMIT 3");
            console.log("Sample tarjetas:", sample.rows);
        }

        if (tables.rows.some(r => r.name === 'tarjetas_rival')) {
            const tarjetasRivalCols = await client.execute("PRAGMA table_info(tarjetas_rival)");
            console.log("\nColumns in 'tarjetas_rival':", tarjetasRivalCols.rows.map(r => r.name));
            const sample = await client.execute("SELECT * FROM tarjetas_rival LIMIT 3");
            console.log("Sample tarjetas_rival:", sample.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

checkTables();
