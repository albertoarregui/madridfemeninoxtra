import type { APIRoute } from 'astro';
import { cached } from '../utils/cache';
import { fetchPlayersDirectly } from '../utils/players';
import { fetchCoachesDirectly } from '../utils/entrenadores';
import { fetchRivalsDirectly } from '../utils/rivales';
import { fetchGamesDirectly } from '../utils/partidos';
import { fetchAllStadiumsWithStats } from '../utils/estadios';
import { fetchRefereesDirectly } from '../utils/arbitras';
import { generateSlug } from '../utils/url-helper';
import { contentfulClient } from '../lib/contentful';
import {
    hasPlayedStats,
    isIndexableMatchSummary,
    isIndexablePlayerSummary,
} from '../lib/content-quality';

const SITE_URL = 'https://www.madridfemeninoxtra.com';

const staticPages = [
    { url: '', priority: 1.0, changefreq: 'daily' },
    { url: 'historia', priority: 0.5, changefreq: 'monthly' },
    { url: 'la-fabrica', priority: 0.8, changefreq: 'monthly' },
    { url: 'la-fabrica/historia', priority: 0.7, changefreq: 'monthly' },
    { url: 'la-fabrica/espana', priority: 0.8, changefreq: 'monthly' },
    { url: 'noticias', priority: 0.9, changefreq: 'daily' },
    { url: 'jugadoras', priority: 0.8, changefreq: 'weekly' },
    { url: 'entrenadores', priority: 0.7, changefreq: 'monthly' },
    { url: 'rivales', priority: 0.7, changefreq: 'monthly' },
    { url: 'partidos', priority: 0.7, changefreq: 'weekly' },
    { url: 'estadios', priority: 0.7, changefreq: 'monthly' },
    { url: 'arbitras', priority: 0.7, changefreq: 'monthly' },
    { url: 'plantilla', priority: 0.7, changefreq: 'monthly' },
    { url: 'rankings', priority: 0.8, changefreq: 'weekly' },
    { url: 'rankings/maximas-goleadoras', priority: 0.8, changefreq: 'weekly' },
    { url: 'rankings/maximas-asistentes', priority: 0.8, changefreq: 'weekly' },
    { url: 'rankings/mas-partidos', priority: 0.8, changefreq: 'weekly' },
    { url: 'rankings/mas-minutos', priority: 0.7, changefreq: 'weekly' },
    { url: 'rankings/mas-capitanias', priority: 0.7, changefreq: 'weekly' },
    { url: 'rankings/porterias-a-cero', priority: 0.7, changefreq: 'weekly' },
    { url: 'temporadas', priority: 0.8, changefreq: 'weekly' },
    { url: 'estadisticas-real-madrid-femenino', priority: 0.9, changefreq: 'weekly' },
    { url: 'estadisticas/avanzadas', priority: 0.8, changefreq: 'weekly' },
    { url: 'estadisticas/buscador-avanzado-jugadoras', priority: 0.7, changefreq: 'weekly' },
    { url: 'estadisticas/buscador-avanzado-partidos', priority: 0.7, changefreq: 'weekly' },
    { url: 'estadisticas/buscador-avanzado-temporadas', priority: 0.7, changefreq: 'weekly' },
    { url: 'prensa-datos', priority: 0.7, changefreq: 'weekly' },
    { url: 'records', priority: 0.6, changefreq: 'weekly' },
    { url: 'comparador', priority: 0.6, changefreq: 'monthly' },
    { url: 'donde-ver-real-madrid-femenino', priority: 0.7, changefreq: 'daily' },
    { url: 'sobre-nosotros', priority: 0.5, changefreq: 'monthly' },
    { url: 'autor/alberto-arregui', priority: 0.6, changefreq: 'weekly' },
    { url: 'politica-editorial', priority: 0.5, changefreq: 'monthly' },
    { url: 'contacto', priority: 0.5, changefreq: 'monthly' },
    { url: 'aviso-legal', priority: 0.3, changefreq: 'yearly' },
    { url: 'politica-privacidad', priority: 0.3, changefreq: 'yearly' },
    { url: 'politica-cookies', priority: 0.3, changefreq: 'yearly' },
    { url: 'terminos-condiciones', priority: 0.3, changefreq: 'yearly' },
];

function escapeXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function generateSitemapXML(urls: { loc: string; lastmod?: string; changefreq: string; priority: number }[]): string {
    // Avoid duplicate canonical URLs and invalid XML when slugs contain '&'.
    const uniqueUrls = [...new Map(urls.filter(item => {
        try {
            const value = new URL(item.loc);
            return value.protocol === 'https:' && value.hostname === 'www.madridfemeninoxtra.com' && !value.pathname.includes('/rivales/estadios');
        } catch { return false; }
    }).map(item => [item.loc, item])).values()];
    const localizedUrls = uniqueUrls.flatMap(url => {
        const parsed = new URL(url.loc);
        const spanishPath = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/$/, '');
        const englishPath = spanishPath === '/' ? '/en/' : `/en${spanishPath}`;
        const spanishLoc = `${SITE_URL}${spanishPath}`;
        const englishLoc = `${SITE_URL}${englishPath}`;
        return [
            { ...url, loc: spanishLoc, alternate: englishLoc, locale: 'es' },
            { ...url, loc: englishLoc, alternate: spanishLoc, locale: 'en' },
        ];
    });
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${localizedUrls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <xhtml:link rel="alternate" hreflang="${url.locale}" href="${escapeXml(url.loc)}" />
    <xhtml:link rel="alternate" hreflang="${url.locale === 'es' ? 'en' : 'es'}" href="${escapeXml(url.alternate)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url.locale === 'es' ? url.loc : url.alternate)}" />${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

async function buildSitemap(): Promise<string> {
    try {
        const urls: { loc: string; lastmod?: string; changefreq: string; priority: number }[] = [];
        // Temporadas y fichas de partido parten de la misma lectura. Compartirla
        // evita consultar dos veces Turso durante la generación del sitemap.
        const gamesPromise = fetchGamesDirectly();
        staticPages.forEach(page => {
            urls.push({
                loc: `${SITE_URL}/${page.url}`,
                changefreq: page.changefreq,
                priority: page.priority,
            });
        });

        try {
            const seasonGames = await gamesPromise;
            const seasonNames = [
                ...new Set(
                    seasonGames
                        .map((match: any) => String(match.temporada_nombre || '').trim())
                        .filter(Boolean),
                ),
            ];
            seasonNames.forEach((season) => {
                urls.push({
                    loc: `${SITE_URL}/temporadas/${season.replace('/', '-')}`,
                    changefreq: 'weekly',
                    priority: 0.8,
                });
            });
        } catch (error) {
            console.error('Error fetching seasons for sitemap:', error);
        }

        try {
            const entries = await contentfulClient.getEntries({
                content_type: 'noticia',
                limit: 1000,
                order: ['-sys.updatedAt'] as any,
            });
            entries.items.forEach((item: any) => {
                const slug = item.fields.slug;
                if (!slug) return;
                const lastmod = new Date(item.sys.updatedAt).toISOString().split('T')[0];
                urls.push({
                    loc: `${SITE_URL}/noticias/${slug}`,
                    lastmod,
                    changefreq: 'weekly',
                    priority: 0.9,
                });
            });
        } catch (error) {
            console.error('Error fetching news from Contentful for sitemap:', error);
        }

        try {
            const players = await fetchPlayersDirectly();
            players.filter(isIndexablePlayerSummary).forEach(player => {
                urls.push({
                    loc: `${SITE_URL}/jugadoras/${player.slug}`,
                    changefreq: 'monthly',
                    priority: 0.7,
                });
            });
        } catch (error) {
            console.error('Error fetching players:', error);
        }

        try {
            const coaches = await fetchCoachesDirectly();
            coaches.forEach((coach: any) => {
                urls.push({
                    loc: `${SITE_URL}/entrenadores/${coach.slug}`,
                    changefreq: 'monthly',
                    priority: 0.7,
                });
            });
        } catch (error) {
            console.error('Error fetching coaches:', error);
        }

        try {
            const rivals = await fetchRivalsDirectly();
            rivals.filter(hasPlayedStats).forEach((rival: any) => {
                urls.push({
                    loc: `${SITE_URL}/rivales/${rival.slug}`,
                    changefreq: 'monthly',
                    priority: 0.7,
                });
            });
        } catch (error) {
            console.error('Error fetching rivals:', error);
        }

        try {
            const matches = await gamesPromise;
            matches.filter(isIndexableMatchSummary).forEach((match: any) => {
                urls.push({
                    loc: `${SITE_URL}/partidos/${match.slug}`,
                    changefreq: 'monthly',
                    priority: 0.6,
                });
            });
        } catch (error) {
            console.error('Error fetching matches:', error);
        }

        try {
            const stadiums = await fetchAllStadiumsWithStats();
            stadiums.filter(hasPlayedStats).forEach((stadium: any) => {
                if (!stadium.slug) return;
                urls.push({
                    loc: `${SITE_URL}/estadios/${stadium.slug}`,
                    changefreq: 'monthly',
                    priority: 0.6,
                });
            });
        } catch (error) {
            console.error('Error fetching stadiums:', error);
        }

        try {
            const referees = await fetchRefereesDirectly();
            referees.filter(hasPlayedStats).forEach((referee: any) => {
                if (!referee.nombre) return;
                urls.push({
                    loc: `${SITE_URL}/arbitras/${generateSlug(referee.nombre)}`,
                    changefreq: 'monthly',
                    priority: 0.6,
                });
            });
        } catch (error) {
            console.error('Error fetching referees:', error);
        }


        return generateSitemapXML(urls);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        throw error;
    }
}

export const GET: APIRoute = async () => {
    try {
        const xml = await cached('seo:sitemap-2026-v4-i18n', 6 * 60 * 60 * 1000, buildSitemap, { tags: ['database', 'news', 'matches', 'players', 'coaches', 'stadiums', 'referees', 'rivals', 'statistics'] });
        return new Response(xml, { headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            'Vercel-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=3600',
        } });
    } catch (error) {
        console.error('Sitemap unavailable:', error);
        return new Response('Error generating sitemap', { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
};
