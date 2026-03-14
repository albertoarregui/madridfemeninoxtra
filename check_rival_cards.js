
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
});

async function checkCardTypes() {
    try {
        const types = await client.execute("SELECT DISTINCT tipo_tarjeta FROM tarjetas_rival");
        console.log("Distinct card types in tarjetas_rival:", types.rows.map(r => r.tipo_tarjeta));
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

checkCardTypes();
