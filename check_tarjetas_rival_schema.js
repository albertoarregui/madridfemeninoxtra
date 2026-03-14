
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
        const schema = await client.execute("PRAGMA table_info(tarjetas_rival)");
        console.log('Schema for tarjetas_rival:', JSON.stringify(schema.rows, null, 2));

        const sample = await client.execute("SELECT * FROM tarjetas_rival LIMIT 5");
        console.log('Sample data from tarjetas_rival:', JSON.stringify(sample.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

check();
