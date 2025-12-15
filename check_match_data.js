
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
    } else {
        console.log("Warning: .env file not found at " + envPath);
    }
} catch (e) {
    console.log("Error reading .env:", e);
}

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log("Searching for match on 2020-10-04...");
        const m = await client.execute("SELECT * FROM partidos WHERE fecha LIKE '2020-10-04%'");

        if (m.rows.length === 0) {
            console.log("Match not found in query.");
            return;
        }

        const id = m.rows[0].id_partido;
        console.log("Match Found. ID:", id);
        console.log("Teams:", m.rows[0].id_club_local, "vs", m.rows[0].id_club_visitante);

        // Check Alineaciones
        const a = await client.execute({ sql: "SELECT * FROM alineaciones WHERE id_partido = ?", args: [id] });
        console.log("Alineaciones count:", a.rows.length);
        if (a.rows.length > 0) {
            console.log("Sample Alineacion:", a.rows[0]);
        } else {
            console.log("DATA ISSUE: No alineaciones found for this match.");
        }

        // Check Cambios
        const c = await client.execute({ sql: "SELECT * FROM cambios WHERE id_partido = ?", args: [id] });
        console.log("Cambios count:", c.rows.length);

    } catch (e) {
        console.error("Execution Error:", e);
    }
}
run();
