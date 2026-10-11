import type { APIRoute } from 'astro';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { Resend } from 'resend';
import { getAnalyticsDbClient } from '../../../db/client';

export const prerender = false;

// Limitador por instancia, defensivo. No persiste IPs ni genera SELECTs en Turso.
const recent = new Map<string, number>();
const MIN_INTERVAL_MS = 90_000;
function rateLimited(key: string): boolean {
  const now = Date.now();
  for (const [k, last] of recent) if (now - last > MIN_INTERVAL_MS) recent.delete(k);
  if (recent.size > 2000) recent.clear();
  const last = recent.get(key);
  if (last && now - last < MIN_INTERVAL_MS) return true;
  recent.set(key, now);
  return false;
}

const reply = (status: number, message: string) => Response.json({ message }, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

function safeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export const POST: APIRoute = async ({ request, url }) => {
  if (request.headers.get('origin') !== url.origin) return reply(403, 'Origen no permitido');
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply(415, 'Formato no admitido');
  if (Number(request.headers.get('content-length') || 0) > 1024) return reply(413, 'Solicitud demasiado grande');
  let body: any;
  try {
    const raw = await request.text();
    if (raw.length > 1024) return reply(413, 'Solicitud demasiado grande');
    body = JSON.parse(raw);
  } catch {
    return reply(400, 'Datos no válidos');
  }
  const email = String(body?.email || '').trim().toLowerCase();
  if (body?.website) return reply(200, 'Solicitud recibida');
  if (body?.consent !== true) return reply(400, 'Debes aceptar recibir comunicaciones');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, 'Correo no válido');

  const salt = process.env.NEWSLETTER_WEBHOOK_SECRET || 'mfx';
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const fingerprint = createHash('sha256').update(salt + ip + email).digest('hex');
  if (rateLimited(fingerprint)) return reply(429, 'Espera antes de volver a intentarlo');

  if (!process.env.RESEND_API_KEY) return reply(503, 'Newsletter temporalmente no disponible');
  try {
    const db = await getAnalyticsDbClient();
    if (!db) return reply(503, 'Newsletter temporalmente no disponible');
    const existing = await db.execute({
      sql: 'SELECT confirm_token, confirmed_at, created_at FROM newsletter_subscribers WHERE email = ? LIMIT 1',
      args: [email],
    });
    const row = existing.rows[0] as any;
    if (row?.confirmed_at) return reply(200, 'Solicitud recibida');
    const token = row ? String(row.confirm_token) : randomBytes(32).toString('hex');
    if (row) {
      const ago = Date.now() - Date.parse(String(row.created_at).replace(' ', 'T') + 'Z');
      if (Number.isFinite(ago) && ago < 15 * 60 * 1000) return reply(200, 'Solicitud recibida');
      await db.execute({ sql: "UPDATE newsletter_subscribers SET created_at = datetime('now') WHERE email = ? AND confirmed_at IS NULL", args: [email] });
    } else {
      const insert = await db.execute({
        sql: 'INSERT OR IGNORE INTO newsletter_subscribers (id, email, confirm_token, unsubscribe_token) VALUES (?, ?, ?, ?)',
        args: [randomUUID(), email, token, randomBytes(32).toString('hex')],
      });
      if (!insert.rowsAffected) return reply(200, 'Solicitud recibida');
    }
    const confirmation = new URL('/api/confirm', url.origin);
    confirmation.searchParams.set('token', token);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'Madrid Femenino Xtra <newsletter@madridfemeninoxtra.com>',
      to: email,
      subject: 'Confirma tu suscripción a Madrid Femenino Xtra',
      html: `<div style="background:#0c1628;color:#e8edf5;padding:32px;font-family:Arial,sans-serif;max-width:540px;margin:0 auto">
        <h1 style="color:#d4a843;font-size:22px">Madrid Femenino Xtra</h1>
        <p>Gracias por tu interés. Para recibir nuestras noticias y análisis, confirma tu dirección de correo electrónico.</p>
        <p><a href="${safeHtml(confirmation.toString())}" style="display:inline-block;background:#d4a843;color:#091020;padding:13px 19px;border-radius:6px;text-decoration:none;font-weight:bold">Confirmar suscripción</a></p>
        <p style="font-size:12px;color:#adbac9">Si no solicitaste esta suscripción, ignora este mensaje. No te enviaremos newsletter sin confirmación.</p>
      </div>`,
    });
    if (result.error) {
      console.error('[newsletter/subscribe] Fallo de envío de confirmación:', result.error.name);
      return reply(503, 'No se pudo enviar la confirmación');
    }
    return reply(200, 'Comprueba tu correo para confirmar la suscripción');
  } catch (error) {
    console.error('[newsletter/subscribe] Error de suscripción', error instanceof Error ? error.message : 'unknown');
    return reply(503, 'Newsletter temporalmente no disponible');
  }
};
