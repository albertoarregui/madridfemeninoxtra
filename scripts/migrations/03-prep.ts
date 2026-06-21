import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const c = createClient({ url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!, authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)! });

  // 1. Borrar dorsal "3" duplicado de Caroline Moller (dejar el 16)
  const r1 = await c.execute("DELETE FROM dorsales WHERE id_dorsal = 162");
  console.log('Moller dorsal "3" borrado:', r1.rowsAffected, 'fila(s)');

  // 2. Borrar alineacion huerfana (id_jugadora=88 inexistente)
  const r2 = await c.execute("DELETE FROM alineaciones WHERE id_alineacion = 7523");
  console.log('Alineacion huerfana borrada:', r2.rowsAffected, 'fila(s)');

  // 3. Tabla categorias + seed (cantera)
  await c.execute(`CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    slug   TEXT NOT NULL UNIQUE,
    nivel  INTEGER NOT NULL
  )`);
  await c.batch([
    { sql: "INSERT OR IGNORE INTO categorias (id_categoria,nombre,slug,nivel) VALUES (?,?,?,?)", args: [1, 'Cadete', 'cadete', 1] },
    { sql: "INSERT OR IGNORE INTO categorias (id_categoria,nombre,slug,nivel) VALUES (?,?,?,?)", args: [2, 'Juvenil', 'juvenil', 2] },
    { sql: "INSERT OR IGNORE INTO categorias (id_categoria,nombre,slug,nivel) VALUES (?,?,?,?)", args: [3, 'Real Madrid B', 'real-madrid-b', 3] },
    { sql: "INSERT OR IGNORE INTO categorias (id_categoria,nombre,slug,nivel) VALUES (?,?,?,?)", args: [4, 'Primer equipo', 'primer-equipo', 4] },
  ], 'write');
  const cat = await c.execute("SELECT id_categoria,nombre,nivel FROM categorias ORDER BY nivel");
  console.log('categorias:', JSON.stringify(cat.rows));

  // 4. UNIQUE en estadisticas_jugadoras (ya deduplicada; no necesita rebuild, tiene FKs)
  await c.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_est_jugadora_partido ON estadisticas_jugadoras(id_partido, id_jugadora)");
  console.log('UNIQUE index uq_est_jugadora_partido OK');

  console.log('\nFase A completada.');
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
