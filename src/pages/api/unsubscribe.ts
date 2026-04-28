import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    const token = new URL(request.url).searchParams.get('token');
    if (!token) return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=error', 302);

    try {
        const { getAnalyticsDbClient } = await import('../../db/client');
        const db = await getAnalyticsDbClient();
        if (!db) return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=error', 302);

        await db.execute({
            sql: 'DELETE FROM newsletter_subscribers WHERE unsubscribe_token = ?',
            args: [token],
        });

        return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=unsubscribed', 302);
    } catch (e) {
        console.error('[unsubscribe]', e);
        return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=error', 302);
    }
};
