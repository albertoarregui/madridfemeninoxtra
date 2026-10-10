#!/usr/bin/env node
/**
 * Production HTTP smoke test. No browser, no Cloudflare settings changes,
 * no article-view writes and no analytics mutations.
 *
 * Run: pnpm smoke:production
 * Optional: SITE_URL=https://preview.example.com pnpm smoke:production
 */
const origin = (process.env.SITE_URL || 'https://www.madridfemeninoxtra.com').replace(/\/$/, '');
let failures = 0;

async function request(path, method = 'GET') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(origin + path, { method, redirect: 'manual', signal: controller.signal, headers: { 'User-Agent': 'MadridFemeninoXtraSmoke/1.0' } });
  } finally {
    clearTimeout(timer);
  }
}
async function check(label, run) {
  try {
    const detail = await run();
    console.log('✓', label, detail || '');
  } catch (err) {
    failures += 1;
    console.error('✗', label, err.message);
  }
}
const eq = (value, expected, name) => { if (value !== expected) throw Error(`${name}: expected ${expected}, received ${value}`); };

await check('Homepage', async () => {
  const r = await request('/');
  eq(r.status, 200, 'status');
  const html = await r.text();
  if (!html.includes('og:description') || !html.includes('rel="canonical"')) throw Error('missing social or canonical metadata');
  return 'HTTP 200; canonical and OG present';
});
await check('Stadium index', async () => {
  const r = await request('/estadios');
  eq(r.status, 200, 'status');
});
await check('Legacy stadium redirect', async () => {
  const r = await request('/rivales/estadios');
  eq(r.status, 301, 'status');
  const target = new URL(r.headers.get('location') || '', origin);
  eq(target.pathname, '/estadios', 'redirect target');
});
await check('Sitemap', async () => {
  const r = await request('/sitemap.xml');
  eq(r.status, 200, 'status');
  const xml = await r.text();
  if (!xml.includes('<urlset') || !xml.includes('/estadios')) throw Error('incomplete XML');
  if (xml.includes('/rivales/estadios')) throw Error('legacy route should not be indexed');
});
await check('News sitemap', async () => {
  const r = await request('/news-sitemap.xml');
  eq(r.status, 200, 'status');
  if (!(await r.text()).includes('<urlset')) throw Error('invalid XML');
});
await check('Disallowed image proxy source', async () => {
  const r = await request('/api/img-proxy?url=' + encodeURIComponent('http://127.0.0.1/internal'));
  eq(r.status, 403, 'status');
});
await check('News counter rejects unauthenticated sample POST', async () => {
  const r = await request('/api/noticias/lectura', 'POST');
  eq(r.status, 415, 'status');
});
console.log(`Checks completed. Failures: ${failures}.`);
if (failures) process.exitCode = 1;
