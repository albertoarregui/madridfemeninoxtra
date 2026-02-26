
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
        console.log('--- Creando tabla penaltis_fallados ---');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS penaltis_fallados (
                id_penalti_fallado INTEGER PRIMARY KEY AUTOINCREMENT,
                id_partido INTEGER NOT NULL,
                id_jugadora INTEGER, -- NULL si es rival
                nombre_rival TEXT,   -- NULL si es jugadora del equipo
                minuto TEXT,
                motivo TEXT,         -- 'Parada', 'Fuera', 'Palo'
                FOREIGN KEY (id_partido) REFERENCES partidos(id_partido),
                FOREIGN KEY (id_jugadora) REFERENCES jugadoras(id_jugadora)
            );
        `);
        console.log('✅ Tabla "penaltis_fallados" creada.');

        console.log('\n--- Añadiendo columna "tipo" a la tabla jugadoras ---');
        try {
            await client.execute("ALTER TABLE jugadoras ADD COLUMN tipo TEXT");
            console.log('✅ Columna "tipo" añadida a "jugadoras".');
        } catch (e) {
            if (e.message.includes("duplicate column name")) {
                console.log('ℹ️ La columna "tipo" ya existe en "jugadoras".');
            } else {
                console.error(`❌ Error en "jugadoras":`, e.message);
            }
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        client.close();
    }
}

run();
