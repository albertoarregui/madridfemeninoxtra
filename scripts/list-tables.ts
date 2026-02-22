
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

async function listTables(name: string, url: string | undefined, token: string | undefined) {
    if (!url || !token) {
        console.error(`Missing URL or Token for ${name}`);
        return;
    }
    console.log(`--- Tables in ${name} (${url}) ---`);
    const client = createClient({ url, authToken: token });
    try {
        const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log(result.rows.map(r => r.name).join(", "));
    } catch (error) {
        console.error(`Failed to list tables for ${name}:`, error);
    }
}

async function run() {
    await listTables("AWARDS", process.env.TURSO_DATABASE_URL, process.env.TURSO_AUTH_TOKEN);
    await listTables("STATS", process.env.TURSO_STATS_DATABASE_URL, process.env.TURSO_STATS_AUTH_TOKEN);
}

run();
