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

async function run() {
    try {
        console.log("Checking table schema...");
        const result = await client.execute("SELECT * FROM goles_y_asistencias LIMIT 5");
        console.log("Sample Data:", result.rows);
    } catch (e) {
        console.error(e);
    }
}

run();
