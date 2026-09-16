#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';

const BUCKET = 'realmadridfem-database';
const REMOTE = 'r2';
const ALLOWED_ROOTS = [
  'galerias/',
  'jugadoras/2026-27',
  'xi-inicial/2026-27',
  'goles/2026-27',
];
const IMAGE_RE = /\.(jpe?g|png|webp|tiff?)$/i;

function valueOf(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1];
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const inputArg = valueOf('--input');
const targetArg = valueOf('--target');
const execute = process.argv.includes('--execute');
const allowOverwrite = process.argv.includes('--allow-overwrite');

if (!inputArg || !targetArg) {
  console.log(`
Uso:
  node prepare-and-upload.mjs --input <carpeta> --target <ruta-r2> [--execute] [--allow-overwrite]

Ejemplos:
  node prepare-and-upload.mjs --input ./fotos --target jugadoras/2026-27
  node prepare-and-upload.mjs --input ./fotos --target galerias/2026-27/partidos/liga-f/314-rival --execute
`);
  process.exit(0);
}

const input = resolve(inputArg);
const target = targetArg.replace(/^\/+|\/+$/g, '');

if (!existsSync(input)) fail(`No existe la carpeta: ${input}`);
if (target.includes('..')) fail('La ruta R2 no puede contener "..".');
if (!ALLOWED_ROOTS.some((root) => target === root.replace(/\/$/, '') || target.startsWith(root))) {
  fail(`Destino no permitido: ${target}`);
}

const files = readdirSync(input).filter((name) => IMAGE_RE.test(name));
if (!files.length) fail('No hay imágenes compatibles en la carpeta de entrada.');

const workDir = join(tmpdir(), `alberto-os-r2-${Date.now()}`);
mkdirSync(workDir, { recursive: true });

console.log(`\nPreparando ${files.length} imágenes para r2:${BUCKET}/${target}`);
console.log(execute ? 'Modo: EJECUCIÓN' : 'Modo: SIMULACIÓN (no se subirá nada)');
console.log(allowOverwrite ? 'Sobrescritura: permitida' : 'Sobrescritura: bloqueada');

try {
  for (const file of files) {
    const source = join(input, file);
    const output = join(workDir, `${basename(file, extname(file))}.webp`);
    await sharp(source)
      .keepMetadata()
      .rotate()
      .webp({ quality: 86, effort: 5 })
      .toFile(output);
  }

  const prepared = readdirSync(workDir).filter((name) => name.endsWith('.webp'));
  console.log(`Preparadas: ${prepared.length}`);
  prepared.slice(0, 10).forEach((name) => console.log(`  · ${name}`));
  if (prepared.length > 10) console.log(`  · ... y ${prepared.length - 10} más`);

  if (!execute) {
    console.log('\n✅ Simulación completada. Repite con --execute para subir.');
  } else {
    const args = [
      'copy',
      workDir,
      `${REMOTE}:${BUCKET}/${target}`,
      '--progress',
      '--transfers=8',
      '--s3-no-check-bucket',
    ];
    if (!allowOverwrite) args.push('--immutable');

    execFileSync('rclone', args, { stdio: 'inherit' });

    if (target.startsWith('galerias/')) {
      const galleryRoute = target.slice('galerias/'.length);
      const projectRoot = resolve(new URL('../../../', import.meta.url).pathname);
      execFileSync('node', [join(projectRoot, 'scripts/galerias/indexar.mjs'), galleryRoute], {
        cwd: projectRoot,
        stdio: 'inherit',
      });
    }

    console.log(`\n✅ Subida completada en r2:${BUCKET}/${target}`);
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
