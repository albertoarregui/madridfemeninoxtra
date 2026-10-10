import type { APIRoute } from 'astro';
import { createHash, randomBytes } from 'node:crypto';
import { getAnalyticsDbClient } from '../../../db/client';

export const prerender = false;

// Bounded, per-instance throttle. It prevents repeated client retries from
// becoming a burst of writes. No Turso SELECT and no persistent user tracking.
const recent = new Map<string, number>();
const ephemeralSalt = randomBytes(16).toString('hex');
const MIN_INTERVAL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 5_000;
function throttle(key: string, now: number): boolean {
  const last = recent.get(key);
  if (last && now - last < MIN_INTERVAL_MS) return false;
  if (recent.size >= MAX_ENTRIES) {
    for (const [k, t] of recent) {
      if (now - t >= MIN_INTERVAL_MS) recent.delete(k);
    }
    while (recent.size >= MAX_ENTRIES) recent.delete(recent.keys().next().value!);
  }
  recent.set(key, now);
  return true;
}
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

  // Same visitor/article requests within ten minutes are coalesced.
  const address = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
  const key = createHash('sha256').update(ephemeralSalt).update(address).update(':').update(slug).digest('hex');
  if (!throttle(key, Date.now())) return response(204);

  try {
    const db = await getAnalyticsDbClient();
    if (!db) {
      recent.delete(key);
      return response(503);
    }
    await db.execute({
      sql: `INSERT INTO article_views (slug, views, updated_at)
            VALUES (?, 1, datetime('now'))
            ON CONFLICT (slug) DO UPDATE SET views = views + 1, updated_at = datetime('now')`,
      args: [slug],
    });
    return response(204);
  } catch (error) {
    recent.delete(key);
    console.error('[NEWS VIEWS] Unable to record view:', error);
    return response(503);
  }
};
