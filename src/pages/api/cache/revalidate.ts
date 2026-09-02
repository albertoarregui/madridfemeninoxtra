import type { APIRoute } from 'astro';
import { cacheTags } from '../../../lib/cache-tags';
import { isCachedTable, tagsForTables, type CachedTable } from '../../../lib/db-cache-tags';
import { invalidarTags } from '../../../utils/cache';

export const prerender = false;

const STATIC_TAGS: Set<string> = new Set([
    cacheTags.database,
    cacheTags.matches,
    cacheTags.goals,
    cacheTags.lineups,
    cacheTags.statistics,
    cacheTags.rankings,
    cacheTags.players,
    cacheTags.stadiums,
    cacheTags.referees,
    cacheTags.coaches,
    cacheTags.calendar,
    cacheTags.rivals,
    cacheTags.homepage,
    cacheTags.news,
    cacheTags.awards,
]);

const DYNAMIC_TAG = /^(match|player|stadium|referee|coach|news)-[a-zA-Z0-9_-]+$/;

function response(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    });
}

export const POST: APIRoute = async ({ request }) => {
    const secret = import.meta.env.CACHE_REVALIDATION_SECRET;
    if (!secret) return response({ error: 'Revalidación no configurada' }, 503);

    if (request.headers.get('x-cache-revalidation-secret') !== secret) {
        return response({ error: 'No autorizado' }, 401);
    }

    let body: { tags?: unknown; tables?: unknown };
    try {
        body = await request.json();
    } catch {
        return response({ error: 'JSON no válido' }, 400);
    }

    const rawTags = body.tags ?? [];
    const rawTables = body.tables ?? [];

    if (!Array.isArray(rawTags)) {
        return response({ error: 'El campo tags debe ser una lista' }, 400);
    }

    if (!Array.isArray(rawTables)) {
        return response({ error: 'El campo tables debe ser una lista' }, 400);
    }

    const invalidTables = rawTables.filter((table) =>
        typeof table !== 'string' || !isCachedTable(table),
    );
    if (invalidTables.length > 0) {
        return response({ error: 'Hay tablas no válidas', tables: invalidTables }, 400);
    }

    const tables = [...new Set(rawTables as CachedTable[])];

    const tags = [...new Set([
        ...rawTags.filter((tag): tag is string =>
            typeof tag === 'string' && (STATIC_TAGS.has(tag) || DYNAMIC_TAG.test(tag)),
        ),
        ...tagsForTables(tables),
    ])];

    if (tags.length === 0) {
        return response({ error: 'No se recibieron etiquetas válidas' }, 400);
    }

    await invalidarTags(tags);
    return response({ revalidated: true, tables, tags });
};
