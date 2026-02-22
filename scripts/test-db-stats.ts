
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
    const url = process.env.TURSO_STATS_DATABASE_URL;
    const authToken = process.env.TURSO_STATS_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error("Missing TURSO_STATS_DATABASE_URL or TURSO_STATS_AUTH_TOKEN");
        return;
    }

    console.log(`Connecting to ${url}...`);
    const client = createClient({
        url,
        authToken,
    });

    try {
        const result = await client.execute("SELECT 1");
        console.log("Connection successful!", result.rows);
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

testConnection();
