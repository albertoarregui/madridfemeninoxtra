
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    const client = createClient({
        url: url || '',
        authToken: authToken || '',
    });

    try {
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables in DB:', JSON.stringify(tables.rows.map(r => r.name), null, 2));

        // Usually Real Madrid players are the only ones tracked in detail in some tables
        // Or there is an id_equipo in tarjetas but I missed it?
        // Let's re-run PRAGMA table_info(tarjetas) just in case I misread.
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

check();
