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


test('weekly cron is authenticated, idempotent and avoids unsolicited article mailings', () => {
  const weekly = read('src/pages/api/newsletter/weekly.ts');
  const config = JSON.parse(read('vercel.json'));
  const immediate = read('src/pages/api/newsletter/send.ts');
  assert.deepEqual(config.crons, [{ path: '/api/newsletter/weekly', schedule: '0 6 * * 1' }]);
  assert.match(weekly, /process\.env\.VERCEL_ENV !== 'production'/);
  assert.match(weekly, /authorization!==`Bearer \$\{expected\}`/);
  assert.match(weekly, /mondayAt10Madrid\(monday\)/);
  assert.match(weekly, /confirmed_at IS NOT NULL/);
  assert.match(weekly, /INSERT OR IGNORE INTO newsletter_weekly_deliveries/);
  assert.match(weekly, /idempotencyKey/);
  assert.match(weekly, /scheduledAt:schedule/);
  assert.match(weekly, /No hay noticias de las cinco categorías/);
  assert.match(immediate, /NEWSLETTER_PER_ARTICLE_ENABLED !== 'true'/);
});


test('reader ratings pages have competition crests and one-row MVP UI', () => {
  const archive = read('src/pages/valoraciones/index.astro');
  const detail = read('src/pages/valoraciones/[slug].astro');
  const board = read('src/components/RatingScoreboard.astro');
  const header = read('src/components/Header.astro');
  const css = read('src/styles/valoraciones.css');
  assert.match(header, /href="\/fotogalerias"[\s\S]*?href="\/valoraciones"/);
  assert.match(archive, /RatingScoreboard/);
  assert.match(detail, /getAssetUrl\('competiciones'/);
  assert.match(board, /getAssetUrl\('escudos'/);
  assert.match(detail, /ONCE INICIAL/);
  assert.match(detail, /SUPLENTES/);
  assert.match(detail, /ENTRENADOR\/A/);
  assert.match(detail, /MVP DEL PARTIDO/);
  assert.match(detail, /Minutos no disponibles/);
  assert.match(css, /grid-template-columns:repeat\(10/);
  assert.match(read('src/middleware.ts'), /\/\^\\\/valoraciones/);
});

test('reader votes are authenticated, deduplicated, and cannot select the coach as MVP', () => {
  const api = read('src/pages/api/valoraciones/[id].ts');
  const db = read('src/lib/ratings.ts');
  assert.match(api, /locals.currentUser/);
  assert.match(api, /origin'\)!==url.origin/);
  assert.match(api, /mvpCount>1/);
  assert.match(api, /mvp && subject < 0/);
  assert.match(api, /lastUpdate/);
  assert.match(api, /db.batch\(statements,'write'\)/);
  assert.match(db, /PRIMARY KEY\(match_id,user_id,subject_id\)/);
  assert.match(db, /const opening = startTimeUTC\(m\) \+ 2 \* 60/);
});

test('fan ratings use the current season and shared gold editorial styling', () => {
  const archive=read('src/pages/valoraciones/index.astro');
  const detail=read('src/pages/valoraciones/[slug].astro');
  const data=read('src/lib/ratings.ts');
  const css=read('src/styles/valoraciones.css');
  assert.match(data, /JOIN temporadas t ON t.id_temporada=p.id_temporada/);
  assert.match(data, /t.temporada=\?/);
  assert.match(data, /getCurrentSeason\(\)/);
  assert.match(archive, /recentRatingMatches\(\)/);
  assert.doesNotMatch(archive, /rating-year-filter/);
  assert.match(archive, /class="landing-title"/);
  assert.match(archive, /class="landing-subtitle"/);
  assert.match(detail, /class="landing-title"/);
  assert.match(detail, /class="landing-subtitle"/);
  assert.match(css, /\.mfx-rating-identity img\{[^\n]*border:2px solid var\(--rating-gold\)/);
  assert.match(css, /\.mfx-rating-mvp-winner img\{[^\n]*border:2px solid var\(--rating-gold\)/);
  assert.match(css, /\.mfx-rating-match-card::before/);
  assert.match(css, /\.mfx-rating-match-card::after/);
  assert.match(css, /\.mfx-rating-detail-hero::before/);
  assert.match(archive, /'CollectionPage'/);
  assert.match(archive, /breadcrumbSchema/);
  assert.match(detail, /ogTitle=/);
  assert.match(detail, /ogDescription=/);
  assert.match(detail, /canonical=/);
  assert.match(detail, /noindex=\{!match\}/);
});

test('reader ratings include substitutes who entered even without recorded minutes', () => {
  const ratings = read('src/lib/ratings.ts');
  const detail = read('src/pages/valoraciones/[slug].astro');
  assert.match(ratings, /a\.minuto_entrada IS NOT NULL AND CAST\(a\.minuto_entrada AS INTEGER\)>0/);
  assert.match(ratings, /COALESCE\(a\.minutos_jugados,0\)>0/);
  assert.match(detail, /const substitutes=players\.filter\(x=>!x\.titular\)/);
});

test('homepage builds valid absolute URLs for most-read Contentful images', () => {
  const homepage = read('src/pages/index.astro');
  assert.ok(homepage.includes('String(assetUrl).startsWith("//") ? `https:${assetUrl}` : String(assetUrl)'));
  assert.ok(!homepage.includes('String(assetUrl).replace(/^\\/\\//, "https:")'));
  assert.ok(homepage.includes("news:most-read-articles-v3"));
});

test('Laia Lopez has six clean sheets at the 2026 U20 World Cup', () => {
  const stats = read('src/data/fabrica-estadisticas.ts');
  assert.match(stats, /"mundial-sub20-2026::laialopez": stats\(6, 6, 540, 0, 0, 6\)/);
});

test('2026 U20 awards use dedicated framed photos with captions', () => {
  const page = read('src/pages/la-fabrica/espana.astro');
  const css = read('src/styles/la-fabrica.css');
  const assets = read('src/utils/assets.ts');
  for (const file of [
    'mundial_sub20_2026_pau_comendador_bota_oro.webp',
    'mundial_sub20_2026_pau_comendador_balon_bronce.webp',
    'mundial_sub20_2026_laia_lopez_guante_oro.webp',
    'mundial_sub20_2026_silvia_cristobal_mvp_final.webp',
  ]) {
    assert.ok(page.includes(file), file);
    assert.equal(exists(`src/assets/awards/${file}`), true, file);
  }
  assert.match(page, /<figure class="award-photo">/);
  assert.match(page, /<figcaption>\{visual\.caption\}<\/figcaption>/);
  assert.match(css, /\.award-card--featured/);
  assert.match(css, /aspect-ratio:\s*3 \/ 4/);
  assert.match(page, /class="award-title"/);
  assert.match(page, /class="award-details"/);
  assert.match(page, /visual \? stat\.label : stat\.short/);
  assert.match(css, /\.award-card--featured \.person-stats \{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /\.award-card--featured \.award-details \{[\s\S]*?grid-template-columns:\s*minmax\(125px, 165px\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.award-card--featured \.award-details \{[\s\S]*?minmax\(105px, 0\.42fr\)/);
  assert.match(assets, /type === 'premios' \? 'awards'/);
});


test('about gallery replaces the flag photo without duplicating the selected image', () => {
  const page = read('src/pages/sobre-nosotros.astro');
  assert.doesNotMatch(page, /getAssetMetadata\("galeria", "foto-14"\)/);
  assert.equal((page.match(/getAssetMetadata\("galeria", "foto-16"\)/g) || []).length, 1);
  assert.match(page, /Alberto junto a una jugadora del fútbol formativo/);
});

test('about project description uses the approved wording', () => {
  const page = read('src/pages/sobre-nosotros.astro');
  assert.match(page, /día a día del Real Madrid Femenino/);
  assert.match(page, /incluyendo gráficos interactivos, desde su fundación en 2020/);
  assert.doesNotMatch(page, /proyecto sin ánimo de lucro/);
  assert.doesNotMatch(page, /La comunidad ha acompañado el crecimiento/);
});
