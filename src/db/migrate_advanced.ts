
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

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
        console.log('--- Añadiendo columnas a estadisticas_partidos ---');

        const alterStatements = [
            // Real Madrid
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_grandes_ocasiones INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_tiros INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_tiros_puerta INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_tiros_palo INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_paradas INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_corners INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_pases_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_pases_completados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_pases_largo_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_pases_largo_completados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_pases_tercio_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_pases_tercio_completados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_centros_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_centros_completados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_toques_area_rival INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_entradas_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_entradas_ganadas INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_tiros_libres INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_duelos_suelo_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_duelos_suelo_ganados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_duelos_aereos_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_duelos_aereos_ganados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_regates INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_intercepciones INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_recuperaciones INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_despejes INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_fueras_juego INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rm_asistencias_esperadas REAL DEFAULT 0.0",

            // Rival
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_grandes_ocasiones INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_tiros INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_tiros_puerta INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_tiros_palo INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_paradas INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_corners INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_pases_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_pases_completados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_pases_largo_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_pases_largo_completados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_pases_tercio_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_pases_tercio_completados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_centros_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_centros_completados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_toques_area_rival INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_entradas_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_entradas_ganadas INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_tiros_libres INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_duelos_suelo_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_duelos_suelo_ganados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_duelos_aereos_totales INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_duelos_aereos_ganados INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_regates INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_intercepciones INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_recuperaciones INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_despejes INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_fueras_juego INTEGER DEFAULT 0",
            "ALTER TABLE estadisticas_partidos ADD COLUMN rival_asistencias_esperadas REAL DEFAULT 0.0"
        ];

        for (const statement of alterStatements) {
            try {
                await client.execute(statement);
                console.log(`✅ Ejecutado: ${statement.substring(0, 50)}...`);
            } catch (e) {
                // Silenciar errores si la columna ya existe
                if (!e.message.includes("duplicate column name")) {
                    console.error(`❌ Error en: ${statement}`, e.message);
                }
            }
        }

        console.log('\n--- Verificando estadisticas_jugadoras ---');
        // La tabla ya existe, pero aseguramos que tenga todas las columnas solicitadas
        const jugadorasCols = [
            "ALTER TABLE estadisticas_jugadoras ADD COLUMN faltas_ganadas INTEGER DEFAULT 0"
        ];

        for (const statement of jugadorasCols) {
            try {
                await client.execute(statement);
                console.log(`✅ Ejecutado: ${statement}`);
            } catch (e) {
                if (!e.message.includes("duplicate column name")) {
                    console.error(`❌ Error en: ${statement}`, e.message);
                }
            }
        }

        console.log('\n✅ Migración completada.');

    } catch (error) {
        console.error('❌ Error fatal en migración:', error);
    } finally {
        client.close();
    }
}

run();
