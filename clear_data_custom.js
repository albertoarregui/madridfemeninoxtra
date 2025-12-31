
import 'dotenv/config';
import { createClient } from "@libsql/client";

async function run() {
    console.log("Starting data clear...");
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error("No TURSO_DATABASE_URL found in .env");
        process.exit(1);
    }

    const client = createClient({
        url,
        authToken,
    });

    // Try to clear tables
    const tables = ['season_awards', 'season-awards', 'predictions', 'ratings', 'mvp_votes'];

    for (const table of tables) {
        try {
            // Check if table exists first prevents ugly errors? No, just try delete.
            await client.execute(`DELETE FROM "${table}"`);
            console.log(`✅ Cleared ${table}`);
        } catch (e) {
            // Ignore "no such table" errors specifically if we want, but logging is fine.
            if (e.message.includes("no such table")) {
                console.log(`ℹ️ Table ${table} does not exist.`);
            } else {
                console.log(`❌ Error clearing ${table}: ${e.message}`);
            }
        }
    }
}

run();
