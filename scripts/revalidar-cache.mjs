#!/usr/bin/env node
// Uso:
//   npm run cache:revalidar                      → tablas de partido (fichas abiertas, rankings…)
//   npm run cache:revalidar -- partidos jugadoras → solo esas tablas
//   npm run cache:revalidar -- --partido 312      → además la ficha del partido 312, aunque sea antiguo
import fs from 'node:fs';

const env = { ...process.env };
for (const file of ['.env.vercel', '.env']) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2];
    }
}
const secret = env.CACHE_REVALIDATION_SECRET;
if (!secret) { console.error('Falta CACHE_REVALIDATION_SECRET'); process.exit(1); }

const PARTIDO = ['partidos', 'alineaciones', 'goles_y_asistencias', 'goles_rival', 'goles_propia', 'estadisticas_jugadoras',
    'estadisticas_partidos', 'tarjetas', 'tarjetas_rival', 'cambios', 'penaltis_fallados', 'tanda_penaltis', 'mvp'];

// Las fichas de partidos antiguos solo se regeneran con su etiqueta match-ID.
const args = process.argv.slice(2);
const partidos = [];
const tablasPedidas = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--partido') { partidos.push(args[++i]); continue; }
    if (args[i].startsWith('--partido=')) { partidos.push(args[i].slice('--partido='.length)); continue; }
    tablasPedidas.push(args[i]);
}
if (partidos.some((id) => !/^\d+$/.test(String(id)))) { console.error('--partido necesita el id numérico del partido'); process.exit(1); }

const tables = tablasPedidas.length ? tablasPedidas : PARTIDO;
const tags = partidos.map((id) => `match-${id}`);
const site = env.SITE_URL || 'https://www.madridfemeninoxtra.com';

const res = await fetch(`${site}/api/cache/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-cache-revalidation-secret': secret },
    body: JSON.stringify({ tables, tags }),
});
const body = await res.text();
console.log(res.status, body);
process.exit(res.ok ? 0 : 1);
