import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!, authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)! });
const one = async (s: string) => Number((await c.execute(s)).rows[0].v);

async function main() {
  const before = await one('SELECT COUNT(*) v FROM partidos');

  // tiempo_partido ya no se usa (no hay retransmisión del minuto en directo)
  await c.execute('ALTER TABLE partidos DROP COLUMN tiempo_partido');

  const after = await one('SELECT COUNT(*) v FROM partidos');
  const cols = (await c.execute('PRAGMA table_info(partidos)')).rows.map(r => r.name as string);
  const gone = !cols.includes('tiempo_partido');
  const fkc = await c.execute('PRAGMA foreign_key_check(partidos)');

  console.log(`partidos: ${before} -> ${after} filas ${before === after ? '✅' : '❌'}`);
  console.log(`columna tiempo_partido eliminada: ${gone ? 'sí ✅' : 'no ❌'}`);
  console.log(`foreign_key_check: ${fkc.rows.length} violaciones ${fkc.rows.length === 0 ? '✅' : '❌'}`);

  if (!gone || before !== after || fkc.rows.length !== 0) throw new Error('Migración 11 falló');
  console.log('\nMigración 11 completada: partidos.tiempo_partido eliminada.');
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
