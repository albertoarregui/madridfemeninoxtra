import { createClient } from "@libsql/client";
import * as fs from 'fs';
import * as path from 'path';

async function debugMatchData() {
    // Manually parse .env
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env: any = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const url = env.TURSO_DATABASE_URL;
    const authToken = env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error("Missing creds");
        return;
    }

    const client = createClient({ url, authToken });

    // 1. Find the match ID for RM vs Barcelona on 2020-10-04
    const matchQuery = `
        SELECT id_partido, rival, fecha, jornada 
        FROM partidos 
        WHERE rival LIKE '%Barcelona%' AND fecha LIKE '2020-10-04%'
    `;

    console.log("Searching for match...");
    const matchResult = await client.execute(matchQuery);

    if (matchResult.rows.length === 0) {
        console.log("Match not found!");
        return;
    }

    const match = matchResult.rows[0];
    const matchId = match.id_partido;
    console.log(`Found match: ID=${matchId}, Rival=${match.rival}, Fecha=${match.fecha}`);

    // 2. Check goals for this ID
    const goalsQuery = `
        SELECT * FROM goles_y_asistencias WHERE id_partido = ?
    `;
    const goalsResult = await client.execute({ sql: goalsQuery, args: [matchId] });
    console.log(`Goals found for ID ${matchId}:`, goalsResult.rows);
}

debugMatchData();
