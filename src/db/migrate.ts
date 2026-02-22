
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env
dotenv.config();

const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

async function run() {
    if (!url || !authToken) {
        console.error('❌ Error: No se encontraron las credenciales de Turso en el archivo .env');
        process.exit(1);
    }

    const client = createClient({ url, authToken });

    try {
        console.log('--- Inspeccionando tabla estadisticas_partidos ---');
        const schema = await client.execute("PRAGMA table_info(estadisticas_partidos)");
        console.log(JSON.stringify(schema.rows, null, 2));

        console.log('\n--- Creando tabla estadisticas_jugadoras ---');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS estadisticas_jugadoras (
                id_est_jugadora INTEGER PRIMARY KEY AUTOINCREMENT,
                id_partido INTEGER NOT NULL,
                id_jugadora INTEGER NOT NULL,
                
                -- Rendimiento General
                valoracion REAL,
                
                -- Ataque y Tiros
                tiros_totales INTEGER DEFAULT 0,
                tiros_puerta INTEGER DEFAULT 0,
                toques INTEGER DEFAULT 0,
                toques_area_rival INTEGER DEFAULT 0,
                regates_totales INTEGER DEFAULT 0,
                regates_completados INTEGER DEFAULT 0,
                perdidas INTEGER DEFAULT 0,
                fueras_juego INTEGER DEFAULT 0,
                
                -- Pases y Creación
                pases_totales INTEGER DEFAULT 0,
                pases_completados INTEGER DEFAULT 0,
                pases_clave INTEGER DEFAULT 0,
                pases_ultimo_tercio INTEGER DEFAULT 0,
                pases_largo_totales INTEGER DEFAULT 0,
                pases_largo_completados INTEGER DEFAULT 0,
                centros_totales INTEGER DEFAULT 0,
                centros_completados INTEGER DEFAULT 0,
                asistencias_esperadas REAL DEFAULT 0.0,
                
                -- Defensa y Duelos
                entradas INTEGER DEFAULT 0,
                bloqueos INTEGER DEFAULT 0,
                despejes INTEGER DEFAULT 0,
                intercepciones INTEGER DEFAULT 0,
                recuperaciones INTEGER DEFAULT 0,
                regateada INTEGER DEFAULT 0,
                duelos_suelo_totales INTEGER DEFAULT 0,
                duelos_suelo_ganados INTEGER DEFAULT 0,
                duelos_aereos_totales INTEGER DEFAULT 0,
                duelos_aereos_ganados INTEGER DEFAULT 0,
                
                -- Disciplina
                faltas_recibidas INTEGER DEFAULT 0,
                faltas_cometidas INTEGER DEFAULT 0,

                FOREIGN KEY (id_partido) REFERENCES partidos(id_partido),
                FOREIGN KEY (id_jugadora) REFERENCES jugadoras(id_jugadora)
            );
        `);
        console.log('✅ Tabla estadisticas_jugadoras creada o ya existente.');

    } catch (error) {
        console.error('❌ Error ejecutando migración:', error);
    } finally {
        client.close();
    }
}

run();
