import type { APIRoute } from 'astro';
import { notifyGoogleIndexing } from '../../lib/google-indexing';
import { runtimeEnv } from '../../lib/runtime-env';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { url, secret } = body;


        const ASSIGNED_SECRET = runtimeEnv('INDEXING_SECRET');
        if (!ASSIGNED_SECRET || secret !== ASSIGNED_SECRET) {
            return new Response(JSON.stringify({ error: "No autorizado. Secreto inválido." }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!url) {
            return new Response(JSON.stringify({ error: "Falta la URL a indexar" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }


        const clientEmail = runtimeEnv('GOOGLE_CLIENT_EMAIL');
        const privateKey = runtimeEnv('GOOGLE_PRIVATE_KEY');

        if (!clientEmail || !privateKey) {
            return new Response(JSON.stringify({ error: "Credenciales de Google no configuradas." }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const result = await notifyGoogleIndexing(url, 'URL_UPDATED', {
            clientEmail,
            privateKey,
        });
        return new Response(JSON.stringify({ success: result.success, googleResponse: result.result, error: result.error }), {
            status: result.success ? 200 : 502,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Error al notificar a Google Indexing API:", error);
        return new Response(JSON.stringify({ error: "Error interno", details: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
