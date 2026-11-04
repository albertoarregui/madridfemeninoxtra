import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import test from "node:test";
import { localeFromPath, localizePath, stripLocale } from "../src/i18n/index.ts";
import { translateInterfaceHtml } from "../src/i18n/translate-html.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("las rutas inglesas conservan el mismo recurso", () => {
  assert.equal(localeFromPath("/en/jugadoras"), "en");
  assert.equal(localeFromPath("/jugadoras"), "es");
  assert.equal(stripLocale("/en/jugadoras"), "/jugadoras");
  assert.equal(localizePath("/jugadoras", "en"), "/en/jugadoras");
  assert.equal(localizePath("/en/jugadoras", "es"), "/jugadoras");
});

test("la interfaz inglesa traduce etiquetas y mantiene fuera los recursos técnicos", () => {
  const html = translateInterfaceHtml('<h1>JUGADORAS</h1><a href="/partidos">Partidos</a><a href="/assets/a.webp">x</a>');
  assert.match(html, /<h1>PLAYERS<\/h1>/);
  assert.match(html, /href="\/en\/partidos">Matches/);
  assert.match(html, /href="\/assets\/a\.webp"/);
});

test("layout publica alternates de idioma y modo claro persistente", () => {
  const layout = read("src/layouts/Layout.astro");
  const css = read("src/styles/global.css");
  assert.match(layout, /hreflang="es"/);
  assert.match(layout, /hreflang="en"/);
  assert.match(layout, /mfx-theme/);
  assert.match(layout, /<EnglishInterface/);
  assert.match(css, /html\[data-theme="light"\]/);
  assert.match(css, /--light-card: #fffdf8/);
  assert.match(css, /\.stat-card,/);
  assert.match(css, /\.ranking-table-row,/);
  assert.match(css, /\.mfx-rating-match-card,/);
  assert.match(css, /\.stadium-card,/);
  assert.match(css, /\.stats-dashboard \[class\*="bg-\[rgba/);
  assert.match(css, /\.podium-stat-value :is\(h3, a\)/);
});

test("el rewrite inglés corrige el estado heredado sin convertir la página 404 en 200", () => {
  const middleware = read("src/middleware.ts");
  assert.match(middleware, /isNotFoundPage = \/<h1/);
  assert.match(middleware, /successfulRewrite = !isNotFoundPage/);
  assert.match(middleware, /error-title/);
  assert.match(middleware, /headers\.delete\("x-robots-tag"\)/);
  assert.match(middleware, /headers\.delete\("x-astro-rewrite"\)/);
  assert.equal(existsSync(new URL("../src/pages/en/[...path].astro", import.meta.url)), true);
});

test("sitemap anuncia las dos versiones sin repetir lecturas de partidos", () => {
  const sitemap = read("src/pages/sitemap.xml.ts");
  assert.match(sitemap, /xmlns:xhtml/);
  assert.match(sitemap, /englishPath/);
  assert.equal((sitemap.match(/fetchGamesDirectly\(\)/g) || []).length, 1);
});
