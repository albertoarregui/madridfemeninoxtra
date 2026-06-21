import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) { console.error('No creds'); process.exit(1); }
  const c = createClient({ url, authToken });

  const cnt = async () => Number((await c.execute('SELECT COUNT(*) n FROM estadisticas_jugadoras')).rows[0].n);
  const before = await cnt();

  // Keep, per (id_partido,id_jugadora): row with valoracion NOT NULL first, then highest id (latest scrape).
  await c.execute(`
    DELETE FROM estadisticas_jugadoras
    WHERE id_est_jugadora NOT IN (
      SELECT id_est_jugadora FROM (
        SELECT id_est_jugadora,
          ROW_NUMBER() OVER (
            PARTITION BY id_partido, id_jugadora
            ORDER BY (CASE WHEN valoracion IS NOT NULL THEN 1 ELSE 0 END) DESC, id_est_jugadora DESC
          ) rn
        FROM estadisticas_jugadoras
      ) WHERE rn = 1
    )`);

  const after = await cnt();
  console.log(`estadisticas_jugadoras: ${before} -> ${after} (borradas ${before - after})`);

  const dup = await c.execute(`SELECT COUNT(*) c FROM (SELECT id_partido,id_jugadora,COUNT(*) n FROM estadisticas_jugadoras GROUP BY 1,2 HAVING n>1)`);
  console.log('duplicados restantes:', dup.rows[0].c);

  // sanity: rows that still have valoracion
  const v = await c.execute('SELECT COUNT(*) n FROM estadisticas_jugadoras WHERE valoracion IS NOT NULL');
  console.log('filas con valoracion tras dedup:', v.rows[0].n);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
