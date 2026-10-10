import type { APIRoute } from 'astro';
import { getAnalyticsDbClient } from '../../../db/client';

export const prerender = false;
const response = (status: number) => new Response(null, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

/**
 * Client-confirmed article views: no SELECTs, no cookies and no identifiers sent
 * to the database. The browser deduplicates each article for 24 hours.
 */
export const POST: APIRoute = async ({ request, url }) => {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return response(415);
  const origin = request.headers.get('origin');
  if (!origin || origin !== url.origin) return response(403);
  if (/bot|crawler|spider|preview|facebookexternalhit|twitterbot/i.test(request.headers.get('user-agent') ?? '')) return response(204);
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 512) return response(413);

  let slug: unknown;
  try {
    const body = await request.text();
    if (body.length > 512) return response(413);
    slug = JSON.parse(body)?.slug;
  } catch {
    return response(400);
  }
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) return response(400);

  try {
    const db = await getAnalyticsDbClient();
    if (!db) return response(503);
    await db.execute({
      sql: `INSERT INTO article_views (slug, views, updated_at)
            VALUES (?, 1, datetime('now'))
            ON CONFLICT (slug) DO UPDATE SET views = views + 1, updated_at = datetime('now')`,
      args: [slug],
    });
    return response(204);
  } catch (error) {
    console.error('[NEWS VIEWS] Unable to record view:', error);
    return response(503);
  }
};
