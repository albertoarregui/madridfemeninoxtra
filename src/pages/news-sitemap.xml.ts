import type { APIRoute } from 'astro';
import { contentfulClient } from '../lib/contentful';

export const prerender = false;

const SITE_URL = 'https://www.madridfemeninoxtra.com';
const PUBLICATION_NAME = 'Madrid Femenino Xtra';
const LANGUAGE = 'es';
const MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000; // Google News solo admite artículos de las últimas 48h

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
    const items: { loc: string; date: string; title: string }[] = [];
    const cutoff = Date.now() - MAX_AGE_MS;

    try {
        const entries = await contentfulClient.getEntries({
            content_type: 'noticia',
            order: ['-sys.createdAt'] as any,
            limit: 100,
        });

        for (const item of entries.items as any[]) {
            const slug = item.fields?.slug;
            const title = item.fields?.title;
            if (!slug || !title) continue;

            const rawDate = item.fields?.publishDate || item.sys?.createdAt;
            const date = new Date(rawDate);
            if (isNaN(date.getTime()) || date.getTime() < cutoff) continue;

            items.push({
                loc: `${SITE_URL}/noticias/${slug}`,
                date: date.toISOString(),
                title: String(title),
            });
        }
    } catch (error) {
        console.error('Error generando news-sitemap:', error);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items.map(i => `  <url>
    <loc>${i.loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${i.date}</news:publication_date>
      <news:title>${xmlEscape(i.title)}</news:title>
    </news:news>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
        },
    });
};
