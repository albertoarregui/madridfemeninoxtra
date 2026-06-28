import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: (process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL)!, authToken: (process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)! });
const one = async (s: string) => (await c.execute(s)).rows[0];

const NOMBRE = 'Primera Iberdrola';
const FOTO = 'https://media.madridfemeninoxtra.com/competiciones/primera_iberdrola.webp';

async function main() {
    // 1. Crear la competición si no existe (idempotente)
    let row = (await c.execute({ sql: 'SELECT id_competicion FROM competiciones WHERE competicion = ?', args: [NOMBRE] })).rows[0];
    let newId: number;
    if (row) {
        newId = Number(row.id_competicion);
        console.log(`'${NOMBRE}' ya existe con id ${newId}.`);
    } else {
        const maxId = Number((await one('SELECT COALESCE(MAX(id_competicion),0) v FROM competiciones')).v);
        newId = maxId + 1;
        await c.execute({ sql: 'INSERT INTO competiciones (id_competicion, competicion, foto_url) VALUES (?, ?, ?)', args: [newId, NOMBRE, FOTO] });
        console.log(`Creada '${NOMBRE}' con id ${newId}.`);
    }

    // 2. Reasignar la liga (id_competicion = 1) de las temporadas 1 y 2 (2020/21 y 2021/22)
    const before = Number((await one('SELECT COUNT(*) v FROM partidos WHERE id_temporada IN (1,2) AND id_competicion = 1')).v);
    console.log(`Partidos de liga en temporadas 1 y 2 con id_competicion=1: ${before}`);
    const res = await c.execute({ sql: 'UPDATE partidos SET id_competicion = ? WHERE id_temporada IN (1,2) AND id_competicion = 1', args: [newId] });
    console.log(`Filas actualizadas: ${res.rowsAffected}`);

    // 3. Verificación
    const restantes = Number((await one('SELECT COUNT(*) v FROM partidos WHERE id_temporada IN (1,2) AND id_competicion = 1')).v);
    const nuevos = Number((await one(`SELECT COUNT(*) v FROM partidos WHERE id_temporada IN (1,2) AND id_competicion = ${newId}`)).v);
    const fkc = await c.execute('PRAGMA foreign_key_check(partidos)');
    const ok = restantes === 0 && nuevos === before && fkc.rows.length === 0;
    console.log(`Restantes con id_competicion=1 en T1/T2: ${restantes} (esperado 0)`);
    console.log(`Ahora en '${NOMBRE}' (id ${newId}): ${nuevos} (esperado ${before})`);
    console.log(`foreign_key_check: ${fkc.rows.length} violaciones`);
    console.log(ok ? 'Migración 12 OK ✅' : 'REVISAR ❌');
    if (!ok) throw new Error('Migración 12 falló');
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e); process.exit(1); });
