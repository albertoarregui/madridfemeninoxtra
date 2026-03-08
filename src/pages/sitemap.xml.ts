import type { APIRoute } from 'astro';
import { fetchPlayersDirectly } from '../utils/players';
import { fetchCoachesDirectly } from '../utils/entrenadores';
import { fetchRivalsDirectly } from '../utils/rivales';
import { fetchGamesDirectly } from '../utils/partidos';
import { contentfulClient } from '../lib/contentful';

const SITE_URL = 'https://www.madridfemeninoxtra.com';

const staticPages = [
    { url: '', priority: 1.0, changefreq: 'daily' },
    { url: 'home', priority: 1.0, changefreq: 'daily' },
    { url: 'noticias', priority: 0.9, changefreq: 'daily' },
    { url: 'jugadoras', priority: 0.8, changefreq: 'weekly' },
    { url: 'entrenadores', priority: 0.7, changefreq: 'monthly' },
    { url: 'rivales', priority: 0.7, changefreq: 'monthly' },
    { url: 'partidos', priority: 0.7, changefreq: 'weekly' },
    { url: 'plantilla', priority: 0.7, changefreq: 'monthly' },
    { url: 'rankings', priority: 0.7, changefreq: 'weekly' },
    { url: 'search', priority: 0.5, changefreq: 'monthly' },
    { url: 'sobre-nosotros', priority: 0.5, changefreq: 'monthly' },
    { url: 'contacto', priority: 0.5, changefreq: 'monthly' },
    { url: 'aviso-legal', priority: 0.3, changefreq: 'yearly' },
    { url: 'politica-privacidad', priority: 0.3, changefreq: 'yearly' },
    { url: 'politica-cookies', priority: 0.3, changefreq: 'yearly' },
    { url: 'terminos-condiciones', priority: 0.3, changefreq: 'yearly' },
];

function generateSitemapXML(urls: { loc: string; lastmod?: string; changefreq: string; priority: number }[]): string {
    const today = new Date().toISOString().split('T')[0];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

export const GET: APIRoute = async () => {
    try {
        const urls: { loc: string; lastmod?: string; changefreq: string; priority: number }[] = [];
        const today = new Date().toISOString().split('T')[0];

        staticPages.forEach(page => {
            urls.push({
                loc: `${SITE_URL}/${page.url}`,
                lastmod: today,
                changefreq: page.changefreq,
                priority: page.priority,
            });
        });

        // Noticias desde Contentful (reemplaza la antigua API de WordPress)
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
            players.forEach(player => {
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
            rivals.forEach((rival: any) => {
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
            const matches = await fetchGamesDirectly();
            matches.forEach((match: any) => {
                if (!match.slug) return;
                urls.push({
                    loc: `${SITE_URL}/partidos/${match.slug}`,
                    changefreq: 'monthly',
                    priority: 0.6,
                });
            });
        } catch (error) {
            console.error('Error fetching matches:', error);
        }

        const sitemap = generateSitemapXML(urls);

        return new Response(sitemap, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=300',
            },
        });
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
