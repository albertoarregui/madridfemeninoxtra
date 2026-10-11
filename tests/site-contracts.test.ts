import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path: string) => existsSync(new URL(`../${path}`, import.meta.url));

test('there is only one stadium index and a permanent legacy redirect', () => {
  assert.equal(exists('src/pages/estadios/index.astro'), true);
  assert.equal(exists('src/pages/rivales/estadios.astro'), false);
  assert.ok(read('astro.config.mjs').includes("'/rivales/estadios': { status: 301, destination: '/estadios' }"));
  assert.match(read('astro.config.mjs'), /prefetchAll:\s*false/);
});

test('image proxy only accesses approved public origins', () => {
  const endpoint = read('src/pages/api/img-proxy.ts');
  assert.match(endpoint, /permittedImageSource/);
  assert.match(endpoint, /MAX_PROXY_IMAGE_BYTES/);
  assert.match(endpoint, /redirect:\s*'error'/);
  assert.doesNotMatch(read('src/lib/image-proxy-policy.ts'), /'localhost'/);
});

test('article views are recorded after engagement, never during SSR', () => {
  const news = read('src/pages/noticias/[slug].astro');
  assert.doesNotMatch(news, /INSERT INTO article_views/);
  assert.match(news, /\/api\/noticias\/lectura/);
  assert.match(news, /mfx:lectura:/);
  const api = read('src/pages/api/noticias/lectura.ts');
  assert.match(api, /INSERT INTO article_views/);
  assert.match(api, /request\.headers\.get\('origin'\)/);
});

test('sitemap, SEO and consent rules stay in place', () => {
  assert.match(read('src/pages/sitemap.xml.ts'), /seo:sitemap-2026-v3/);
  assert.match(read('src/pages/sitemap.xml.ts'), /escapeXml/);
  assert.match(read('src/pages/sitemap.xml.ts'), /'players', 'coaches', 'stadiums'/);
  assert.match(read('src/layouts/Layout.astro'), /isNewsArticle \? "article" : "website"/);
  assert.match(read('src/components/CookieConsent.astro'), /background: #0c1222/);
  assert.match(read('src/utils/og-metadata.ts'), /OG_ESTATICOS/);
});

test('key interactive collections defer hydration until visible', () => {
  for (const path of [
    'src/pages/index.astro',
    'src/pages/rankings.astro',
    'src/pages/fotogalerias/index.astro',
    'src/pages/comparador.astro',
  ]) {
    assert.match(read(path), /client:visible/, path);
  }
});

test('stadium map uses a dedicated minimal query without expensive match subqueries', () => {
  const page = read('src/pages/estadios/index.astro');
  const matches = read('src/utils/partidos.ts');
  const stadiumQuery = matches.split('export async function fetchStadiumMapGames')[1]?.split('export const fetchGamesDirectly')[0] || '';
  assert.match(page, /await fetchStadiumMapGames\(\)/);
  assert.match(page, /<MatchMapWrapper matches=\{gamesData\}/);
  assert.match(page, /<MatchStatsDashboard matches=\{gamesData\}/);
  assert.doesNotMatch(page, /fetchGamesDirectly\(/);
  assert.match(stadiumQuery, /FROM partidos p/);
  assert.match(stadiumQuery, /estadio_lat/);
  assert.doesNotMatch(stadiumQuery, /LEFT JOIN estadisticas_partidos/);
  assert.doesNotMatch(stadiumQuery, /SELECT COUNT\(\*\)/);
});

test('homepage stadium link and Sofascore fallback target the correct resources', () => {
  const page = read('src/pages/index.astro');
  assert.match(page, /MAPA DE ESTADIOS<\/h2>[\s\S]*?<a href="\/estadios" class="sidebar-map-link">/);
  assert.match(page, /widgets\.sofascore\.com\/es-ES\/embed\/tournament\/3739\/season\/97379/);
  assert.match(page, /www\.sofascore\.com\/es\/football\/tournament\/spain\/liga-f\/1127/);
});

test('rival records never query the obsolete goles_asistencias table', () => {
  const records = read('src/utils/rival-records.ts');
  assert.match(records, /FROM goles_y_asistencias/);
  assert.doesNotMatch(records, /\b(?:FROM|JOIN)\s+goles_asistencias\b/i);
});

test('Astro uses no-op image transformations instead of the legacy image endpoint', () => {
  const config = read('astro.config.mjs');
  assert.match(config, /imageService:\s*false/);
  assert.match(config, /astro\/assets\/services\/noop/);
});
