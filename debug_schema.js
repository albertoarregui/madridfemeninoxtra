
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const val = values.join('=').trim();
            // Remove quotes if present
            process.env[key.trim()] = val.replace(/^["']|["']$/g, '');
        }
    });
} catch (error) {
    console.error("Could not read .env file:", error);
}

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function debugDB() {
    try {
        console.log("Checking 'alineaciones' table structure and content...");

        // Check finding ANY random lineup
        const randomLineup = await client.execute("SELECT * FROM alineaciones LIMIT 1");
        if (randomLineup.rows.length === 0) {
            console.log("WARNING: Table 'alineaciones' is completely EMPTY.");
        } else {
            console.log("Found at least one lineup entry:");
            console.log(Object.keys(randomLineup.rows[0])); // Print column names
            console.log(randomLineup.rows[0]);
        }

        // Check finding ANY random substitution
        const randomSub = await client.execute("SELECT * FROM cambios LIMIT 1");
        if (randomSub.rows.length === 0) {
            console.log("WARNING: Table 'cambios' is completely EMPTY.");
        } else {
            console.log("Found at least one substitution entry:");
            console.log(Object.keys(randomSub.rows[0]));
            console.log(randomSub.rows[0]);
        }

    } catch (e) {
        console.error("DB Error:", e);
    }
}

debugDB();
