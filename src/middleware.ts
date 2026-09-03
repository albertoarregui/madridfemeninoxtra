import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";
import { addCacheTag } from "@vercel/functions";
import { cacheTags, tagsForPath } from "./lib/cache-tags";
import { isFreshMatchPath } from "./lib/match-freshness";

const isProtectedRoute = createRouteMatcher([]);

const SIN_CACHE = [/^\/api\//, /^\/premios/];

const CACHE_LARGA = [
    /^\/(aviso-legal|politica-cookies|politica-privacidad|terminos-condiciones|sobre-nosotros|contacto)/,
    /^\/(historia|records|premios-historicos)/,
];

// La CDN absorbe las visitas; las escrituras revalidan solo las etiquetas
// afectadas, por lo que no hace falta regenerar todas las páginas cada minuto.
const CACHE_CORTA_S = 24 * 60 * 60;
const SWR_S = 7 * 24 * 60 * 60;
const CACHE_LARGA_S = 7 * 24 * 60 * 60;
const SWR_LARGA_S = 30 * 24 * 60 * 60;

export const onRequest = clerkMiddleware(async (auth, context, next) => {
    if (isProtectedRoute(context.request)) {
        auth().protect();
    }

    let response = await next();

    try {
        const { request } = context;
        const url = new URL(request.url);
        const freshMatch = isFreshMatchPath(url.pathname);
        const matchDetail = /^\/partidos\/[^/]+\/?$/.test(url.pathname);

        // Las fichas son respuestas grandes. Vercel estaba corrompiendo los
        // fragmentos del stream después del DOCTYPE; al materializarlas aquí
        // se envía HTML íntegro sin añadir consultas ni alterar sus datos.
        if (
            matchDetail &&
            request.method === "GET" &&
            response.status === 200 &&
            (response.headers.get("content-type") || "").includes("text/html")
        ) {
            const body = await response.arrayBuffer();
            const headers = new Headers(response.headers);
            headers.set("Content-Length", String(body.byteLength));
            response = new Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        }

        const cacheable =
            request.method === "GET" &&
            response.status === 200 &&
            (response.headers.get("content-type") || "").includes("text/html") &&
            !SIN_CACHE.some((re) => re.test(url.pathname)) &&
            !freshMatch &&
            !auth().userId;

        if (request.method === "GET" && response.status === 200 && !auth().userId) {
            const tags = tagsForPath(url.pathname);
            if (tags.length > 0) await addCacheTag([cacheTags.database, ...tags]);
        }

        if (freshMatch && request.method === "GET") {
            response.headers.set("Cache-Control", "private, no-store, max-age=0");
            response.headers.set("CDN-Cache-Control", "no-store");
            response.headers.set("Vercel-CDN-Cache-Control", "no-store");
        } else if (cacheable) {
            const larga = CACHE_LARGA.some((re) => re.test(url.pathname));
            const sMaxage = larga ? CACHE_LARGA_S : CACHE_CORTA_S;
            const swr = larga ? SWR_LARGA_S : SWR_S;
            // Astro establece Cache-Control: public, max-age=0. La cabecera
            // específica de Vercel controla su CDN sin cachear en el navegador.
            response.headers.set(
                "Vercel-CDN-Cache-Control",
                `max-age=${sMaxage}, stale-while-revalidate=${swr}`,
            );
            response.headers.set("Vary", "Accept-Encoding");
        }
    } catch {
    }

    return response;
});
