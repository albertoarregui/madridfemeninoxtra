type CacheOptions = {
    sMaxage?: number;
    swr?: number;
    status?: number;
    headers?: Record<string, string>;
};

const BASE_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
};

export function jsonResponse(data: unknown, opts: CacheOptions = {}): Response {
    const { sMaxage = 3600, swr = 86400, status = 200, headers = {} } = opts;

    const cacheControl =
        sMaxage > 0
            ? `public, s-maxage=${sMaxage}, stale-while-revalidate=${swr}`
            : 'no-store';

    return new Response(JSON.stringify(data), {
        status,
        headers: { ...BASE_HEADERS, 'Cache-Control': cacheControl, ...headers },
    });
}

export function jsonError(message: string, status = 500, extra: Record<string, unknown> = {}): Response {
    return jsonResponse({ error: message, ...extra }, { sMaxage: 0, status });
}
