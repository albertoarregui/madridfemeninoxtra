import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!, authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)! });
const count = async (t: string) => Number((await c.execute(`SELECT COUNT(*) n FROM ${t}`)).rows[0].n);

async function main() {
  const before = {
    temporadas: await count('temporadas'),
    competiciones: await count('competiciones'),
    clubes: await count('clubes'),
    jugadoras: await count('jugadoras'),
  };

  await c.executeMultiple(`
    PRAGMA foreign_keys=OFF;
    BEGIN;

    CREATE TABLE temporadas_new (
      id_temporada INTEGER PRIMARY KEY,
      temporada VARCHAR(50) NOT NULL UNIQUE
    );
    INSERT INTO temporadas_new SELECT id_temporada, temporada FROM temporadas;
    DROP TABLE temporadas;
    ALTER TABLE temporadas_new RENAME TO temporadas;

    CREATE TABLE competiciones_new (
      id_competicion INTEGER PRIMARY KEY,
      competicion VARCHAR(50) NOT NULL UNIQUE,
      foto_url TEXT
    );
    INSERT INTO competiciones_new SELECT id_competicion, competicion, foto_url FROM competiciones;
    DROP TABLE competiciones;
    ALTER TABLE competiciones_new RENAME TO competiciones;

    CREATE TABLE clubes_new (
      id_club INTEGER PRIMARY KEY,
      nombre VARCHAR(200) NOT NULL,
      ciudad VARCHAR(50),
      pais VARCHAR(50),
      slug TEXT UNIQUE,
      estadio INTEGER,
      foto_url TEXT,
      iso TEXT
    );
    INSERT INTO clubes_new (id_club,nombre,ciudad,pais,slug,estadio,foto_url,iso)
      SELECT id_club,nombre,ciudad,pais,slug,estadio,foto_url,iso FROM clubes;
    DROP TABLE clubes;
    ALTER TABLE clubes_new RENAME TO clubes;
    CREATE INDEX idx_clubes_iso ON clubes (iso);

    CREATE TABLE jugadoras_new (
      id_jugadora INTEGER PRIMARY KEY,
      nombre VARCHAR(200) NOT NULL,
      fecha_nacimiento DATE,
      pais_origen VARCHAR(50),
      altura DECIMAL(4,2),
      peso DECIMAL(5,2),
      posicion VARCHAR(50),
      lugar_nacimiento TEXT,
      tipo TEXT,
      iso TEXT,
      lat REAL,
      lng REAL
    );
    INSERT INTO jugadoras_new (id_jugadora,nombre,fecha_nacimiento,pais_origen,altura,peso,posicion,lugar_nacimiento,tipo,iso,lat,lng)
      SELECT id_jugadora,nombre,fecha_nacimiento,pais_origen,altura,peso,posicion,lugar_nacimiento,tipo,iso,lat,lng FROM jugadoras;
    DROP TABLE jugadoras;
    ALTER TABLE jugadoras_new RENAME TO jugadoras;

    COMMIT;
    PRAGMA foreign_keys=ON;
  `);

  const after = {
    temporadas: await count('temporadas'),
    competiciones: await count('competiciones'),
    clubes: await count('clubes'),
    jugadoras: await count('jugadoras'),
  };
  const fkc = await c.execute('PRAGMA foreign_key_check');

  // joins reales para confirmar integridad de uso
  const j1 = await count('partidos p JOIN temporadas t ON p.id_temporada=t.id_temporada');
  const j2 = await count('partidos p JOIN competiciones co ON p.id_competicion=co.id_competicion');
  const j3 = await count('dorsales d JOIN jugadoras j ON d.id_jugadora=j.id_jugadora');
  const j4 = await count('partidos p JOIN clubes c ON p.id_club_local=c.id_club');

  console.log('Filas (antes -> despues):');
  for (const k of Object.keys(before) as (keyof typeof before)[]) {
    console.log(`  ${k}: ${before[k]} -> ${after[k]} ${before[k]===after[k]?'✅':'❌'}`);
  }
  console.log('foreign_key_check global:', fkc.rows.length, 'violaciones', fkc.rows.length===0?'✅':'❌');
  console.log(`joins: partidos-temporadas=${j1}, partidos-competiciones=${j2}, dorsales-jugadoras=${j3}, partidos-clubes=${j4}`);
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
