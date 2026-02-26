
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
        console.log('--- Iniciando actualizaciones de esquema ---');

        // 1. Añadir columnas de imagen a las tablas maestras
        const tablesWithImages = ['arbitras', 'clubes', 'competiciones', 'entrenadores', 'estadios', 'jugadoras'];
        for (const table of tablesWithImages) {
            try {
                await client.execute(`ALTER TABLE ${table} ADD COLUMN foto_url TEXT`);
                console.log(`✅ Columna "foto_url" añadida a "${table}".`);
            } catch (e) {
                if (!e.message.includes("duplicate column name")) console.error(`❌ Error en ${table}:`, e.message);
            }
        }

        // 2. Añadir columnas a "partidos"
        const partidosCols = [
            "ALTER TABLE partidos ADD COLUMN mvp_foto_url TEXT",
            "ALTER TABLE partidos ADD COLUMN once_inicial_url TEXT",
            "ALTER TABLE partidos ADD COLUMN formacion TEXT"
        ];
        for (const sql of partidosCols) {
            try {
                await client.execute(sql);
                console.log(`✅ Ejecutado en "partidos": ${sql.split('ADD COLUMN ')[1]}`);
            } catch (e) {
                if (!e.message.includes("duplicate column name")) console.error(`❌ Error en "partidos":`, e.message);
            }
        }

        // 3. Añadir columna de video a "goles_y_asistencias"
        try {
            await client.execute("ALTER TABLE goles_y_asistencias ADD COLUMN video_url TEXT");
            console.log('✅ Columna "video_url" añadida a "goles_y_asistencias".');
        } catch (e) {
            if (!e.message.includes("duplicate column name")) console.error(`❌ Error en "goles_y_asistencias":`, e.message);
        }

        // 4. Renombrar tabla penaltis_tanda -> tanda_penaltis
        try {
            await client.execute("ALTER TABLE penaltis_tanda RENAME TO tanda_penaltis");
            console.log('✅ Tabla "penaltis_tanda" renombrada a "tanda_penaltis".');
        } catch (e) {
            if (e.message.includes("no such table")) {
                console.log('ℹ️ La tabla ya se llama "tanda_penaltis" o no existe.');
            } else {
                console.error(`❌ Error renombrando tabla:`, e.message);
            }
        }

        console.log('\n🚀 Todas las actualizaciones de esquema completadas.');

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        client.close();
    }
}

run();
