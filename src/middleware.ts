import { clerkMiddleware } from "@clerk/astro/server";
import { defineMiddleware } from "astro:middleware";
import type { MiddlewareHandler } from "astro";
import { cacheTags, tagsForPath } from "./lib/cache-tags";
import { isFreshMatchPath } from "./lib/match-freshness";
import { secondsUntilNextSeason } from "./utils/season";

const SIN_CACHE = [/^\/api\//, /^\/premios/, /^\/valoraciones(?:\/|$)/];
const REQUIERE_CLERK = /^\/api\/(?:season-awards|valoraciones(?:\/|$))/;

const CACHE_LARGA = [
    /^\/(aviso-legal|politica-cookies|politica-privacidad|terminos-condiciones|sobre-nosotros|contacto)/,
    /^\/(historia|records|premios-historicos)/,
    /^\/la-fabrica(?:\/|$)/,
];

const CACHE_CORTA_S = 24 * 60 * 60;
const SWR_S = 7 * 24 * 60 * 60;
const CACHE_LARGA_S = 7 * 24 * 60 * 60;
const SWR_LARGA_S = 30 * 24 * 60 * 60;
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
    const routePath = requestUrl.pathname;
    if (routePath.length > 1 && routePath.endsWith("/") && !routePath.startsWith("/api/")) {
        return context.redirect(`${routePath.replace(/\/+$/, "")}${requestUrl.search}`, 301);
    }
    context.locals.originPathname = requestUrl.pathname;
    const response = await next();

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
            response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
            response.headers.set("Vercel-CDN-Cache-Control", `max-age=${FRESH_MATCH_CACHE_S}`);
            response.headers.set("Vercel-Cache-Tag", [cacheTags.database, ...tagsForPath(routePath)].join(","));
        } else if (freshMatch && request.method === "GET") {
            response.headers.set("Cache-Control", "private, no-store, max-age=0");
            response.headers.set("Vercel-CDN-Cache-Control", "no-store");
        } else if (cacheable) {
            const larga = CACHE_LARGA.some((re) => re.test(routePath));
            const fastRefresh = routePath === '/' || routePath === '/donde-ver-real-madrid-femenino';
            const seasonPage = routePath === '/plantilla' || routePath === '/partidos';
            const sMaxage = seasonPage
                ? Math.min(CACHE_CORTA_S, secondsUntilNextSeason(requestStartedAt))
                : fastRefresh ? CACHE_HOME_S : (larga ? CACHE_LARGA_S : CACHE_CORTA_S);
            const swr = seasonPage ? 0 : fastRefresh ? SWR_HOME_S : (larga ? SWR_LARGA_S : SWR_S);
            const tags = tagsForPath(routePath);
            response.headers.set(
                "Vercel-CDN-Cache-Control",
                `max-age=${sMaxage}, stale-while-revalidate=${swr}`,
            );
            response.headers.set("Vercel-Cache-Tag", [cacheTags.database, ...tags].join(","));
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
