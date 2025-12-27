import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing TURSO credentials in .env");
    process.exit(1);
}

const client = createClient({ url, authToken });

async function init() {
    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                category_id TEXT NOT NULL,
                candidate_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, category_id)
            );
        `);
        console.log("✅ Table 'votes' created successfully.");
    } catch (e) {
        console.error("❌ Error creating table:", e);
        process.exit(1);
    }
}

init();
