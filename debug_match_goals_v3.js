import * as LibSql from "@libsql/client";
import * as fs from 'fs';
import * as path from 'path';

async function debugMatchData() {
    console.log("LibSql exports keys:", Object.keys(LibSql));

    // Manually parse .env
    const envPath = path.resolve(process.cwd(), '.env');
    let env = {};
    try {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim().replace(/"/g, '').replace(/'/g, '');
        });
    } catch (e) {
        console.error("Could not read .env", e);
    }

    const url = env.TURSO_DATABASE_URL;
    const authToken = env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error("Missing creds in .env");
        return;
    }

    const createClient = LibSql.createClient || LibSql.default?.createClient;
    if (!createClient) {
        console.error("Could not find createClient function");
        return;
    }

    const client = createClient({ url, authToken });

    // 1. Find the match ID for RM vs Barcelona on 2020-10-04
    console.log("Searching for match RM vs Barcelona (2020-10-04)...");
    const matchQuery = `
        SELECT * 
        FROM partidos 
        WHERE rival LIKE '%Barcelona%' AND fecha LIKE '2020-10-04%'
    `;

    const matchResult = await client.execute(matchQuery);

    if (matchResult.rows.length === 0) {
        console.log("Match not found!");
    } else {
        console.log(`Found ${matchResult.rows.length} matches.`);
        matchResult.rows.forEach(m => {
            console.log(`Match: ID=${m.id_partido}, Rival=${m.rival}, Fecha=${m.fecha}, Season=${m.id_temporada}, GolesRM=${m.goles_rm}`);
        });

        // Use the first ID found
        const matchId = matchResult.rows[0].id_partido;

        // 2. Check goals for this ID
        const goalsQuery = `
            SELECT * FROM goles_y_asistencias WHERE id_partido = ?
        `;
        const goalsResult = await client.execute({ sql: goalsQuery, args: [matchId] });
        console.log(`Goals found for ID ${matchId}:`, goalsResult.rows);
    }
}

debugMatchData();
