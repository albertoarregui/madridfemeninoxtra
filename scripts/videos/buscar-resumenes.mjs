#!/usr/bin/env node
// Busca en YouTube el vídeo resumen de los partidos del Real Madrid Femenino y lo guarda
// en partidos.video_resumen_url. Nunca sobrescribe un vídeo puesto a mano.
//
// Uso:
//   node scripts/videos/buscar-resumenes.mjs              # partidos de los últimos 14 días sin vídeo
//   node scripts/videos/buscar-resumenes.mjs --dias 60    # ventana distinta
//   node scripts/videos/buscar-resumenes.mjs --historico  # todos los partidos sin vídeo (requiere YOUTUBE_API_KEY)
//   node scripts/videos/buscar-resumenes.mjs --dry        # solo muestra lo que encontraría
//
// Con YOUTUBE_API_KEY (Google Cloud → YouTube Data API v3, gratuita: 10.000 unidades/día,
// cada búsqueda gasta 100) busca partido a partido. Sin clave, solo revisa el RSS de los canales
// marcados con "rss": true en canales.json (los 15 últimos vídeos de cada uno).
import fs from 'node:fs';
import { createClient } from '@libsql/client/web';
import { rivalTokens, puntuar } from './reglas.mjs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const HIST = args.includes('--historico');
const WEB = args.includes('--historico-web');   // histórico sin clave: búsqueda en la página de cada canal (scraping, uso puntual)
const DIAS = Number(args[args.indexOf('--dias') + 1]) || 14;

const env = { ...process.env };
for (const f of ['.env.vercel', '.env.local', '.env']) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2];
    }
}
const KEY = env.YOUTUBE_API_KEY;
if (HIST && !KEY) { console.error('El modo --historico necesita YOUTUBE_API_KEY.'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(new URL('./canales.json', import.meta.url), 'utf8'));
const prio = Object.fromEntries(cfg.canales.map(c => [c.nombre, c.prioridad ?? 0]));
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });


const desde = HIST || WEB ? '2000-01-01' : new Date(Date.now() - DIAS * 864e5).toISOString().slice(0, 10);
const partidos = (await db.execute({
    sql: `SELECT p.id_partido, p.fecha, p.goles_rm, p.goles_rival, CASE WHEN p.id_club_local = 1 THEN v.nombre ELSE l.nombre END AS rival
          FROM partidos p JOIN clubes l ON l.id_club = p.id_club_local JOIN clubes v ON v.id_club = p.id_club_visitante
          WHERE p.goles_rm IS NOT NULL AND date(p.fecha) <= date('now') AND date(p.fecha) >= date(?)
            AND (p.video_resumen_url IS NULL OR p.video_resumen_url = '')
          ORDER BY p.fecha DESC`,
    args: [desde],
})).rows;
console.log(`${partidos.length} partidos sin vídeo desde ${desde} · modo ${WEB ? 'búsqueda web en los canales' : KEY ? 'API de YouTube' : 'RSS'}`);

// Histórico sin clave: busca en la página de cada canal y lee título y fecha de cada vídeo
const webCache = new Map();
async function videoInfo(id) {
    if (webCache.has(id)) return webCache.get(id);
    const h = await (await fetch(`https://www.youtube.com/watch?v=${id}`, { headers: YT_HEADERS })).text();
    const titulo = (h.match(/<meta name="title" content="([^"]*)"/) || [])[1] || '';
    const fecha = ((h.match(/"publishDate":"([^"]+)"/) || [])[1] || '').slice(0, 10);
    const info = { id, titulo: titulo.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"), fecha };
    webCache.set(id, info); return info;
}
const YT_HEADERS = { 'Accept-Language': 'es-ES', Cookie: 'SOCS=CAI; CONSENT=YES+cb' };   // evita la página de consentimiento
async function buscarWeb(canalHandle, q) {
    const h = await (await fetch(`https://www.youtube.com/${canalHandle}/search?query=${encodeURIComponent(q)}`, { headers: YT_HEADERS })).text();
    return [...new Set([...h.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map(m => m[1]))];
}

// Candidatos por RSS (sin clave)
const rss = [];
for (const c of cfg.canales.filter(c => c.rss)) {
    const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${c.id}`)).text();
    for (const e of xml.split('<entry>').slice(1)) {
        rss.push({ id: e.match(/<yt:videoId>([^<]+)/)?.[1], titulo: e.match(/<title>([^<]+)/)?.[1] || '', fecha: (e.match(/<published>([^<]+)/)?.[1] || '').slice(0, 10), canal: c.nombre });
    }
}

async function buscarApi(q, desdeF, hastaF, channelId) {
    const u = new URL('https://www.googleapis.com/youtube/v3/search');
    Object.entries({ part: 'snippet', type: 'video', maxResults: '10', q, publishedAfter: `${desdeF}T00:00:00Z`, publishedBefore: `${hastaF}T23:59:59Z`, key: KEY, ...(channelId ? { channelId } : {}) })
        .forEach(([k, v]) => u.searchParams.set(k, v));
    const r = await fetch(u); const j = await r.json();
    if (j.error) throw new Error(`YouTube API: ${j.error.message}`);
    return (j.items || []).map(i => ({ id: i.id.videoId, titulo: i.snippet.title, fecha: i.snippet.publishedAt.slice(0, 10), canal: i.snippet.channelTitle }));
}

let encontrados = 0; let unidades = 0;
const stmts = [];
for (const p of partidos) {
    const hasta = new Date(Date.parse(p.fecha) + 7 * 864e5).toISOString().slice(0, 10);
    let cands = rss.filter(v => v.fecha >= p.fecha && v.fecha <= hasta);
    // Búsqueda en el buscador del canal: en el histórico, los canales principales; a diario, los marcados con busqueda_web
    const canalesWeb = WEB ? cfg.canales.filter(c => c.handle && ((c.prioridad ?? 0) >= 3 || c.busqueda_web))
        : KEY ? [] : cfg.canales.filter(c => c.handle && c.busqueda_web);
    if (canalesWeb.length) {
        for (const c of canalesWeb) {
            const q = `real madrid femenino ${rivalTokens(p.rival)[0] || p.rival}`;
            const key = `${c.handle}|${q}`;
            if (!webCache.has(key)) webCache.set(key, await buscarWeb(c.handle, q));
            for (const id of webCache.get(key)) {
                const info = await videoInfo(id);
                if (info.fecha >= p.fecha && info.fecha <= hasta) cands.push({ ...info, canal: c.nombre });
            }
        }
    }
    if (KEY) {
        const q = `Real Madrid ${p.rival} femenino resumen`;
        try {
            for (const c of cfg.canales) { cands.push(...await buscarApi(q, p.fecha, hasta, c.id)); unidades += 100; }
            const ok = cands.some(v => puntuar(v.titulo, p.rival, v.canal, [Number(p.goles_rm), Number(p.goles_rival)]) != null);
            if (!ok && cfg.busqueda_abierta) {
                const abiertos = await buscarApi(q, p.fecha, hasta); unidades += 100;
                cands.push(...abiertos.filter(v => (cfg.canales_de_confianza || []).some(n => v.canal.includes(n))));
            }
        } catch (e) { console.error(`${p.fecha} ${p.rival}: ${e.message}`); if (/quota/i.test(e.message)) break; continue; }
    }
    const mejor = cands.map(v => ({ ...v, p: (() => { const sc = puntuar(v.titulo, p.rival, v.canal, [Number(p.goles_rm), Number(p.goles_rival)]); return sc == null ? null : sc + (prio[v.canal] ?? 0); })() })).filter(v => v.p != null && v.p >= 3).sort((a, b) => b.p - a.p || a.fecha.localeCompare(b.fecha))[0];
    if (!mejor) continue;
    encontrados++;
    console.log(`${p.fecha} vs ${p.rival} → ${mejor.canal}: ${mejor.titulo} (https://youtu.be/${mejor.id})`);
    stmts.push({ sql: "UPDATE partidos SET video_resumen_url = ?, video_resumen_canal = ? WHERE id_partido = ? AND (video_resumen_url IS NULL OR video_resumen_url = '')",
        args: [`https://www.youtube.com/watch?v=${mejor.id}`, mejor.canal, p.id_partido] });
}
console.log(`\n${encontrados} vídeos encontrados${KEY ? ` · ${unidades} unidades de la API usadas` : ''}`);
if (DRY || !stmts.length) process.exit(0);
await db.batch(stmts, 'write');
if (env.CACHE_REVALIDATION_SECRET) {
    const site = env.SITE_URL || 'https://www.madridfemeninoxtra.com';
    const r = await fetch(`${site}/api/cache/revalidate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cache-revalidation-secret': env.CACHE_REVALIDATION_SECRET }, body: JSON.stringify({ tables: ['partidos'] }) });
    console.log(`Caché de la web: ${r.status}`);
}
