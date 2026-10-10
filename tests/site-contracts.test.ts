import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path: string) => existsSync(new URL(`../${path}`, import.meta.url));

test('there is only one stadium index and a permanent legacy redirect', () => {
  assert.equal(exists('src/pages/estadios/index.astro'), true);
  assert.equal(exists('src/pages/rivales/estadios.astro'), false);
  assert.match(read('astro.config.mjs'), /['"]\\/rivales\\/estadios['"]:\\s*\\{\\s*status:\\s*301,\\s*destination:\\s*['"]\\/estadios['"]/);
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
  assert.match(read('src/pages/sitemap.xml.ts'), /seo:sitemap-2026-v2/);
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
