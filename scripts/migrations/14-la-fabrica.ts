import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const statements = [
    `CREATE TABLE IF NOT EXISTS fabrica_hitos (
        id_hito INTEGER PRIMARY KEY,
        fecha TEXT,
        temporada TEXT,
        categoria TEXT NOT NULL,
        titulo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        orden INTEGER NOT NULL,
        fuente_url TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS fabrica_torneos (
        id_torneo INTEGER PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        anio INTEGER NOT NULL,
        competicion TEXT NOT NULL,
        categoria TEXT NOT NULL,
        sede TEXT,
        resultado_espana TEXT NOT NULL,
        posicion INTEGER NOT NULL,
        madridistas_oficiales INTEGER NOT NULL,
        canteranas_vinculadas INTEGER NOT NULL,
        total_convocadas INTEGER NOT NULL,
        ranking_rm INTEGER NOT NULL,
        ranking_compartido INTEGER NOT NULL DEFAULT 0,
        resumen TEXT,
        fuente_convocatoria_url TEXT NOT NULL,
        fuente_resultado_url TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS fabrica_aportaciones_club (
        id_torneo INTEGER NOT NULL,
        club TEXT NOT NULL,
        jugadoras INTEGER NOT NULL,
        PRIMARY KEY (id_torneo, club),
        FOREIGN KEY (id_torneo) REFERENCES fabrica_torneos(id_torneo) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS fabrica_participaciones (
        id_torneo INTEGER NOT NULL,
        id_jugadora INTEGER,
        nombre TEXT NOT NULL,
        club_en_torneo TEXT NOT NULL,
        vinculo_rm TEXT NOT NULL CHECK (
            vinculo_rm IN ('real_madrid_en_torneo','antes_de_llegar','despues_de_salir')
        ),
        es_aportacion_oficial_rm INTEGER NOT NULL DEFAULT 0,
        jugo_final INTEGER,
        titular_final INTEGER,
        capitana_final INTEGER NOT NULL DEFAULT 0,
        goles_torneo INTEGER,
        resumen TEXT,
        fuente_url TEXT,
        PRIMARY KEY (id_torneo, nombre),
        FOREIGN KEY (id_torneo) REFERENCES fabrica_torneos(id_torneo) ON DELETE CASCADE,
        FOREIGN KEY (id_jugadora) REFERENCES jugadoras(id_jugadora)
    )`,
    `CREATE TABLE IF NOT EXISTS fabrica_galardones (
        id_galardon INTEGER PRIMARY KEY,
        id_torneo INTEGER NOT NULL,
        id_jugadora INTEGER,
        nombre TEXT NOT NULL,
        galardon TEXT NOT NULL,
        organismo TEXT NOT NULL,
        detalle TEXT,
        orden INTEGER NOT NULL DEFAULT 0,
        fuente_url TEXT NOT NULL,
        FOREIGN KEY (id_torneo) REFERENCES fabrica_torneos(id_torneo) ON DELETE CASCADE,
        FOREIGN KEY (id_jugadora) REFERENCES jugadoras(id_jugadora)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_fabrica_hitos_orden ON fabrica_hitos (orden)',
    'CREATE INDEX IF NOT EXISTS idx_fabrica_aportaciones_torneo ON fabrica_aportaciones_club (id_torneo, jugadoras DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fabrica_participaciones_torneo ON fabrica_participaciones (id_torneo, es_aportacion_oficial_rm DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fabrica_participaciones_jugadora ON fabrica_participaciones (id_jugadora)',
    'CREATE INDEX IF NOT EXISTS idx_fabrica_galardones_torneo ON fabrica_galardones (id_torneo, orden)',
];

async function main() {
    const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) throw new Error('Credenciales de Turso no configuradas');

    const client = createClient({ url, authToken });

    for (const sql of statements) {
        await client.execute(sql);
    }

    const result = await client.execute(`
        SELECT COUNT(*) AS tablas
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN (
            'fabrica_hitos',
            'fabrica_torneos',
            'fabrica_aportaciones_club',
            'fabrica_participaciones',
            'fabrica_galardones'
          )
    `);

    if (Number(result.rows[0]?.tablas || 0) !== 5) {
        throw new Error('No se pudieron verificar las cinco tablas de La Fábrica');
    }

    console.log('Migración 14 OK: esquema de La Fábrica verificado');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
