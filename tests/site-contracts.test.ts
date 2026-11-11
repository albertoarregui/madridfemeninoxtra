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
  assert.match(read('src/pages/sitemap.xml.ts'), /seo:sitemap-2026-v4-i18n/);
  assert.match(read('src/pages/sitemap.xml.ts'), /hreflang=/);
  assert.match(read('src/pages/sitemap.xml.ts'), /escapeXml/);
  assert.match(read('src/pages/sitemap.xml.ts'), /'players', 'coaches', 'stadiums'/);
  assert.match(read('src/layouts/Layout.astro'), /isNewsArticle \? "article" : "website"/);
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

test('deferred match cards keep Astro scoped styles after filtering', () => {
  const list = read('src/components/MatchList.astro');
  assert.match(list, /const createScopedElement/);
  assert.match(list, /name\.startsWith\("data-astro-cid-"\)/);
  assert.match(list, /if \(scopeAttribute\) node\.setAttribute\(scopeAttribute, ""\)/);
  assert.match(list, /const item = createScopedElement\("div"\)/);
});

test('news pages avoid oversized SSR work and fetch only the referenced match', () => {
  const archive = read('src/pages/noticias/index.astro');
  const article = read('src/pages/noticias/[slug].astro');
  const matches = read('src/utils/partidos.ts');

  assert.match(archive, /<NewsArchive noticias=\{noticias\} client:only="react"/);
  assert.match(article, /fetchGameById/);
  assert.match(article, /fetchGameBySlug/);
  assert.doesNotMatch(article, /fetchGamesDirectly\(\)/);
  assert.match(article, /include:\s*1/);
  assert.match(article, /fields\.featuredImage/);
  assert.match(matches, /export async function fetchGameById/);
  assert.match(matches, /p\.id_partido = \?/);
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


test('upper footer keeps navigation and social links without the newsletter form', () => {
  const footer = read('src/components/FooterUpper.astro');
  const layout = read('src/layouts/Layout.astro');
  assert.match(layout, /<FooterUpper locale=\{locale\}\s*\/>\s*<Footer locale=\{locale\}\s*\/>/);
  for (const label of ['SECCIONES', 'EMPRESA', 'MÁS', 'SOCIAL']) {
    assert.ok(footer.includes(label), label);
  }
  for (const href of ['/', '/noticias', '/plantilla', '/calendario', '/rankings', '/la-fabrica', '/sobre-nosotros', '/contacto', '/politica-privacidad', '/politica-cookies', '/sitemap.xml', '/rss.xml']) {
    assert.ok(footer.includes(`href={href("${href}")}`) || footer.includes(`href="${href}"`) || footer.includes(`href: "${href}"`), href);
  }
  for (const brand of ['<X ', '<Instagram ', '<TikTok ', '<Youtube ']) {
    assert.ok(footer.includes(brand), brand);
  }
  assert.doesNotMatch(footer, /NEWSLETTER|mfx-newsletter-form|\/api\/newsletter\/subscribe/);
  assert.match(footer, /@media\(max-width:1230px\)/);
  assert.match(footer, /@media\(max-width:750px\)/);
  assert.match(footer, /@media\(max-width:400px\)/);
});

test('original footer style stays with exact requested legal links and no ad consent controls', () => {
  const footer = read('src/components/Footer.astro');
  assert.match(footer, /footer-container/);
  assert.match(footer, /footer-social-row/);
  for (const href of ['/aviso-legal', '/politica-privacidad', '/politica-cookies', '/terminos-condiciones']) {
    assert.ok(footer.includes(`href={href("${href}")}`) || footer.includes(`href="${href}"`), href);
  }
  assert.doesNotMatch(footer, /mfx-footer-manage-cookies|mfx-consent/);
  assert.equal(exists('src/components/CookieConsent.astro'), false);
  assert.equal(exists('public/ads.txt'), false);
  assert.doesNotMatch(read('src/layouts/Layout.astro'), /showAds|adsbygoogle/);
});


test('Vercel CPU controls reuse HTML at the CDN and never serialize full article bodies', () => {
  const middleware = read('src/middleware.ts');
  const cache = read('src/utils/cache.ts');
  const header = read('src/components/Header.astro');
  const translations = read('src/i18n/translate-html.ts');
  const news = read('src/pages/noticias/index.astro');
  const proxy = read('src/pages/api/img-proxy.ts');
  assert.match(middleware, /const CACHE_HOME_S = 15 \* 60;/);
  assert.match(middleware, /const SWR_HOME_S = 60 \* 60;/);
  assert.match(middleware, /fastRefresh \? SWR_HOME_S/);
  assert.match(middleware, /Vercel-CDN-Cache-Control/);
  assert.match(middleware, /Vercel-Cache-Tag/);
  assert.match(cache, /getCache\(\{ namespace: RUNTIME_CACHE_NAMESPACE \}\)/);
  assert.match(cache, /dangerouslyDeleteByTag/);
  assert.match(middleware, /const REQUIERE_CLERK = \/\^\\\/api/);
  assert.match(middleware, /clerkApiMiddleware\(context, next\)/);
  assert.match(header, /isStatic=\{true\}/);
  assert.doesNotMatch(header, /Astro\.locals\.currentUser/);
  assert.match(translations, /interfaceReplacementPattern/);
  assert.doesNotMatch(translations, /html = html\.split\(source\)\.join\(target\)/);
  assert.match(news, /"fields.title"/);
  assert.match(news, /"fields.featuredImage"/);
  assert.doesNotMatch(news, /\.\.\.item\.fields/);
  assert.match(news, /featuredImage: imageUrl \?/);
  assert.match(proxy, /Vercel-CDN-Cache-Control/);
  assert.match(proxy, /permittedImageSource\(src\)/);
  assert.match(proxy, /MAX_PROXY_IMAGE_BYTES/);
  assert.match(proxy, /redirect: 'error'/);
});



test('reader ratings pages have competition crests and one-row MVP UI', () => {
  const archive = read('src/pages/valoraciones/index.astro');
  const detail = read('src/pages/valoraciones/[slug].astro');
  const board = read('src/components/RatingScoreboard.astro');
  const header = read('src/components/Header.astro');
  const css = read('src/styles/valoraciones.css');
  assert.match(header, /href=\{href\("\/fotogalerias"\)\}[\s\S]*?href=\{href\("\/valoraciones"\)\}/);
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

test('ratings archive shows every match without a competition selector', () => {
  const page = read('src/pages/valoraciones/index.astro');
  const css = read('src/styles/valoraciones.css');
  assert.doesNotMatch(page, /rating-competition-filter/);
  assert.doesNotMatch(page, /filterRatings/);
  assert.doesNotMatch(page, /const competitions=/);
  assert.doesNotMatch(css, /\.mfx-rating-filters/);
  assert.match(page, /older\.map\(match=>/);
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


test('about gallery keeps the approved order, captions and exact replacement', () => {
  const page = read('src/pages/sobre-nosotros.astro');
  const galleryBlock = page.match(/const gallery = \[([\s\S]*?)\];/)?.[1] ?? '';
  const order = [...galleryBlock.matchAll(/"foto-(\d+)"/g)].map((match) => Number(match[1]));

  assert.deepEqual(order, [7, 6, 3, 4, 5, 11, 12, 13, 1, 8, 9, 10, 2, 14, 15, 19, 17, 18, 20, 21]);
  assert.doesNotMatch(galleryBlock, /"foto-16"/);
  assert.match(page, /FC Barcelona vs Real Madrid - UWCL 2021\/22 Cuartos de Final \(vuelta\) \[30\/03\/2022\]/);
  assert.match(page, /Real Madrid vs Manchester City - UWCL 2026\/27 Fase Liga Jornada 2 \[01\/10\/2026\]/);
  assert.match(page, /<figcaption class="lightbox-caption"><\/figcaption>/);
  assert.match(page, /galleryItems: gallery\.map\(\(img\) => \(\{ src: img\.src\?\.src, alt: img\.alt \}\)\)/);
  assert.match(page, /lightboxCaption\.textContent = current\.alt/);
  assert.match(page, /\.lightbox-prev \{ left: 0\.65rem; \}/);
  assert.match(page, /\.lightbox-next \{ right: 0\.65rem; \}/);
  assert.match(page, /<button type="button" class="lightbox-close"/);
  assert.match(page, /closeBtn\.addEventListener\("click", \(e\) => \{ e\.stopPropagation\(\); closeLightbox\(\); \}\)/);
  assert.match(page, /\.lightbox \{[\s\S]*?z-index: 3000000/);
  assert.match(page, /\.lightbox-close:hover \{[\s\S]*?color: #d4a843;[\s\S]*?background: transparent/);
  assert.equal(exists('src/assets/galeria/foto-21.webp'), true);
});

test('ranking pages use concise headings and a compact vertical table', () => {
  const index = read('src/pages/rankings.astro');
  const detail = read('src/pages/rankings/[slug].astro');

  assert.match(index, /<h1 class="landing-title">RANKINGS<\/h1>/);
  assert.match(index, /Clasificaciones históricas de las jugadoras del Real Madrid Femenino a lo largo de su historia, por temporada y competición/);
  assert.match(index, /\.seo-ranking-links \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(index, /\.seo-ranking-links \{[\s\S]*?width: min\(100%, 1200px\);[\s\S]*?margin: 0 auto 2rem/);
  assert.match(detail, /h1: "Máximas goleadoras"/);
  assert.match(detail, /h1: "Más partidos"/);
  assert.doesNotMatch(detail, /h1: "[^"]*del Real Madrid Femenino/);
  assert.match(detail, /\{config\.h1\} del Real Madrid Femenino a lo largo de su historia/);
  assert.match(detail, /\.rank-grid \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);[\s\S]*?width: calc\(\(100% - 0\.8rem\) \/ 2\);[\s\S]*?margin-inline: auto/);
  assert.match(detail, /@media \(max-width: 760px\)[\s\S]*?\.rank-grid \{ width: 100%; \}/);
});

test('records page uses the concise heading and centered narrow table', () => {
  const page = read('src/pages/records.astro');
  assert.match(page, /<h1 class="landing-title">RÉCORDS GOLEADORES<\/h1>/);
  assert.match(page, /Marcas de goles redondos del Real Madrid femenino a lo largo de su historia/);
  assert.match(page, /#records-content \{[\s\S]*?max-width: 1120px;[\s\S]*?margin-inline: auto/);
});

test('assist network normalizes player photos without extra database reads', () => {
  const api = read('src/pages/api/assist-network.ts');
  assert.match(api, /COALESCE\(NULLIF\(TRIM\(foto_url\), ''\), NULLIF\(TRIM\(foto_perfil_url\), ''\)\)/);
  assert.equal((api.match(/client\.execute\(/g) || []).length, 2);
});

test('about project description uses the approved wording', () => {
  const page = read('src/pages/sobre-nosotros.astro');
  assert.match(page, /día a día del Real Madrid Femenino/);
  assert.match(page, /incluyendo gráficos interactivos, desde su fundación en 2020/);
  assert.match(page, /más de 500 horas/);
  assert.doesNotMatch(page, /proyecto sin ánimo de lucro/);
  assert.doesNotMatch(page, /La comunidad ha acompañado el crecimiento/);
});

test('homepage recent results reuse the existing match read and stay responsive', () => {
  const home = read('src/pages/index.astro');
  const recent = read('src/components/RecentResults.astro');

  assert.match(home, /<RecentResults games=\{gamesData\} \/>/);
  assert.match(home, /ÚLTIMOS RESULTADOS/);
  assert.doesNotMatch(recent, /fetchGamesDirectly|client\.execute|fetch\(/);
  assert.match(recent, /game\.competicion_foto_url/);
  assert.match(recent, /game\.opponentLogo/);
  assert.match(recent, /href=\{`\/partidos\/\$\{game\.slug\}`\}/);
  assert.match(recent, /@media \(max-width: 420px\)/);
});

test('homepage keeps only first-team players and removes the requested secondary blocks', () => {
  const home = read('src/pages/index.astro');
  const players = read('src/components/ProtagonistasSection.astro');

  assert.doesNotMatch(home, /MAPA DE JUGADORAS|MAPA DE ESTADIOS|Ver plantilla|<GaleriasSection/);
  assert.match(players, /id_categoria === 4/);
  assert.match(players, /primera plantilla/);
  assert.doesNotMatch(players, /setInterval|jugScrollInterval|fetchCoachesDirectly/);
});

test('newsletter endpoints and cron stay removed', () => {
  const config = JSON.parse(read('vercel.json'));
  assert.equal(config.crons, undefined);
  assert.doesNotMatch(read('package.json'), /"resend"/);
});
