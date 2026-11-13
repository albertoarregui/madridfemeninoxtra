#!/usr/bin/env node
// Asigna una lista de vídeos de YouTube a sus partidos y los guarda en partidos.video_resumen_url.
//
// Uso:
//   node scripts/videos/asignar-enlaces.mjs enlaces.txt              # muestra la asignación, no escribe
//   node scripts/videos/asignar-enlaces.mjs enlaces.txt --guardar    # guarda los asignados con seguridad
//   node scripts/videos/asignar-enlaces.mjs enlaces.txt --guardar --sobrescribir   # también si el partido ya tenía vídeo
//
// enlaces.txt: un enlace por línea. Opcionalmente con la fecha del partido delante:
//   https://www.youtube.com/watch?v=XXXXXXXXXXX
//   2026-10-17 https://youtu.be/XXXXXXXXXXX
import fs from 'node:fs';
import { createClient } from '@libsql/client/web';
import { puntuar } from './reglas.mjs';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const GUARDAR = args.includes('--guardar');
const SOBRE = args.includes('--sobrescribir');
if (!file) { console.error('Uso: node scripts/videos/asignar-enlaces.mjs enlaces.txt [--guardar] [--sobrescribir]'); process.exit(1); }

const env = { ...process.env };
for (const f of ['.env.vercel', '.env.local', '.env']) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) { const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/); if (m && env[m[1]] === undefined) env[m[1]] = m[2]; }
}
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
const partidos = (await db.execute(`SELECT p.id_partido, p.fecha, p.goles_rm, p.goles_rival, p.video_resumen_url,
        CASE WHEN p.id_club_local = 1 THEN v.nombre ELSE l.nombre END AS rival
    FROM partidos p JOIN clubes l ON l.id_club = p.id_club_local JOIN clubes v ON v.id_club = p.id_club_visitante
    WHERE p.goles_rm IS NOT NULL`)).rows;

const unescape = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
async function info(id) {
    const h = await (await fetch(`https://www.youtube.com/watch?v=${id}`, { headers: { 'Accept-Language': 'es-ES' } })).text();
    return {
        titulo: unescape((h.match(/<meta name="title" content="([^"]*)"/) || [])[1] || ''),
        fecha: ((h.match(/"publishDate":"([^"]+)"/) || [])[1] || '').slice(0, 10),
        canal: unescape((h.match(/"ownerChannelName":"([^"]*)"/) || [])[1] || ''),
    };
}

const lineas = fs.readFileSync(file, 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
const filas = []; const stmts = [];
for (const linea of lineas) {
    const id = (linea.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/) || [])[1];
    const fechaDada = (linea.match(/\b(\d{4}-\d{2}-\d{2})\b/) || [])[1];
    if (!id) { filas.push({ estado: 'ENLACE NO VÁLIDO', linea }); continue; }
    const v = await info(id);
    // Partidos candidatos: la fecha indicada, o los 10 días anteriores a la publicación del vídeo
    let cands = fechaDada ? partidos.filter(p => p.fecha === fechaDada)
        : partidos.filter(p => v.fecha && p.fecha <= v.fecha && Date.parse(v.fecha) - Date.parse(p.fecha) <= 10 * 864e5);
    // El vídeo lo das tú: no exigimos que el título diga "femenino"
    const punt = cands.map(p => ({ p, s: puntuar(v.titulo, p.rival, `${v.canal} women`, [Number(p.goles_rm), Number(p.goles_rival)]) })).filter(x => x.s != null).sort((a, b) => b.s - a.s);
    let elegido = null; let estado;
    if (fechaDada && cands.length === 1) { elegido = cands[0]; estado = 'OK (por fecha)'; }
    else if (punt.length === 1 || (punt.length > 1 && punt[0].s > punt[1].s)) { elegido = punt[0].p; estado = 'OK'; }
    else if (punt.length > 1) estado = `AMBIGUO: ${punt.map(x => `${x.p.fecha} ${x.p.rival}`).join(' / ')} → pon la fecha delante`;
    else estado = 'SIN PARTIDO: pon la fecha delante del enlace';
    if (elegido && elegido.video_resumen_url && !SOBRE) estado = `YA TIENE VÍDEO (${elegido.video_resumen_url}); usa --sobrescribir`;
    else if (elegido) stmts.push({ sql: 'UPDATE partidos SET video_resumen_url = ?, video_resumen_canal = ? WHERE id_partido = ?', args: [`https://www.youtube.com/watch?v=${id}`, v.canal || 'manual', elegido.id_partido] });
    filas.push({ estado, partido: elegido ? `${elegido.fecha} vs ${elegido.rival} (${elegido.goles_rm}-${elegido.goles_rival})` : '', video: `${v.fecha} · ${v.canal} · ${v.titulo}`, id });
}
for (const f of filas) console.log(`${f.estado.padEnd(16)} | ${(f.partido || '').padEnd(42)} | ${f.video || f.linea}`);
console.log(`\n${stmts.length} de ${lineas.length} enlaces asignados.`);
if (!GUARDAR) { console.log('Simulación: añade --guardar para escribirlos.'); process.exit(0); }
if (stmts.length) await db.batch(stmts, 'write');
console.log('Guardados.');
if (env.CACHE_REVALIDATION_SECRET) {
    const r = await fetch(`${env.SITE_URL || 'https://www.madridfemeninoxtra.com'}/api/cache/revalidate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cache-revalidation-secret': env.CACHE_REVALIDATION_SECRET }, body: JSON.stringify({ tables: ['partidos'] }) });
    console.log(`Caché de la web: ${r.status}`);
}
