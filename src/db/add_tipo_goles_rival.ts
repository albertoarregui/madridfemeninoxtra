
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

async function run() {
    if (!url || !authToken) {
        console.error('❌ Error: No se encontraron las credenciales de Turso.');
        process.exit(1);
    }

    const client = createClient({ url, authToken });

    try {
        console.log('--- Listando tablas ---');
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log(tables.rows.map(r => r.name));

        // El usuario mencionó "goles_rival"
        console.log('\n--- Modificando goles_rival ---');
        await client.execute("ALTER TABLE goles_rival ADD COLUMN tipo TEXT");
        console.log('✅ Columna "tipo" añadida a "goles_rival".');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.close();
    }
}

run();
