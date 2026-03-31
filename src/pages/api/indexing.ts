import type { APIRoute } from 'astro';
import { google } from 'googleapis';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { url, secret } = body;


        const ASSIGNED_SECRET = import.meta.env.INDEXING_SECRET;
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


        const clientEmail = import.meta.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = import.meta.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!clientEmail || !privateKey) {
            return new Response(JSON.stringify({ error: "Credenciales de Google no configuradas en Vercel." }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const jwtClient = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ["https://www.googleapis.com/auth/indexing"]
        });


        await jwtClient.authorize();


        const response = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwtClient.credentials.access_token}`,
            },
            body: JSON.stringify({
                url: url,
                type: "URL_UPDATED",
            }),
        });

        const result = await response.json();

        return new Response(JSON.stringify({ success: true, googleResponse: result }), {
            status: 200,
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
