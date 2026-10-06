import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
    url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!,
    authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)!,
});

async function main() {
    await client.execute(`
        CREATE TABLE IF NOT EXISTS fabrica_jugadoras (
            id_fabrica_jugadora INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            posicion TEXT,
            portrait_url TEXT,
            portrait_source_url TEXT,
            id_jugadora INTEGER,
            confianza TEXT NOT NULL DEFAULT 'Alta',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_jugadora) REFERENCES jugadoras(id_jugadora)
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS fabrica_plantillas (
            id_plantilla INTEGER PRIMARY KEY AUTOINCREMENT,
            id_fabrica_jugadora INTEGER NOT NULL,
            temporada TEXT NOT NULL,
            equipo TEXT NOT NULL CHECK (equipo IN ('Real Madrid B','Juvenil','Cadete')),
            posicion TEXT,
            dorsal TEXT,
            vinculo TEXT NOT NULL DEFAULT 'Plantilla nominal',
            foto_url TEXT,
            fuente TEXT,
            fuente_url TEXT,
            confianza TEXT NOT NULL DEFAULT 'Alta',
            notas TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_fabrica_jugadora) REFERENCES fabrica_jugadoras(id_fabrica_jugadora),
            UNIQUE (id_fabrica_jugadora, temporada, equipo, vinculo)
        )
    `);

    await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_fabrica_plantillas_equipo_temporada
        ON fabrica_plantillas (equipo, temporada)
    `);

    await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_fabrica_jugadoras_id_jugadora
        ON fabrica_jugadoras (id_jugadora)
    `);

    const counts = await client.execute(`
        SELECT
            (SELECT COUNT(*) FROM fabrica_jugadoras) AS jugadoras,
            (SELECT COUNT(*) FROM fabrica_plantillas) AS plantillas
    `);

    console.log('Migración 12 completada.', counts.rows[0]);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('ERROR:', error);
        process.exit(1);
    });
