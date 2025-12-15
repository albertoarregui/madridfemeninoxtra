
import { createClient } from "@libsql/client";
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const url = envVars.TURSO_DATABASE_URL;
const authToken = envVars.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const client = createClient({ url, authToken });

async function checkStadiumStats() {
    try {
        console.log("Checking stadium stats...");
        // 1. Get a list of stadiums from recent matches
        const stadiumsResult = await client.execute("SELECT DISTINCT estadio FROM partidos WHERE estadio IS NOT NULL LIMIT 5");
        const stadiums = stadiumsResult.rows.map(r => r.estadio);

        console.log("Found stadiums:", stadiums);

        for (const stadium of stadiums) {
            // Using the EXACT same query logic as in the app
            const query = `
                SELECT 
                    SUM(CASE WHEN goles_rm > goles_rival THEN 1 ELSE 0 END) as wins,
                    SUM(CASE WHEN goles_rm = goles_rival THEN 1 ELSE 0 END) as draws,
                    SUM(CASE WHEN goles_rm < goles_rival THEN 1 ELSE 0 END) as losses,
                    COUNT(*) as total
                FROM partidos 
                WHERE estadio = ? AND goles_rm IS NOT NULL
            `;

            const result = await client.execute({ sql: query, args: [stadium] });
            const stats = result.rows[0];
            console.log(`Stats for '${stadium}': Wins=${stats.wins}, Draws=${stats.draws}, Losses=${stats.losses}, Total=${stats.total}`);
        }

    } catch (e) {
        console.error("Error executing query:", e);
    }
}

checkStadiumStats();
