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
  console.log(`${table}: ${before} -> ${after} filas | FK check: ${fkc.rows.length} | ${ok ? 'OK ✅' : 'REVISAR ❌'}`);
  if (!ok) throw new Error(`Rebuild de ${table} fallo`);
}

async function main() {
  const tBefore = await count('trayectoria_entrenadores');
  await rebuild('trayectoria_entrenadores', tBefore, [
    `CREATE TABLE trayectoria_entrenadores_new (
      id_trayectoria INTEGER PRIMARY KEY AUTOINCREMENT,
      id_entrenador INTEGER NOT NULL,
      club TEXT NOT NULL,
      año_inicio INTEGER,
      año_fin INTEGER,
      FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id_entrenador)
    )`,
    `INSERT INTO trayectoria_entrenadores_new (id_trayectoria,id_entrenador,club,año_inicio,año_fin)
       SELECT id_trayectoria,id_entrenador,club,
         CAST(año_inicio AS INTEGER), CAST(año_fin AS INTEGER) FROM trayectoria_entrenadores`,
    `DROP TABLE trayectoria_entrenadores`,
    `ALTER TABLE trayectoria_entrenadores_new RENAME TO trayectoria_entrenadores`,
    `CREATE INDEX idx_trayectoria_ent_id ON trayectoria_entrenadores (id_entrenador)`,
  ]);

  const gBefore = await count('goles_propia');
  await rebuild('goles_propia', gBefore, [
    `CREATE TABLE goles_propia_new (
      id_autogol INTEGER PRIMARY KEY AUTOINCREMENT,
      id_partido INTEGER NOT NULL,
      id_jugadora INTEGER REFERENCES jugadoras(id_jugadora),
      rival_nombre TEXT,
      minuto TEXT,
      FOREIGN KEY(id_partido) REFERENCES partidos(id_partido),
      CHECK (
        (id_jugadora IS NOT NULL AND rival_nombre IS NULL) OR
        (id_jugadora IS NULL AND rival_nombre IS NOT NULL)
      )
    )`,
    `INSERT INTO goles_propia_new (id_autogol,id_partido,id_jugadora,rival_nombre,minuto)
       SELECT id_autogol,id_partido,id_jugadora,rival_nombre, CAST(minuto AS TEXT) FROM goles_propia`,
    `DROP TABLE goles_propia`,
    `ALTER TABLE goles_propia_new RENAME TO goles_propia`,
    `CREATE INDEX idx_autogoles_jug ON goles_propia (id_jugadora)`,
  ]);

  console.log('\nFase C completada.');
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
