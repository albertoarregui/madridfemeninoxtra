import { createClient } from "@libsql/client";
import fs from 'fs';
import path from 'path';

// Manual .env parsing
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0) {
                const val = values.join('=').trim();
                process.env[key.trim()] = val.replace(/^["']|["']$/g, '');
            }
        });
    }
} catch (e) {
    console.error("Error reading .env:", e.message);
}

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkStats() {
    try {
        console.log("--- 1. Schema: goles_y_asistencias ---");
        const schema = await client.execute("PRAGMA table_info(goles_y_asistencias)");
        console.log(schema.rows);

        console.log("\n--- 2. Sample Data: goles_y_asistencias ---");
        const data = await client.execute("SELECT * FROM goles_y_asistencias LIMIT 5");
        console.log(data.rows);

        console.log("\n--- 3. Distinct Match IDs in Stats ---");
        const matches = await client.execute("SELECT DISTINCT id_partido FROM goles_y_asistencias LIMIT 10");
        console.log(matches.rows);

        console.log("\n--- 4. Check for Match ID 15 (Example) ---");
        // Assuming we are looking at match ID 15 from previous context, or we can list all matches with goals
        const matchData = await client.execute("SELECT * FROM goles_y_asistencias WHERE id_partido = 15");
        console.log(matchData.rows);

    } catch (e) {
        console.error(e);
    }
}

checkStats();
