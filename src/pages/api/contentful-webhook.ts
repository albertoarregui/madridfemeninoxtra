import type { APIRoute } from 'astro';
import { google } from 'googleapis';

export const prerender = false;

const SITE_URL = 'https://www.madridfemeninoxtra.com';

async function notifyGoogleIndexing(url: string): Promise<{ success: boolean; result?: any; error?: string }> {
    const clientEmail = import.meta.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = import.meta.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        return { success: false, error: 'Credenciales de Google no configuradas' };
    }

    const jwtClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    await jwtClient.authorize();

    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtClient.credentials.access_token}`,
        },
        body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    });

    const result = await response.json();
    return { success: response.ok, result };
}

export const POST: APIRoute = async ({ request }) => {
    try {
        // Verificar el secreto del webhook de Contentful
        const webhookSecret = import.meta.env.CONTENTFUL_WEBHOOK_SECRET;
        const incomingSecret = request.headers.get('x-contentful-webhook-secret');

        if (webhookSecret && incomingSecret !== webhookSecret) {
            console.warn('[Webhook] Secreto inválido recibido');
            return new Response(JSON.stringify({ error: 'No autorizado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await request.json();

        // Contentful envía el payload con sys.contentType.sys.id y fields.slug
        const contentType = body?.sys?.contentType?.sys?.id;
        const slug = body?.fields?.slug?.['es'] ?? body?.fields?.slug;
        const isPublished =
            body?.sys?.type === 'Entry' &&
            (body?.sys?.publishedVersion || body?.metadata?.tags);

        console.log(`[Webhook] Evento recibido - contentType: ${contentType}, slug: ${slug}`);

        if (contentType !== 'noticia' || !slug) {
            return new Response(
                JSON.stringify({ message: 'Evento ignorado: no es una noticia o falta slug' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const noticiaUrl = `${SITE_URL}/noticias/${slug}`;

        console.log(`[Webhook] Indexando URL: ${noticiaUrl}`);
        const indexResult = await notifyGoogleIndexing(noticiaUrl);

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
