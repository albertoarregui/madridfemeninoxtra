
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
        console.log('--- Añadiendo columnas de fotos a la tabla dorsales ---');

        const alterStatements = [
            "ALTER TABLE dorsales ADD COLUMN foto_url TEXT",
            "ALTER TABLE dorsales ADD COLUMN foto_perfil_url TEXT"
        ];

        for (const sql of alterStatements) {
            try {
                await client.execute(sql);
                console.log(`✅ Ejecutado en "dorsales": ${sql.split('ADD COLUMN ')[1]}`);
            } catch (e) {
                if (e.message.includes("duplicate column name")) {
                    console.log(`ℹ️ La columna ya existe en "dorsales".`);
                } else {
                    console.error(`❌ Error en "dorsales":`, e.message);
                }
            }
        }

        console.log('\n🚀 Actualización completada. Ahora puedes tener fotos diferentes por cada temporada.');

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        client.close();
    }
}

run();
