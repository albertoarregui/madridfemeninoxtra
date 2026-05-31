import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    const src = url.searchParams.get('url');
    if (!src) return new Response('Missing url', { status: 400 });

    try {
        const parsed = new URL(src);
        if (!parsed.hostname.endsWith('madridfemeninoxtra.com') && parsed.hostname !== 'localhost') {
            return new Response('Forbidden', { status: 403 });
        }
    } catch {
        return new Response('Invalid url', { status: 400 });
    }

    try {
        const res = await fetch(src);
        if (!res.ok) return new Response('Upstream error', { status: 502 });
        const buf = await res.arrayBuffer();
        const ct = res.headers.get('content-type') ?? 'image/jpeg';
        return new Response(buf, {
            headers: {
                'Content-Type': ct,
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch {
        return new Response('Fetch error', { status: 502 });
    }
};
