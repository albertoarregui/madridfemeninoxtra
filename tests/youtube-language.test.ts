import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("la sección de vídeos usa la lista automática sin una lectura RSS", () => {
  const section = read("src/components/YoutubeSection.astro");
  assert.match(section, /UUHcGAOmFVh9sH4FsVxE2rhQ/);
  assert.match(section, /youtube-nocookie\.com\/embed\/videoseries/);
  assert.match(section, /loading="lazy"/);
  assert.doesNotMatch(section, /feeds\/videos\.xml|await fetch/);
  assert.doesNotMatch(section, /Cargando vídeos/);
});

test("el selector inglés vuelve al español sin que el traductor reescriba el enlace", () => {
  const header = read("src/components/Header.astro");
  assert.match(header, /locale === "en"/);
  assert.match(header, /new URL\(currentPath, Astro\.url\.origin\)\.toString\(\)/);
  assert.match(header, /href=\{languageHref\}/);
});
