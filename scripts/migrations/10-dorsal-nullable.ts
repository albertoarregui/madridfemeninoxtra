import { createClient, type InStatement } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!, authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)! });

const count = async (t: string) => Number((await c.execute(`SELECT COUNT(*) n FROM ${t}`)).rows[0].n);

async function rebuild(table: string, before: number, stmts: string[]) {
  await c.batch(stmts.map(sql => ({ sql }) as InStatement), 'write');
  const after = await count(table);
  const fkc = await c.execute(`PRAGMA foreign_key_check(${table})`);
  const ok = before === after && fkc.rows.length === 0;
  console.log(`${table}: ${before} -> ${after} filas | foreign_key_check: ${fkc.rows.length} violaciones | ${ok ? 'OK ✅' : 'REVISAR ❌'}`);
  if (!ok) throw new Error(`Rebuild de ${table} fallo`);
}

async function main() {
  // ---------- dorsales: dorsal pasa a ser NULLABLE (a principio de temporada puede no saberse) ----------
  const before = await count('dorsales');
  await rebuild('dorsales', before, [
    `CREATE TABLE dorsales_new (
      id_dorsal INTEGER PRIMARY KEY AUTOINCREMENT,
      id_jugadora INTEGER NOT NULL,
      id_temporada INTEGER NOT NULL,
      dorsal TEXT,
      id_club INTEGER,
      fecha_debut TEXT,
      foto_url TEXT,
      foto_perfil_url TEXT,
      id_categoria INTEGER NOT NULL DEFAULT 4,
      FOREIGN KEY (id_jugadora) REFERENCES jugadoras(id_jugadora),
      FOREIGN KEY (id_club) REFERENCES clubes(id_club),
      FOREIGN KEY (id_temporada) REFERENCES temporadas(id_temporada),
      FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
      UNIQUE (id_jugadora, id_temporada, id_categoria)
    )`,
    `INSERT INTO dorsales_new (id_dorsal,id_jugadora,id_temporada,dorsal,id_club,fecha_debut,foto_url,foto_perfil_url,id_categoria)
       SELECT id_dorsal,id_jugadora,id_temporada,dorsal,id_club,fecha_debut,foto_url,foto_perfil_url,id_categoria FROM dorsales`,
    `DROP TABLE dorsales`,
    `ALTER TABLE dorsales_new RENAME TO dorsales`,
    `CREATE INDEX idx_dorsales_historial ON dorsales (id_jugadora, id_temporada, dorsal)`,
  ]);

  console.log('\nMigración 10 completada: dorsales.dorsal ahora admite NULL.');
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
