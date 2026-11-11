import { clerkMiddleware } from "@clerk/astro/server";
import { defineMiddleware } from "astro:middleware";
import type { MiddlewareHandler } from "astro";
import { cacheTags, tagsForPath } from "./lib/cache-tags";
import { isFreshMatchPath } from "./lib/match-freshness";
import { secondsUntilNextSeason } from "./utils/season";
import { localeFromPath, stripLocale } from "./i18n";
import { runWithRequestLocale } from "./i18n/request-locale";
import { translateInterfaceHtml } from "./i18n/translate-html";

const SIN_CACHE = [/^\/api\//, /^\/premios/, /^\/valoraciones(?:\/|$)/];
const REQUIERE_CLERK = /^\/api\/(?:season-awards|valoraciones(?:\/|$))/;

const CACHE_LARGA = [
    /^\/(aviso-legal|politica-cookies|politica-privacidad|terminos-condiciones|sobre-nosotros|contacto)/,
    /^\/(historia|records|premios-historicos)/,
    /^\/la-fabrica(?:\/|$)/,
];

// La CDN absorbe las visitas; las escrituras revalidan solo las etiquetas
// afectadas, por lo que no hace falta regenerar todas las páginas cada minuto.
const CACHE_CORTA_S = 24 * 60 * 60;
const SWR_S = 7 * 24 * 60 * 60;
const CACHE_LARGA_S = 7 * 24 * 60 * 60;
const SWR_LARGA_S = 30 * 24 * 60 * 60;
// La portada ejecuta agregados deportivos y consultas a Contentful.
// Una regeneración cada 15 minutos reduce los fallos de caché y CPU;
// las etiquetas siguen permitiendo invalidar cuando se actualiza el contenido.
const CACHE_HOME_S = 15 * 60;
const SWR_HOME_S = 60 * 60;
const FRESH_MATCH_CACHE_S = 60;

async function handleRequest(
    context: Parameters<MiddlewareHandler>[0],
    next: Parameters<MiddlewareHandler>[1],
    userId: string | null = null,
) {
    const requestStartedAt = new Date();
    const requestUrl = new URL(context.request.url);
    const locale = localeFromPath(requestUrl.pathname);
    const routePath = stripLocale(requestUrl.pathname);
    context.locals.locale = locale;
    context.locals.originPathname = requestUrl.pathname;
    let response = await runWithRequestLocale(locale, () => locale === "en"
        ? next(routePath + requestUrl.search)
        : next());

    if (locale === "en" && (response.headers.get("content-type") || "").includes("text/html")) {
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        const html = translateInterfaceHtml(await response.text());
        // Astro resuelve correctamente el componente reescrito desde una ruta
        // catch-all, pero conserva el 404 con el que entró `/en/*`. Solo se
        // corrige cuando el contenido devuelto no es la página 404 real.
        const isNotFoundPage = /<h1\b[^>]*class="[^"]*\berror-title\b[^"]*"[^>]*>\s*404\s*<\/h1>/i.test(html);
        const successfulRewrite = !isNotFoundPage;
        if (successfulRewrite) headers.delete("x-robots-tag");
        // Esta cabecera solo sirve dentro del renderizador de Astro. Si llega
        // al adaptador, Vercel conserva el estado de la ruta `/en/*` original.
        headers.delete("x-astro-rewrite");
        headers.delete("x-astro-reroute");
        response = new Response(html, {
            status: successfulRewrite ? 200 : response.status,
            statusText: successfulRewrite ? "OK" : response.statusText,
            headers,
        });
    }

    try {
        const { request } = context;
        const freshMatch = isFreshMatchPath(routePath);

        const cacheable =
            request.method === "GET" &&
            response.status === 200 &&
            (response.headers.get("content-type") || "").includes("text/html") &&
            !SIN_CACHE.some((re) => re.test(routePath)) &&
            !freshMatch &&
            !userId;

        if (freshMatch && request.method === "GET" && response.status === 200 && !userId) {
            // Las fichas recientes leen Turso sin caché de datos. La CDN agrupa
            // las visitas durante un minuto: como mucho una lectura por minuto
            // y región, en lugar de una por visita en día de partido.
            response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
            response.headers.set("Vercel-CDN-Cache-Control", `max-age=${FRESH_MATCH_CACHE_S}`);
            response.headers.set("Vercel-Cache-Tag", [cacheTags.database, ...tagsForPath(routePath)].join(","));
        } else if (freshMatch && request.method === "GET") {
            response.headers.set("Cache-Control", "private, no-store, max-age=0");
            response.headers.set("Vercel-CDN-Cache-Control", "no-store");
        } else if (cacheable) {
            const larga = CACHE_LARGA.some((re) => re.test(routePath));
            const fastRefresh = routePath === '/' || routePath === '/donde-ver-real-madrid-femenino';
            const seasonPage = routePath === '/plantilla' || routePath === '/calendario';
            const sMaxage = seasonPage
                ? Math.min(CACHE_CORTA_S, secondsUntilNextSeason(requestStartedAt))
                : fastRefresh ? CACHE_HOME_S : (larga ? CACHE_LARGA_S : CACHE_CORTA_S);
            const swr = seasonPage ? 0 : fastRefresh ? SWR_HOME_S : (larga ? SWR_LARGA_S : SWR_S);
            const tags = tagsForPath(routePath);
            // Astro establece Cache-Control: public, max-age=0. La cabecera
            // específica de Vercel controla su CDN sin cachear en el navegador.
            response.headers.set(
                "Vercel-CDN-Cache-Control",
                `max-age=${sMaxage}, stale-while-revalidate=${swr}`,
            );
            // Solo las respuestas que se guardan en la CDN llevan etiquetas,
            // para que `invalidarTags` purgue únicamente lo afectado.
            response.headers.set("Vercel-Cache-Tag", [cacheTags.database, ...tags].join(","));
            response.headers.set("Vary", "Accept-Encoding");
        }
    } catch {
    }

    return response;
}

// Las páginas públicas resuelven el estado de sesión en el navegador. Clerk
// solo se ejecuta en las API que necesitan verificar la identidad del usuario.
const clerkApiMiddleware = clerkMiddleware(async (auth, context, next) =>
    handleRequest(context, next, auth().userId),
);

export const onRequest = defineMiddleware((context, next) => {
    const routePath = stripLocale(new URL(context.request.url).pathname);
    return REQUIERE_CLERK.test(routePath)
        ? clerkApiMiddleware(context, next)
        : handleRequest(context, next);
});
