import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler';

type WorkerEnv = {
    ASSETS: { fetch(request: Request | string): Promise<Response> };
    APP_ENV?: string;
    CRON_SECRET?: string;
    [key: string]: unknown;
};

type WorkerContext = {
    waitUntil(promise: Promise<unknown>): void;
};

type WorkerCache = {
    match(request: RequestInfo | URL): Promise<Response | undefined>;
    put(request: RequestInfo | URL, response: Response): Promise<void>;
};

const edgeCache = () => (caches as unknown as { default: WorkerCache }).default;

function canUseEdgeCache(request: Request): boolean {
    return request.method === 'GET' && !request.headers.has('authorization');
}

function canStoreResponse(response: Response): boolean {
    if (response.status !== 200) return false;
    const cacheControl = response.headers.get('Cloudflare-CDN-Cache-Control')
        ?? response.headers.get('Cache-Control')
        ?? '';
    return /(?:^|,)\s*(?:public|s-maxage=\d+|max-age=[1-9]\d*)/i.test(cacheControl)
        && !/(?:^|,)\s*(?:private|no-store)/i.test(cacheControl)
        && !response.headers.has('set-cookie');
}

function withCacheStatus(response: Response, status: 'HIT' | 'MISS'): Response {
    const headers = new Headers(response.headers);
    headers.set('X-MFX-Cache', status);
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

export function createExports(manifest: SSRManifest) {
    const app = new App(manifest);

    const fetch = async (request: Request, env: WorkerEnv, context: WorkerContext) => {
        (globalThis as typeof globalThis & { __MFX_WORKER_ENV__?: WorkerEnv }).__MFX_WORKER_ENV__ = env;
        const useCache = canUseEdgeCache(request);
        const cacheKey = useCache ? new Request(request.url, { method: 'GET' }) : null;

        if (cacheKey) {
            const cached = await edgeCache().match(cacheKey);
            if (cached) return withCacheStatus(cached, 'HIT');
        }

        const response = await handle(manifest, app, request as any, env as any, context as any);
        if (cacheKey && canStoreResponse(response)) {
            context.waitUntil(edgeCache().put(cacheKey, response.clone()));
        }
        return useCache ? withCacheStatus(response, 'MISS') : response;
    };

    const scheduled = async (_controller: unknown, env: WorkerEnv, context: WorkerContext) => {
        (globalThis as typeof globalThis & { __MFX_WORKER_ENV__?: WorkerEnv }).__MFX_WORKER_ENV__ = env;
        const secret = typeof env.CRON_SECRET === 'string' ? env.CRON_SECRET : '';
        if (!secret) {
            console.error('[CRON] CRON_SECRET no está configurado');
            return;
        }

        const request = new Request('https://www.madridfemeninoxtra.com/api/newsletter/weekly', {
            method: 'POST',
            headers: { Authorization: `Bearer ${secret}` },
        });
        context.waitUntil(
            handle(manifest, app, request as any, env as any, context as any).then(async (response) => {
                if (!response.ok) console.error('[CRON] Newsletter semanal:', response.status, await response.text());
            }),
        );
    };

    return { default: { fetch, scheduled } };
}
