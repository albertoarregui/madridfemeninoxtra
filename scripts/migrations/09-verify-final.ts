import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!, authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)! });

async function main() {
  console.log('=== INTEGRIDAD ===');
  const fkc = await c.execute('PRAGMA foreign_key_check');
  console.log('foreign_key_check global:', fkc.rows.length, 'violaciones', fkc.rows.length === 0 ? '✅' : '❌');
  const integ = await c.execute('PRAGMA integrity_check');
  console.log('integrity_check:', JSON.stringify(integ.rows[0]), (integ.rows[0] as any).integrity_check === 'ok' ? '✅' : '❌');

  console.log('\n=== ESQUEMA ===');
  const tabs = (await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).rows.map((r: any) => r.name);
  console.log('tablas:', tabs.length, '| equipacion_partido eliminada:', !tabs.includes('equipacion_partido') ? '✅' : '❌', '| categorias creada:', tabs.includes('categorias') ? '✅' : '❌');
  const dcols = (await c.execute("PRAGMA table_info(dorsales)")).rows.map((r: any) => r.name);
  console.log('dorsales tiene id_categoria:', dcols.includes('id_categoria') ? '✅' : '❌');
  const pcols = (await c.execute("PRAGMA table_info(partidos)")).rows.map((r: any) => r.name);
  console.log('partidos tiene id_equipacion:', pcols.includes('id_equipacion') ? '✅' : '❌');

  console.log('\n=== SMOKE TEST: consultas reales del sitio ===');
  // 1) Directorio de jugadoras (fetchPlayersDirectly)
  const players = await c.execute(`
    SELECT j.id_jugadora, j.nombre, t.temporada, d.dorsal
    FROM jugadoras j
    LEFT JOIN dorsales d ON j.id_jugadora = d.id_jugadora
    LEFT JOIN temporadas t ON d.id_temporada = t.id_temporada
    ORDER BY j.nombre ASC LIMIT 5`);
  console.log('Directorio jugadoras: OK, filas muestra =', players.rows.length, '✅');

  // 2) Goles y asistencias (consulta editada en goles_y_asistencias.ts)
  const goals = await c.execute(`
    SELECT g.id_gol, COALESCE(jg.nombre, g.goleadora) AS goleadora,
           COALESCE(ja.nombre, g.asistente) AS asistente,
           COALESCE(d_g1.foto_url, d_g2.foto_url) AS foto_goleadora
    FROM goles_y_asistencias g
    JOIN partidos p ON g.id_partido = p.id_partido
    JOIN competiciones c ON p.id_competicion = c.id_competicion
    JOIN temporadas t ON p.id_temporada = t.id_temporada
    LEFT JOIN jugadoras jg ON g.goleadora = jg.id_jugadora
    LEFT JOIN dorsales d_g1 ON (g.goleadora = d_g1.id_jugadora AND p.id_temporada = d_g1.id_temporada)
    LEFT JOIN dorsales d_g2 ON (g.goleadora = d_g2.id_jugadora AND d_g2.id_temporada = (SELECT MAX(id_temporada) FROM dorsales WHERE id_jugadora = g.goleadora))
    LEFT JOIN jugadoras ja ON g.asistente = ja.id_jugadora
    LEFT JOIN dorsales d_a1 ON (g.asistente = d_a1.id_jugadora AND p.id_temporada = d_a1.id_temporada)
    LEFT JOIN dorsales d_a2 ON (g.asistente = d_a2.id_jugadora AND d_a2.id_temporada = (SELECT MAX(id_temporada) FROM dorsales WHERE id_jugadora = g.asistente))
    ORDER BY g.id_partido ASC, g.minuto ASC LIMIT 5`);
  console.log('Goles/asistencias (query editada): OK, filas muestra =', goals.rows.length, '✅');
  console.log('  ejemplo:', JSON.stringify(goals.rows[0]));

  // 3) Estadisticas de una jugadora (alineaciones + partidos)
  const stats = await c.execute(`SELECT COUNT(*) n FROM alineaciones al JOIN partidos p ON al.id_partido=p.id_partido WHERE al.id_jugadora=1`);
  console.log('Stats jugadora 1 (alineaciones JOIN partidos): OK, partidos =', (stats.rows[0] as any).n, '✅');

  console.log('\n=== RESUMEN INDICES ===');
  const idx = (await c.execute("SELECT COUNT(*) n FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")).rows[0];
  console.log('indices definidos por usuario:', (idx as any).n);
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
