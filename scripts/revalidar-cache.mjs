#!/usr/bin/env node
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
const tables = process.argv.slice(2).length ? process.argv.slice(2) : PARTIDO;
const site = env.SITE_URL || 'https://www.madridfemeninoxtra.com';

const res = await fetch(`${site}/api/cache/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-cache-revalidation-secret': secret },
    body: JSON.stringify({ tables }),
});
const body = await res.text();
console.log(res.status, body);
process.exit(res.ok ? 0 : 1);
