import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";
import { addCacheTag } from "@vercel/functions";
import { tagsForPath } from "./lib/cache-tags";

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

    const response = await next();

    try {
        const { request } = context;
        const url = new URL(request.url);

        const cacheable =
            request.method === "GET" &&
            response.status === 200 &&
            (response.headers.get("content-type") || "").includes("text/html") &&
            !response.headers.has("Cache-Control") &&
            !SIN_CACHE.some((re) => re.test(url.pathname)) &&
            !auth().userId;

        if (request.method === "GET" && response.status === 200 && !auth().userId) {
            const tags = tagsForPath(url.pathname);
            if (tags.length > 0) await addCacheTag(tags);
        }

        if (cacheable) {
            const larga = CACHE_LARGA.some((re) => re.test(url.pathname));
            const sMaxage = larga ? CACHE_LARGA_S : CACHE_CORTA_S;
            const swr = larga ? SWR_LARGA_S : SWR_S;
            response.headers.set(
                "Cache-Control",
                `public, max-age=0, s-maxage=${sMaxage}, stale-while-revalidate=${swr}`,
            );
            response.headers.set("Vary", "Accept-Encoding");
        }
    } catch {
    }

    return response;
});
