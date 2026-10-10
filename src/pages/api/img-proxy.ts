import type { APIRoute } from 'astro';
import {
  MAX_PROXY_IMAGE_BYTES,
  permittedImageResponseType,
  permittedImageSource,
} from '../../lib/image-proxy-policy';

export const prerender = false;

const errorResponse = (message: string, status: number) => new Response(message, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

export const GET: APIRoute = async ({ url }) => {
  const src = url.searchParams.get('url');
  if (!src) return errorResponse('Missing url', 400);

  const source = permittedImageSource(src);
  if (!source) return errorResponse('Forbidden source', 403);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const upstream = await fetch(source.href, {
      redirect: 'error',
      signal: controller.signal,
      headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif' },
    });
    if (!upstream.ok || !permittedImageResponseType(upstream.headers.get('content-type'))) {
      return errorResponse('Invalid upstream image', 502);
    }
    const advertised = Number(upstream.headers.get('content-length') || 0);
    if (advertised > MAX_PROXY_IMAGE_BYTES) return errorResponse('Image too large', 413);
    if (!upstream.body) return errorResponse('Empty upstream image', 502);

    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PROXY_IMAGE_BYTES) {
        await reader.cancel();
        return errorResponse('Image too large', 413);
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new Response(bytes, {
      headers: {
        'Content-Type': upstream.headers.get('content-type')!,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return errorResponse('Image unavailable', 502);
  } finally {
    clearTimeout(timeout);
  }
};
