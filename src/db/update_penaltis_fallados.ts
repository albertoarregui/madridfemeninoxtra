
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
        console.log('--- Modificando tabla penaltis_fallados ---');

        // 1. Añadir columna video_url
        try {
            await client.execute("ALTER TABLE penaltis_fallados ADD COLUMN video_url TEXT");
            console.log('✅ Columna "video_url" añadida a "penaltis_fallados".');
        } catch (e) {
            if (!e.message.includes("duplicate column name")) console.error(`❌ Error añadiendo video_url:`, e.message);
        }

        // 2. Quitar columna motivo
        // Nota: En SQLite/LibSQL moderno se puede usar DROP COLUMN. 
        // Si fallara por versión, se ignoraría.
        try {
            await client.execute("ALTER TABLE penaltis_fallados DROP COLUMN motivo");
            console.log('✅ Columna "motivo" eliminada de "penaltis_fallados".');
        } catch (e) {
            console.error(`❌ Error eliminando motivo:`, e.message);
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        client.close();
    }
}

run();
