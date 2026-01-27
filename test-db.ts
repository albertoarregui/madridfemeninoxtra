import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

async function listTables() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    const client = createClient({ url, authToken });

    try {
        const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("--- START TABLES ---");
        result.rows.forEach(r => console.log(r.name));
        console.log("--- END TABLES ---");
    } catch (e) {
        console.error(e);
    }
}

listTables();
