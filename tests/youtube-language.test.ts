import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("la sección de vídeos conserva el diseño original sin una lectura RSS", () => {
  const section = read("src/components/YoutubeSection.astro");
  assert.match(section, /youtube\.com\/@MadridFemXtra\/videos/);
  assert.match(section, /parseInitialData/);
  assert.match(section, /lockupViewModel/);
  assert.match(section, /class="main-video"/);
  assert.match(section, /class="video-card-small[^"]*"/);
  assert.match(section, /id="scrollLeft"/);
  assert.match(section, /id="scrollRight"/);
  assert.doesNotMatch(section, /feeds\/videos\.xml/);
  assert.doesNotMatch(section, /Cargando vídeos/);
});

test("el selector inglés vuelve al español sin que el traductor reescriba el enlace", () => {
  const header = read("src/components/Header.astro");
  assert.match(header, /locale === "en"/);
  assert.match(header, /new URL\(currentPath, Astro\.url\.origin\)\.toString\(\)/);
  assert.match(header, /href=\{languageHref\}/);
  assert.match(header, /data-astro-reload/);
});
