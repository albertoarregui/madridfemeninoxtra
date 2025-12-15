
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

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
} catch (e) { }

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        // 1. Get Match ID
        const matchRes = await client.execute("SELECT id_partido, club_local, club_visitante FROM partidos WHERE fecha LIKE '2020-10-04%'");
        if (matchRes.rows.length === 0) {
            console.log("No match found for 2020-10-04");
            return;
        }
        const matchId = matchRes.rows[0].id_partido;
        console.log(`Match ID: ${matchId}`);

        // 2. Check Alineaciones
        const alRes = await client.execute({ sql: "SELECT * FROM alineaciones WHERE id_partido = ?", args: [matchId] });
        console.log(`Alineaciones count: ${alRes.rows.length}`);

        if (alRes.rows.length > 0) {
            console.log("Columns:", Object.keys(alRes.rows[0]));
            console.log("First Row:", alRes.rows[0]);
        } else {
            // Check if ANY alineaciones exist in the table
            const anyAl = await client.execute("SELECT * FROM alineaciones LIMIT 1");
            console.log(`Total rows in alineaciones (sample): ${anyAl.rows.length}`);
            if (anyAl.rows.length > 0) {
                console.log("Columns in table:", Object.keys(anyAl.rows[0]));
            }
        }

    } catch (e) {
        console.error(e);
    }
}
run();
