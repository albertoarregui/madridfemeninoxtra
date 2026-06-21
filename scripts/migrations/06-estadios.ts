import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!, authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)! });

async function main() {
  const before = Number((await c.execute('SELECT COUNT(*) n FROM estadios')).rows[0].n);

  await c.executeMultiple(`
    PRAGMA foreign_keys=OFF;
    BEGIN;
    CREATE TABLE estadios_new (
      id_estadio INTEGER PRIMARY KEY,
      nombre VARCHAR(100),
      ciudad VARCHAR(50),
      pais VARCHAR(50),
      capacidad INTEGER,
      foto_url TEXT,
      lat REAL,
      lng REAL
    );
    INSERT INTO estadios_new (id_estadio,nombre,ciudad,pais,capacidad,foto_url,lat,lng)
      SELECT id_estadio,nombre,ciudad,pais, CAST(capacidad AS INTEGER), foto_url,lat,lng FROM estadios;
    DROP TABLE estadios;
    ALTER TABLE estadios_new RENAME TO estadios;
    CREATE INDEX idx_estadios_ubicacion ON estadios (pais, ciudad);
    CREATE INDEX idx_estadios_ciudad ON estadios (ciudad);
    COMMIT;
    PRAGMA foreign_keys=ON;
  `);

  const after = Number((await c.execute('SELECT COUNT(*) n FROM estadios')).rows[0].n);
  const fkc = await c.execute('PRAGMA foreign_key_check');
  const typ = await c.execute("SELECT typeof(capacidad) t, COUNT(*) n FROM estadios WHERE capacidad IS NOT NULL GROUP BY 1");
  // partidos sigue viendo sus estadios?
  const join = Number((await c.execute('SELECT COUNT(*) n FROM partidos p JOIN estadios e ON p.id_estadio=e.id_estadio')).rows[0].n);
  console.log(`estadios: ${before} -> ${after} filas | foreign_key_check global: ${fkc.rows.length} violaciones`);
  console.log('capacidad typeof:', JSON.stringify(typ.rows));
  console.log('partidos JOIN estadios (integridad uso real):', join);
  console.log(after === before && fkc.rows.length === 0 ? '\nFK-off FUNCIONA ✅ — estadios OK' : '\nREVISAR ❌');
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
