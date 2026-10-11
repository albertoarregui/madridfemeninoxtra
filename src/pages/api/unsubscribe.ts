import type { APIRoute } from 'astro';
import { getAnalyticsDbClient } from '../../db/client';

export const prerender = false;
const canonical = 'https://www.madridfemeninoxtra.com';
const validToken = (s: string | null): s is string => !!s && /^[a-f0-9]{64}$/.test(s);
const html = (message: string, form = '') => new Response(
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Gestionar newsletter | Madrid Femenino Xtra</title></head>
  <body style="margin:0;min-height:100vh;background:#060d1c;color:#e9edf4;font-family:Arial,sans-serif;display:grid;place-items:center">
  <main style="max-width:450px;margin:24px;padding:32px;border:1px solid #896e38;border-radius:12px;background:#101b2f">
  <h1 style="color:#d4a843;font-size:22px">Madrid Femenino Xtra</h1><p style="line-height:1.7">${message}</p>${form}
  <a style="color:#d4a843" href="/">Volver a la web</a></main></body></html>`,
  { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
);
export const GET: APIRoute = ({ request }) => {
  const token = new URL(request.url).searchParams.get('token');
  if (!validToken(token)) return html('El enlace de baja no es válido.');
  return html('¿Quieres cancelar tu suscripción a las comunicaciones de Madrid Femenino Xtra?',
    `<form method="POST" style="margin:25px 0"><input type="hidden" name="token" value="${token}"><button style="cursor:pointer;border:0;background:#d4a843;color:#0d1629;padding:13px 24px;border-radius:5px;font-weight:bold" type="submit">Confirmar baja</button></form>`);
};
export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return new Response('Forbidden', { status: 403 });
  let form: FormData;
  try { form = await request.formData(); } catch { return new Response('Bad Request', { status: 400 }); }
  const token = String(form.get('token') || '');
  if (!validToken(token)) return html('El enlace de baja no es válido.');
  try {
    const db = await getAnalyticsDbClient();
    if (!db) return html('No se pudo tramitar la baja. Inténtalo de nuevo.');
    await db.execute({ sql: 'DELETE FROM newsletter_subscribers WHERE unsubscribe_token = ?', args: [token] });
    return html('Tu suscripción se ha cancelado. No recibirás más comunicaciones del boletín.');
  } catch (err) {
    console.error('[unsubscribe]', err instanceof Error ? err.message : 'error');
    return html('No se pudo tramitar la baja. Inténtalo de nuevo.');
  }
};
