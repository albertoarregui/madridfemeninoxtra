
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
        console.log('--- Renombrando columna en "redes_sociales" ---');
        await client.execute("ALTER TABLE redes_sociales RENAME COLUMN url_twitter TO url_x");
        console.log('✅ Columna "url_twitter" renombrada con éxito a "url_x".');

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        client.close();
    }
}

run();
