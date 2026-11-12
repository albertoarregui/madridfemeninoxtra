import type { APIRoute } from 'astro';
import { cacheTags } from '../../lib/cache-tags';
import { notifyGoogleIndexing } from '../../lib/google-indexing';
import { runtimeEnv } from '../../lib/runtime-env';
import { invalidarTags } from '../../utils/cache';

export const prerender = false;

const SITE_URL = 'https://www.madridfemeninoxtra.com';

export const POST: APIRoute = async ({ request }) => {
    try {
        const webhookSecret = runtimeEnv('CONTENTFUL_WEBHOOK_SECRET');
        const incomingSecret = request.headers.get('x-contentful-webhook-secret');

        if (webhookSecret && incomingSecret !== webhookSecret) {
            console.warn('[Webhook] Secreto inválido recibido');
            return new Response(JSON.stringify({ error: 'No autorizado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await request.json();

        const contentType = body?.sys?.contentType?.sys?.id;
        const slugField = body?.fields?.slug;
        const slug = typeof slugField === 'string'
            ? slugField
            : (slugField && typeof slugField === 'object' ? Object.values(slugField)[0] : null);

        console.log(`[Webhook] Evento recibido - contentType: ${contentType}, slug: ${slug}`);

        // Fichas, imágenes OG y demás contenido de Contentful se guardan 24 h:
        // cualquier publicación las invalida.
        await invalidarTags(['contentful']);

        if (contentType !== 'noticia' || !slug) {
            return new Response(
                JSON.stringify({ message: 'Evento ignorado: no es una noticia o falta slug' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const topic = request.headers.get('x-contentful-topic') ?? '';
        const type: 'URL_UPDATED' | 'URL_DELETED' =
            /unpublish|delete/i.test(topic) ? 'URL_DELETED' : 'URL_UPDATED';

        const noticiaUrl = `${SITE_URL}/noticias/${slug}`;

        await invalidarTags([
            cacheTags.news,
            cacheTags.newsItem(String(slug)),
            cacheTags.homepage,
        ]);

        console.log(`[Webhook] Notificando a Google (${type}): ${noticiaUrl}`);
        const indexResult = await notifyGoogleIndexing(noticiaUrl, type, {
            clientEmail: runtimeEnv('GOOGLE_CLIENT_EMAIL'),
            privateKey: runtimeEnv('GOOGLE_PRIVATE_KEY'),
        });

        if (indexResult.success) {
            console.log(`[Webhook] ✅ Indexada correctamente: ${noticiaUrl}`);
        } else {
            console.error(`[Webhook] ❌ Error al indexar: ${noticiaUrl}`, indexResult);
        }

        return new Response(
            JSON.stringify({
                message: `Webhook procesado`,
                url: noticiaUrl,
                indexing: indexResult,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('[Webhook] Error procesando webhook:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
