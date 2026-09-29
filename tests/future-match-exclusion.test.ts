import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const guardedFiles = [
  "src/utils/rankings.ts",
  "src/utils/players.ts",
  "src/utils/entrenadores.ts",
  "src/utils/rivales.ts",
  "src/utils/estadios.ts",
  "src/utils/arbitras.ts",
  "src/utils/rival-records.ts",
  "src/pages/api/buscador-avanzado.ts",
  "src/pages/api/team-stats.ts",
  "src/pages/api/finishing-players.ts",
  "src/pages/api/xg-timeline.ts",
  "src/pages/api/assist-network.ts",
  "src/pages/api/player-radar/[slug].ts",
  "src/pages/api/players/[slug]/stats.js",
  "src/pages/api/goles_y_asistencias.js",
  "src/pages/api/rivals/[slug]/rival-ficha.js",
];

test("all statistical entrypoints exclude future matches", () => {
  for (const file of guardedFiles) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /date\([^\n]*fecha[^\n]*\)\s*<=\s*date\('now'\)/, `${file} lacks a future-date guard`);
  }
});

test("shared goal feed and match completion guard exclude future rows", () => {
  const source = readFileSync("src/utils/partidos.ts", "utf8");
  assert.match(source, /date\(p\.fecha\) <= date\('now'\)/);
  assert.match(source, /String\(game\.fecha\)\.slice\(0, 10\) <= today/);
});
