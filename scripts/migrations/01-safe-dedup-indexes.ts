import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) { console.error('No creds'); process.exit(1); }
  const c = createClient({ url, authToken });

  const before = async (t: string) => Number((await c.execute(`SELECT COUNT(*) n FROM ${t}`)).rows[0].n);

  // --- Dedup alineaciones: keep the richest row per (id_partido, id_jugadora) ---
  const aBefore = await before('alineaciones');
  await c.execute(`
    DELETE FROM alineaciones
    WHERE id_alineacion NOT IN (
      SELECT id_alineacion FROM (
        SELECT id_alineacion,
          ROW_NUMBER() OVER (
            PARTITION BY id_partido, id_jugadora
            ORDER BY minutos_jugados DESC, titular DESC, convocada DESC, id_alineacion ASC
          ) rn
        FROM alineaciones
      ) WHERE rn = 1
    )`);
  const aAfter = await before('alineaciones');
  console.log(`alineaciones: ${aBefore} -> ${aAfter} (borradas ${aBefore - aAfter})`);

  // --- Drop redundant indexes ---
  const dropIdx = [
    'idx_trayectoria_jug',      // identico a idx_trayectoria_jug_id (id_jugadora)
    'idx_goles_evento_partido', // identico a idx_goles_partido (id_partido)
    'idx_goles_goleadora',      // prefijo de idx_goles_jugadora (goleadora, asistente)
    'idx_dorsales_hist',        // prefijo de idx_dorsales_historial (id_jugadora, id_temporada, dorsal)
  ];
  for (const idx of dropIdx) {
    await c.execute(`DROP INDEX IF EXISTS ${idx}`);
    console.log(`drop index ${idx} OK`);
  }

  // --- Verify no remaining dup in alineaciones ---
  const dup = await c.execute(`SELECT COUNT(*) c FROM (SELECT id_partido,id_jugadora,COUNT(*) n FROM alineaciones GROUP BY 1,2 HAVING n>1)`);
  console.log('alineaciones duplicados restantes:', dup.rows[0].c);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
