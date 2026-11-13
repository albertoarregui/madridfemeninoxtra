#!/usr/bin/env node
// Importa todos los paquetes JSON de Sofascore de una carpeta (uno por partido).
// Uso: node scripts/sofascore/importar-carpeta.mjs <carpeta> [--dry] [--forzar-eventos]
// Al final recarga la caché de la web una sola vez y muestra un resumen.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('--'));
const extra = args.filter(a => a.startsWith('--'));
if (!dir || !fs.existsSync(dir)) { console.error('Uso: node scripts/sofascore/importar-carpeta.mjs <carpeta> [--dry] [--forzar-eventos]'); process.exit(1); }

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
const ok = []; const fallos = [];
for (const f of files) {
    const r = spawnSync(process.execPath, ['scripts/sofascore/importar-partido.mjs', path.join(dir, f), '--sin-cache', ...extra], { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    console.log(`\n=== ${f} ===\n${out.trim()}`);
    (r.status === 0 ? ok : fallos).push(f);
}
console.log(`\nResumen: ${ok.length} importados, ${fallos.length} con problemas${fallos.length ? `:\n- ${fallos.join('\n- ')}` : ''}`);
if (!extra.includes('--dry') && ok.length) {
    const r = spawnSync(process.execPath, ['scripts/revalidar-cache.mjs', 'partidos', 'alineaciones', 'goles_y_asistencias', 'goles_rival', 'goles_propia', 'tarjetas', 'tarjetas_rival',
        'penaltis_fallados', 'tanda_penaltis', 'estadisticas_partidos', 'estadisticas_jugadoras', 'jugadoras', 'estadisticas_periodos', 'tiros', 'posiciones_medias', 'dominio_partido', 'mapas_calor'], { encoding: 'utf8' });
    console.log(`Caché de la web: ${(r.stdout || r.stderr).trim()}`);
}
process.exit(fallos.length ? 2 : 0);
