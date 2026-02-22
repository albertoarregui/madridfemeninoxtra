
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
        console.log("Fetching first game...");
        const result = await client.execute("SELECT * FROM partidos LIMIT 1");
        console.log("Success!", result.rows[0]);

        console.log("Fetching all games count...");
        const countResult = await client.execute("SELECT COUNT(*) as count FROM partidos");
        console.log("Total games:", countResult.rows[0].count);
    } catch (error: any) {
        console.error("Query failed:", error);
        if (error.message) console.error("Error message:", error.message);
        if (error.code) console.error("Error code:", error.code);
    }
}

testConnection();
