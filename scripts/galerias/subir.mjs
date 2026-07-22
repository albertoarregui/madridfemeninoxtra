#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BUCKET = "realmadridfem-database";
const PREFIX = "galerias";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

const [carpetaLocal, rutaRemota] = process.argv.slice(2).filter((a) => !a.startsWith("-"));

if (!carpetaLocal || !rutaRemota) {
    console.error(`
Uso:  npm run galeria -- <carpeta-local> <ruta-en-galerias>

Ejemplo:
  npm run galeria -- ~/Desktop/fotos-atleti 2025-26/partidos/liga-f/274-atletico-de-madrid

Consejo: para partidos, empieza la última carpeta por el id_partido
         (p.ej. "274-atletico-de-madrid") y la galería se enlazará sola
         con la ficha de ese partido.
`);
    process.exit(1);
}

const local = path.resolve(carpetaLocal.replace(/^~/, process.env.HOME || "~"));
if (!fs.existsSync(local)) {
    console.error(`❌ No existe la carpeta local: ${local}`);
    process.exit(1);
}

const fotos = fs.readdirSync(local).filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f));
if (!fotos.length) {
    console.error(`❌ No hay imágenes en ${local}`);
    process.exit(1);
}

const destino = `r2:${BUCKET}/${PREFIX}/${rutaRemota.replace(/^\/+|\/+$/g, "")}`;

console.log(`\n📤 Subiendo ${fotos.length} fotos`);
console.log(`   desde: ${local}`);
console.log(`   hacia: ${destino}\n`);

execFileSync(
    "rclone",
    ["copy", local, destino, "--progress", "--transfers=16", "--s3-no-check-bucket"],
    { stdio: "inherit" },
);

console.log(`\n🔍 Indexando (detectando jugadoras por los metadatos)...\n`);

execFileSync("node", [path.join(ROOT, "scripts/galerias/indexar.mjs"), rutaRemota], {
    stdio: "inherit",
});

console.log(`
✅ Listo.

Último paso: crea la entrada en Contentful con la ruta de carpetas:
   ${rutaRemota}

Las fotos ya aparecen en la ficha de cada jugadora detectada,
en la ficha del partido y en la home.
`);
