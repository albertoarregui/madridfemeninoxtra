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
  // ---------- dorsales: +id_categoria(NOT NULL), id_temporada NOT NULL, +FK categoria, UNIQUE ----------
  const dBefore = await count('dorsales');
  await rebuild('dorsales', dBefore, [
    `CREATE TABLE dorsales_new (
      id_dorsal INTEGER PRIMARY KEY AUTOINCREMENT,
      id_jugadora INTEGER NOT NULL,
      id_temporada INTEGER NOT NULL,
      dorsal TEXT NOT NULL,
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
       SELECT id_dorsal,id_jugadora,id_temporada,dorsal,id_club,fecha_debut,foto_url,foto_perfil_url,4 FROM dorsales`,
    `DROP TABLE dorsales`,
    `ALTER TABLE dorsales_new RENAME TO dorsales`,
    `CREATE INDEX idx_dorsales_historial ON dorsales (id_jugadora, id_temporada, dorsal)`,
  ]);

  // ---------- alineaciones: +FK(partido CASCADE, jugadora), UNIQUE(partido,jugadora) ----------
  const aBefore = await count('alineaciones');
  await rebuild('alineaciones', aBefore, [
    `CREATE TABLE alineaciones_new (
      id_alineacion INTEGER PRIMARY KEY,
      id_partido INTEGER NOT NULL,
      id_jugadora INTEGER NOT NULL,
      convocada INTEGER NOT NULL,
      titular INTEGER NOT NULL,
      minutos_jugados INTEGER NOT NULL,
      minuto_entrada INTEGER,
      minuto_salida INTEGER,
      FOREIGN KEY (id_partido) REFERENCES partidos(id_partido) ON DELETE CASCADE,
      FOREIGN KEY (id_jugadora) REFERENCES jugadoras(id_jugadora),
      UNIQUE (id_partido, id_jugadora)
    )`,
    `INSERT INTO alineaciones_new SELECT * FROM alineaciones`,
    `DROP TABLE alineaciones`,
    `ALTER TABLE alineaciones_new RENAME TO alineaciones`,
    `CREATE INDEX idx_alineaciones_core ON alineaciones (id_partido, id_jugadora, titular)`,
    `CREATE INDEX idx_alineaciones_eficiente ON alineaciones (id_jugadora, id_partido, titular)`,
  ]);

  // ---------- goles_y_asistencias: +FK(partido CASCADE, goleadora/asistente SET NULL) ----------
  const gBefore = await count('goles_y_asistencias');
  await rebuild('goles_y_asistencias', gBefore, [
    `CREATE TABLE goles_y_asistencias_new (
      id_gol INTEGER PRIMARY KEY,
      goleadora INTEGER,
      asistente INTEGER,
      id_partido INTEGER NOT NULL,
      goles_a_favor INTEGER NOT NULL,
      goles_en_contra INTEGER NOT NULL,
      minuto TEXT NOT NULL,
      parte_cuerpo TEXT,
      tipo TEXT,
      video_url TEXT,
      FOREIGN KEY (id_partido) REFERENCES partidos(id_partido) ON DELETE CASCADE,
      FOREIGN KEY (goleadora) REFERENCES jugadoras(id_jugadora) ON DELETE SET NULL,
      FOREIGN KEY (asistente) REFERENCES jugadoras(id_jugadora) ON DELETE SET NULL
    )`,
    `INSERT INTO goles_y_asistencias_new SELECT * FROM goles_y_asistencias`,
    `DROP TABLE goles_y_asistencias`,
    `ALTER TABLE goles_y_asistencias_new RENAME TO goles_y_asistencias`,
    `CREATE INDEX idx_goles_partido ON goles_y_asistencias (id_partido)`,
    `CREATE INDEX idx_goles_jugadora ON goles_y_asistencias (goleadora, asistente)`,
    `CREATE INDEX idx_goles_asistente ON goles_y_asistencias (asistente)`,
  ]);

  // ---------- estadisticas_partidos: +FK(partido CASCADE) — DDL ancha, se inyecta la FK ----------
  const oldSql = String((await c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='estadisticas_partidos'")).rows[0].sql);
  const lastParen = oldSql.lastIndexOf(')');
  const newSql = oldSql.slice(0, lastParen)
    + ', FOREIGN KEY (id_partido) REFERENCES partidos(id_partido) ON DELETE CASCADE'
    + oldSql.slice(lastParen);
  const newSqlRenamed = newSql.replace(/CREATE TABLE\s+estadisticas_partidos/i, 'CREATE TABLE estadisticas_partidos_new');
  const eBefore = await count('estadisticas_partidos');
  await rebuild('estadisticas_partidos', eBefore, [
    newSqlRenamed,
    `INSERT INTO estadisticas_partidos_new SELECT * FROM estadisticas_partidos`,
    `DROP TABLE estadisticas_partidos`,
    `ALTER TABLE estadisticas_partidos_new RENAME TO estadisticas_partidos`,
    `CREATE INDEX idx_est_partidos_pk ON estadisticas_partidos (id_partido)`,
  ]);

  console.log('\nFase B completada.');
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
