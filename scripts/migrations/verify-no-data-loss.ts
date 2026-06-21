import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

async function main() {
  // latest backup file
  const dir = 'scripts/migrations/backups';
  const file = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort().pop();
  if (!file) { console.error('No backup'); process.exit(1); }
  const backupSql = fs.readFileSync(`${dir}/${file}`, 'utf8');
  console.log('Backup:', file);

  // load backup into a fresh local db
  const localPath = '/tmp/verify_backup.db';
  try { fs.unlinkSync(localPath); } catch {}
  const bk = createClient({ url: `file:${localPath}` });
  await bk.executeMultiple(backupSql);

  // prod
  const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  const prod = createClient({ url: url!, authToken: authToken! });

  const one = async (cli: any, sql: string) => Number((await cli.execute(sql)).rows[0].v);

  console.log('\n=== ALINEACIONES (convocatorias) ===');
  const aPairsB = await one(bk, 'SELECT COUNT(*) v FROM (SELECT DISTINCT id_partido,id_jugadora FROM alineaciones)');
  const aPairsP = await one(prod, 'SELECT COUNT(*) v FROM (SELECT DISTINCT id_partido,id_jugadora FROM alineaciones)');
  console.log(`Pares (partido,jugadora) distintos:  backup=${aPairsB}  prod=${aPairsP}  ${aPairsB===aPairsP?'IGUAL ✅ (no se perdio ningun par)':'DISTINTO ❌'}`);

  const convB = await one(bk, 'SELECT COUNT(*) v FROM (SELECT DISTINCT id_partido,id_jugadora FROM alineaciones WHERE convocada=1)');
  const convP = await one(prod, 'SELECT COUNT(*) v FROM (SELECT DISTINCT id_partido,id_jugadora FROM alineaciones WHERE convocada=1)');
  console.log(`Convocatorias (convocada=1) distintas: backup=${convB}  prod=${convP}  ${convB===convP?'IGUAL ✅':'DISTINTO ❌'}`);

  const titB = await one(bk, 'SELECT COUNT(*) v FROM (SELECT DISTINCT id_partido,id_jugadora FROM alineaciones WHERE titular=1)');
  const titP = await one(prod, 'SELECT COUNT(*) v FROM (SELECT DISTINCT id_partido,id_jugadora FROM alineaciones WHERE titular=1)');
  console.log(`Titularidades distintas:               backup=${titB}  prod=${titP}  ${titB===titP?'IGUAL ✅':'DISTINTO ❌'}`);

  const minB = await one(bk, 'SELECT SUM(minutos_jugados) v FROM alineaciones');
  const minP = await one(prod, 'SELECT SUM(minutos_jugados) v FROM alineaciones');
  console.log(`Suma total de minutos jugados:         backup=${minB}  prod=${minP}  ${minB===minP?'IGUAL ✅':'DISTINTO ❌'}`);

  // any pair present in backup but missing in prod?
  const bkPairs = (await bk.execute('SELECT DISTINCT id_partido,id_jugadora FROM alineaciones')).rows.map((r:any)=>`${r.id_partido}-${r.id_jugadora}`);
  const prPairs = new Set((await prod.execute('SELECT DISTINCT id_partido,id_jugadora FROM alineaciones')).rows.map((r:any)=>`${r.id_partido}-${r.id_jugadora}`));
  const missing = bkPairs.filter(p => !prPairs.has(p));
  console.log(`Pares en backup que YA NO estan en prod: ${missing.length} ${missing.length===0?'✅':'❌ '+missing.slice(0,20).join(', ')}`);

  console.log('\n=== ESTADISTICAS_JUGADORAS ===');
  const ePairsB = await one(bk, 'SELECT COUNT(*) v FROM (SELECT DISTINCT id_partido,id_jugadora FROM estadisticas_jugadoras)');
  const ePairsP = await one(prod, 'SELECT COUNT(*) v FROM (SELECT DISTINCT id_partido,id_jugadora FROM estadisticas_jugadoras)');
  console.log(`Pares (partido,jugadora) distintos:  backup=${ePairsB}  prod=${ePairsP}  ${ePairsB===ePairsP?'IGUAL ✅ (no se perdio ningun par)':'DISTINTO ❌'}`);
  const ebkPairs = (await bk.execute('SELECT DISTINCT id_partido,id_jugadora FROM estadisticas_jugadoras')).rows.map((r:any)=>`${r.id_partido}-${r.id_jugadora}`);
  const eprPairs = new Set((await prod.execute('SELECT DISTINCT id_partido,id_jugadora FROM estadisticas_jugadoras')).rows.map((r:any)=>`${r.id_partido}-${r.id_jugadora}`));
  const eMissing = ebkPairs.filter(p => !eprPairs.has(p));
  console.log(`Pares en backup que YA NO estan en prod: ${eMissing.length} ${eMissing.length===0?'✅':'❌ '+eMissing.slice(0,20).join(', ')}`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
