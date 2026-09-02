import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const indexes = [
    ['idx_tarjetas_partido_jugadora_tipo', 'tarjetas (id_partido, id_jugadora, tipo_tarjeta)'],
    ['idx_tarjetas_rival_partido', 'tarjetas_rival (id_partido)'],
    ['idx_goles_rival_partido', 'goles_rival (id_partido)'],
    ['idx_goles_propia_partido', 'goles_propia (id_partido)'],
    ['idx_tanda_penaltis_partido', 'tanda_penaltis (id_partido)'],
    ['idx_penaltis_fallados_partido', 'penaltis_fallados (id_partido)'],
    ['idx_partidos_estadio', 'partidos (id_estadio)'],
    ['idx_partidos_arbitra', 'partidos (id_arbitra)'],
] as const;

async function main() {
    const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) throw new Error('Credenciales de Turso no configuradas');

    const client = createClient({ url, authToken });

    for (const [name, definition] of indexes) {
        await client.execute(`CREATE INDEX IF NOT EXISTS ${name} ON ${definition}`);
    }

    const result = await client.execute(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'index'
          AND name IN (${indexes.map(() => '?').join(', ')})
        ORDER BY name
    `, indexes.map(([name]) => name));

    if (result.rows.length !== indexes.length) {
        throw new Error(`Solo se verificaron ${result.rows.length} de ${indexes.length} índices`);
    }

    console.log(`Migración 13 OK: ${result.rows.length} índices verificados`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
