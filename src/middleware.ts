import { clerkMiddleware } from "@clerk/astro/server";
import { defineMiddleware } from "astro:middleware";
import type { MiddlewareHandler } from "astro";
import { cacheTags, tagsForPath } from "./lib/cache-tags";
import { secondsUntilNextSeason } from "./utils/season";

const SIN_CACHE = [/^\/api\//, /^\/premios/, /^\/valoraciones(?:\/|$)/];
const REQUIERE_CLERK = /^\/api\/(?:season-awards|valoraciones(?:\/|$))/;

const CACHE_LARGA = [
    /^\/(aviso-legal|politica-cookies|politica-privacidad|terminos-condiciones|sobre-nosotros|contacto)/,
    /^\/(historia|records|premios-historicos)/,
    /^\/la-fabrica(?:\/|$)/,
];

// Turso y Contentful invalidan por etiqueta cuando cambia un dato; estos TTL
// son una red de seguridad para evitar regeneraciones periódicas sin cambios.
const CACHE_CORTA_S = 7 * 24 * 60 * 60;
const SWR_S = 30 * 24 * 60 * 60;
const CACHE_LARGA_S = 30 * 24 * 60 * 60;
const SWR_LARGA_S = 90 * 24 * 60 * 60;
const CACHE_HOME_S = 24 * 60 * 60;
const SWR_HOME_S = 7 * 24 * 60 * 60;

async function handleRequest(
    context: Parameters<MiddlewareHandler>[0],
    next: Parameters<MiddlewareHandler>[1],
    userId: string | null = null,
) {
    const requestStartedAt = new Date();
    const requestUrl = new URL(context.request.url);
    const routePath = requestUrl.pathname;
    if (routePath === "/en" || routePath.startsWith("/en/")) {
        return context.redirect(`${routePath.slice(3) || "/"}${requestUrl.search}`, 301);
    }
    if (routePath.length > 1 && routePath.endsWith("/") && !routePath.startsWith("/api/")) {
        return context.redirect(`${routePath.replace(/\/+$/, "")}${requestUrl.search}`, 301);
    }
    context.locals.originPathname = requestUrl.pathname;
    const response = await next();

    try {
        const { request } = context;

        const cacheable =
            request.method === "GET" &&
            response.status === 200 &&
            (response.headers.get("content-type") || "").includes("text/html") &&
            !SIN_CACHE.some((re) => re.test(routePath)) &&
            !userId;

        if (cacheable) {
            const larga = CACHE_LARGA.some((re) => re.test(routePath));
            const fastRefresh = routePath === '/' || routePath === '/donde-ver-real-madrid-femenino';
            const seasonPage = routePath === '/plantilla' || routePath === '/partidos';
            const sMaxage = seasonPage
                ? Math.min(CACHE_CORTA_S, secondsUntilNextSeason(requestStartedAt))
                : fastRefresh ? CACHE_HOME_S : (larga ? CACHE_LARGA_S : CACHE_CORTA_S);
            const swr = seasonPage ? 0 : fastRefresh ? SWR_HOME_S : (larga ? SWR_LARGA_S : SWR_S);
            const tags = tagsForPath(routePath);
            // Si la página ya decide su caché o sus etiquetas (fichas de partido y sus
            // fragmentos), se respeta: las fichas antiguas no llevan etiquetas de tablas.
            if (!response.headers.has("Vercel-CDN-Cache-Control")) {
                response.headers.set(
                    "Vercel-CDN-Cache-Control",
                    `max-age=${sMaxage}, stale-while-revalidate=${swr}`,
                );
            }
            if (!response.headers.has("Vercel-Cache-Tag")) {
                response.headers.set("Vercel-Cache-Tag", [cacheTags.database, ...tags].join(","));
            }
            response.headers.set("Vary", "Accept-Encoding");
        }
    } catch {
    }

    return response;
}

const clerkApiMiddleware = clerkMiddleware(async (auth, context, next) =>
    handleRequest(context, next, auth().userId),
);

export const onRequest = defineMiddleware((context, next) => {
    const routePath = new URL(context.request.url).pathname;
    return REQUIERE_CLERK.test(routePath)
        ? clerkApiMiddleware(context, next)
        : handleRequest(context, next);
});
