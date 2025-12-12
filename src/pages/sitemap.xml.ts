import type { APIRoute } from 'astro';
import { fetchPlayersDirectly } from '../utils/players';
import { fetchCoachesDirectly } from '../utils/entrenadores';
import { fetchRivalsDirectly } from '../utils/rivales';
import { fetchGamesDirectly } from '../utils/partidos';

const SITE_URL = 'https://www.madridfemeninoxtra.com';
const WP_API_URL = "https://cms.madridfemeninoxtra.com/wp-json/wp/v2/posts?per_page=100&_embed=true";

const staticPages = [
    { url: '', priority: 1.0, changefreq: 'daily' },
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
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

export const GET: APIRoute = async () => {
    try {
        const urls: { loc: string; lastmod?: string; changefreq: string; priority: number }[] = [];

        staticPages.forEach(page => {
            urls.push({
                loc: `${SITE_URL}/${page.url}`,
                changefreq: page.changefreq,
                priority: page.priority,
            });
        });

        try {
            const response = await fetch(WP_API_URL);
            if (response.ok) {
                const posts = await response.json();
                posts.forEach((post: any) => {
                    const lastmod = new Date(post.modified).toISOString().split('T')[0];
                    urls.push({
                        loc: `${SITE_URL}/noticias/${post.slug}`,
                        lastmod,
                        changefreq: 'weekly',
                        priority: 0.8,
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching news:', error);
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
                'Cache-Control': 'public, max-age=600',
            },
        });
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
