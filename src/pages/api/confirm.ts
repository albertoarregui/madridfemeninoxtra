import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    const token = new URL(request.url).searchParams.get('token');
    if (!token) return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=error', 302);

    try {
        const { getAnalyticsDbClient } = await import('../../db/client');
        const db = await getAnalyticsDbClient();
        if (!db) return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=error', 302);

        const result = await db.execute({
            sql: `UPDATE newsletter_subscribers
                  SET confirmed_at = datetime('now')
                  WHERE confirm_token = ? AND confirmed_at IS NULL`,
            args: [token],
        });

        if (result.rowsAffected === 0) {
            return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=already', 302);
        }

        return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=confirmed', 302);
    } catch (e) {
        console.error('[confirm]', e);
        return Response.redirect('https://www.madridfemeninoxtra.com/?newsletter=error', 302);
    }
};
