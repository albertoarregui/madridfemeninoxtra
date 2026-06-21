import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!, authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)! });
const one = async (s: string) => Number((await c.execute(s)).rows[0].v);

async function main() {
  // Pre-check: huerfanos en columnas a las que añadimos FK
  const orphCap = await one("SELECT COUNT(*) v FROM partidos p LEFT JOIN jugadoras j ON p.capitana=j.id_jugadora WHERE p.capitana IS NOT NULL AND j.id_jugadora IS NULL");
  const orphEnt = await one("SELECT COUNT(*) v FROM partidos p LEFT JOIN entrenadores e ON p.id_entrenador=e.id_entrenador WHERE p.id_entrenador IS NOT NULL AND e.id_entrenador IS NULL");
  const orphMvp = await one("SELECT COUNT(*) v FROM partidos p LEFT JOIN jugadoras j ON p.mvp=j.id_jugadora WHERE p.mvp IS NOT NULL AND j.id_jugadora IS NULL");
  console.log(`Huerfanos -> capitana:${orphCap} entrenador:${orphEnt} mvp:${orphMvp}`);
  if (orphCap || orphEnt || orphMvp) throw new Error('Hay huerfanos; abortando antes de añadir FKs');

  const before = await one('SELECT COUNT(*) v FROM partidos');
  const epBefore = await one('SELECT COUNT(*) v FROM equipacion_partido');

  await c.executeMultiple(`
    PRAGMA foreign_keys=OFF;
    BEGIN;
    CREATE TABLE partidos_new (
      id_partido INTEGER PRIMARY KEY,
      fecha DATE,
      hora TIME,
      id_temporada INTEGER,
      id_competicion INTEGER,
      jornada VARCHAR(50),
      id_club_local INTEGER,
      id_club_visitante INTEGER,
      id_estadio INTEGER,
      goles_rm INTEGER,
      goles_rival INTEGER,
      id_arbitra INTEGER,
      id_entrenador INTEGER,
      penaltis BOOLEAN,
      asistencia INTEGER,
      mvp INTEGER,
      capitana INTEGER,
      mvp_foto_url TEXT,
      once_inicial_url TEXT,
      formacion TEXT,
      tv TEXT,
      tiempo_partido TEXT,
      id_equipacion INTEGER,
      FOREIGN KEY (id_temporada) REFERENCES temporadas(id_temporada),
      FOREIGN KEY (id_competicion) REFERENCES competiciones(id_competicion),
      FOREIGN KEY (id_club_local) REFERENCES clubes(id_club),
      FOREIGN KEY (id_club_visitante) REFERENCES clubes(id_club),
      FOREIGN KEY (id_estadio) REFERENCES estadios(id_estadio),
      FOREIGN KEY (id_arbitra) REFERENCES arbitras(id_arbitra),
      FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id_entrenador),
      FOREIGN KEY (mvp) REFERENCES jugadoras(id_jugadora),
      FOREIGN KEY (capitana) REFERENCES jugadoras(id_jugadora),
      FOREIGN KEY (id_equipacion) REFERENCES equipaciones(id_equipacion)
    );
    INSERT INTO partidos_new (id_partido,fecha,hora,id_temporada,id_competicion,jornada,id_club_local,id_club_visitante,id_estadio,goles_rm,goles_rival,id_arbitra,id_entrenador,penaltis,asistencia,mvp,capitana,mvp_foto_url,once_inicial_url,formacion,tv,tiempo_partido,id_equipacion)
      SELECT id_partido,fecha,hora,id_temporada,id_competicion,jornada,id_club_local,id_club_visitante,id_estadio,goles_rm,goles_rival,id_arbitra,id_entrenador,penaltis,
        CAST(asistencia AS INTEGER), mvp,capitana,mvp_foto_url,once_inicial_url,formacion,tv,tiempo_partido,
        (SELECT ep.id_equipacion FROM equipacion_partido ep WHERE ep.id_partido = partidos.id_partido)
      FROM partidos;
    DROP TABLE equipacion_partido;
    DROP TABLE partidos;
    ALTER TABLE partidos_new RENAME TO partidos;
    CREATE INDEX idx_partidos_filtros ON partidos (id_temporada, id_competicion);
    CREATE INDEX idx_partidos_fecha ON partidos (fecha);
    CREATE INDEX idx_partidos_calendario ON partidos (fecha, id_temporada, id_competicion);
    CREATE INDEX idx_partidos_clubes ON partidos (id_club_local, id_club_visitante);
    COMMIT;
    PRAGMA foreign_keys=ON;
  `);

  const after = await one('SELECT COUNT(*) v FROM partidos');
  const fkc = await c.execute('PRAGMA foreign_key_check');
  const eqMoved = await one('SELECT COUNT(*) v FROM partidos WHERE id_equipacion IS NOT NULL');
  const asistTyp = await c.execute("SELECT typeof(asistencia) t, COUNT(*) n FROM partidos WHERE asistencia IS NOT NULL GROUP BY 1");
  const epGone = (await c.execute("SELECT COUNT(*) v FROM sqlite_master WHERE type='table' AND name='equipacion_partido'")).rows[0].v;
  // joins de uso real
  const childJoins = await one('SELECT COUNT(*) v FROM alineaciones a JOIN partidos p ON a.id_partido=p.id_partido');

  console.log(`partidos: ${before} -> ${after} ${before===after?'✅':'❌'}`);
  console.log(`foreign_key_check global: ${fkc.rows.length} violaciones ${fkc.rows.length===0?'✅':'❌'}`);
  console.log(`id_equipacion poblados: ${eqMoved} (equipacion_partido tenia ${epBefore})`);
  console.log(`asistencia typeof: ${JSON.stringify(asistTyp.rows)}`);
  console.log(`tabla equipacion_partido sigue existiendo?: ${epGone} (esperado 0)`);
  console.log(`alineaciones JOIN partidos: ${childJoins}`);
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
