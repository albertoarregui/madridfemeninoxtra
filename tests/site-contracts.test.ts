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

test('homepage embeds original Liga F and UWCL Sofascore widgets in this order', () => {
  const homepage = read('src/pages/index.astro');
  const widget = read('src/components/LigaFStandings.astro');
  assert.match(homepage, /CLASIFICACIONES<\/h2>/);
  assert.match(homepage, /<LigaFStandings\s*\/>/);
  const liga = 'sofa-standings-embed-3739-97379';
  const uwcl = 'sofa-standings-embed-198786-96633';
  assert.ok(widget.indexOf(liga) >= 0);
  assert.ok(widget.indexOf(uwcl) > widget.indexOf(liga));
  assert.match(widget, /widgets\.sofascore\.com\/es-ES\/embed\/tournament\/3739\/season\/97379\/standings\/Primera%20Division%2C%20Women%2026%2F27/);
  assert.match(widget, /widgets\.sofascore\.com\/es-ES\/embed\/tournament\/198786\/season\/96633\/standings\/UEFA%20Champions%20League%2C%20Women%2026%2F27/);
  assert.match(widget, /height: 963/);
  assert.match(widget, /height: 991/);
  assert.match(widget, /Clasificación ofrecida por/);
  assert.match(widget, /scrolling="no"/);
  assert.doesNotMatch(widget, /const liga: Team\[\]/);
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


test('upper footer has six navigational columns, social icons and working newsletter wiring', () => {
  const footer = read('src/components/FooterUpper.astro');
  const layout = read('src/layouts/Layout.astro');
  assert.match(layout, /<FooterUpper\s*\/>\s*<Footer\s*\/>/);
  for (const label of ['SECCIONES', 'EMPRESA', 'MÁS', 'SOCIAL', 'NEWSLETTER']) {
    assert.ok(footer.includes(label), label);
  }
  for (const href of ['/', '/noticias', '/plantilla', '/calendario', '/rankings', '/la-fabrica', '/sobre-nosotros', '/contacto', '/politica-privacidad', '/politica-cookies', '/sitemap.xml', '/rss.xml']) {
    assert.ok(footer.includes(`href="${href}"`) || footer.includes(`href: "${href}"`), href);
  }
  for (const brand of ['<X ', '<Instagram ', '<TikTok ', '<Youtube ']) {
    assert.ok(footer.includes(brand), brand);
  }
  assert.match(footer, /id="mfx-newsletter-form"/);
  assert.match(footer, /\/api\/newsletter\/subscribe/);
  assert.match(footer, /name="consent" type="checkbox" required/);
  assert.match(footer, /@media\(max-width:1230px\)/);
  assert.match(footer, /@media\(max-width:750px\)/);
  assert.match(footer, /@media\(max-width:400px\)/);
});

test('original footer style stays with exact requested legal and cookie controls', () => {
  const footer = read('src/components/Footer.astro');
  assert.match(footer, /footer-container/);
  assert.match(footer, /footer-social-row/);
  for (const href of ['/aviso-legal', '/politica-privacidad', '/politica-cookies', '/terminos-condiciones']) {
    assert.ok(footer.includes(`href="${href}"`), href);
  }
  assert.match(footer, /id="mfx-footer-manage-cookies"/);
  assert.match(footer, /getElementById\('mfx-manage-consent'\)/);
  assert.match(footer, /getElementById\('mfx-consent'\)/);
});

test('newsletter double opt-in and unsubscribe use existing safe endpoints', () => {
  const signup = read('src/pages/api/newsletter/subscribe.ts');
  const confirmation = read('src/pages/api/confirm.ts');
  const unsubscribe = read('src/pages/api/unsubscribe.ts');
  assert.match(signup, /request\.headers\.get\('origin'\)/);
  assert.match(signup, /body\?\.consent !== true/);
  assert.match(signup, /randomBytes\(32\)/);
  assert.match(signup, /newsletter_subscribers/);
  assert.match(signup, /resend\.emails\.send/);
  assert.match(confirmation, /SET confirmed_at/);
  assert.match(unsubscribe, /DELETE FROM newsletter_subscribers WHERE unsubscribe_token/);
  assert.match(unsubscribe, /<form method="POST"/);
});


test('Hobby CPU controls reuse HTML at the CDN and never serialize full article bodies', () => {
  const middleware = read('src/middleware.ts');
  const news = read('src/pages/noticias/index.astro');
  const proxy = read('src/pages/api/img-proxy.ts');
  assert.match(middleware, /const CACHE_HOME_S = 15 \* 60;/);
  assert.match(middleware, /const SWR_HOME_S = 60 \* 60;/);
  assert.match(middleware, /fastRefresh \? SWR_HOME_S/);
  assert.match(middleware, /Vercel-CDN-Cache-Control/);
  assert.match(news, /"fields.title"/);
  assert.match(news, /"fields.featuredImage"/);
  assert.doesNotMatch(news, /\.\.\.item\.fields/);
  assert.match(news, /featuredImage: imageUrl \?/);
  assert.match(proxy, /Vercel-CDN-Cache-Control/);
  assert.match(proxy, /permittedImageSource\(src\)/);
  assert.match(proxy, /MAX_PROXY_IMAGE_BYTES/);
  assert.match(proxy, /redirect: 'error'/);
});
