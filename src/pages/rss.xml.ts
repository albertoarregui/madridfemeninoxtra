import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { contentfulClient } from '../lib/contentful';

export const GET: APIRoute = async (context) => {
    let items: any[] = [];

    try {
        const entries = await contentfulClient.getEntries({
            content_type: 'noticia',
            limit: 50,
            order: ['-sys.updatedAt'] as any,
        });

        items = entries.items.map((item: any) => {
            const slug = item.fields.slug;
            const title = item.fields.title || 'Noticia MFX';
            const description = item.fields.subtitle || item.fields.excerpt || 'Última hora del Real Madrid Femenino';
            const pubDate = new Date(item.sys.updatedAt);
            
            return {
                title,
                pubDate,
                description,
                link: `/noticias/${slug}/`,
            };
        });
    } catch (error) {
        console.error('Error generando RSS de noticias:', error);
    }

    return rss({
        title: 'Madrid Femenino Xtra - Noticias',
        description: 'La actualidad diaria, resultados y noticias del Real Madrid Femenino.',
        site: context.site || 'https://www.madridfemeninoxtra.com',
        items: items,
        customData: `<language>es-es</language>`,
    });
};
