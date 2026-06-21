import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config({ path: '.env.local' });

function sqlValue(v: any): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'bigint') return String(v);
  if (v instanceof Uint8Array) return "X'" + Buffer.from(v).toString('hex') + "'";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

async function main() {
  const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) { console.error('No creds'); process.exit(1); }
  const c = createClient({ url, authToken });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join('scripts', 'migrations', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `backup-${ts}.sql`);
  const out: string[] = ['PRAGMA foreign_keys=OFF;', 'BEGIN TRANSACTION;'];

  const schema = await c.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END, name"
  );
  const tables = (await c.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  )).rows.map((r: any) => r.name as string);

  // table + index DDL
  for (const r of schema.rows as any[]) {
    if (r.type === 'table') out.push(`${r.sql};`);
  }
  // data
  let totalRows = 0;
  for (const t of tables) {
    const res = await c.execute(`SELECT * FROM "${t}"`);
    if (res.rows.length === 0) continue;
    const cols = res.columns.map((c: string) => `"${c}"`).join(', ');
    for (const row of res.rows as any[]) {
      const vals = res.columns.map((col: string) => sqlValue(row[col])).join(', ');
      out.push(`INSERT INTO "${t}" (${cols}) VALUES (${vals});`);
      totalRows++;
    }
  }
  // indexes last
  for (const r of schema.rows as any[]) {
    if (r.type === 'index') out.push(`${r.sql};`);
  }
  out.push('COMMIT;', 'PRAGMA foreign_keys=ON;');

  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`Backup OK -> ${file}`);
  console.log(`Tablas: ${tables.length}, filas: ${totalRows}, tamaño: ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
