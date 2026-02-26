
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
        console.log('--- Añadiendo columna "iso" a la tabla jugadoras ---');
        await client.execute("ALTER TABLE jugadoras ADD COLUMN iso TEXT");
        console.log('✅ Columna "iso" añadida a "jugadoras".');

    } catch (error) {
        if (error.message.includes("duplicate column name")) {
            console.log('ℹ️ La columna "iso" ya existe en "jugadoras".');
        } else {
            console.error('❌ Error fatal:', error.message);
        }
    } finally {
        client.close();
    }
}

run();
