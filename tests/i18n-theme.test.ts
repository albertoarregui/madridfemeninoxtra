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

test("la interfaz inglesa traduce textos editoriales, rankings y fechas", () => {
  const html = translateInterfaceHtml(`
    <p>Historial de partidos disputados por el Real Madrid Femenino a lo largo de su historia, por temporada y competición</p>
    <span>Mayor racha con gol o asistencia</span>
    <time>4 de noviembre de 2026</time>
    <a href="/estadisticas/avanzadas">Metodología</a>
  `);
  assert.match(html, /Complete Real Madrid Women match history by season and competition/);
  assert.match(html, /Longest goal contribution streak/);
  assert.match(html, /4 November 2026/);
  assert.match(html, /href="\/en\/estadisticas\/avanzadas">Methodology/);
});

test("layout publica alternates de idioma y mantiene un único tema oscuro", () => {
  const layout = read("src/layouts/Layout.astro");
  const css = read("src/styles/global.css");
  assert.match(layout, /hreflang="es"/);
  assert.match(layout, /hreflang="en"/);
  assert.match(layout, /<EnglishInterface/);
  assert.doesNotMatch(layout, /mfx-theme|data-theme=/);
  assert.doesNotMatch(css, /html\[data-theme="light"\]/);
  assert.doesNotMatch(read("src/components/Header.astro"), /data-theme-toggle|theme-toggle/);
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
  assert.match(sitemap, /estadisticas\/avanzadas/);
  assert.match(sitemap, /estadisticas\/buscador-avanzado-jugadoras/);
  assert.match(sitemap, /estadisticas\/buscador-avanzado-partidos/);
  assert.match(sitemap, /estadisticas\/buscador-avanzado-temporadas/);
});
