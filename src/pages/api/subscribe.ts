import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json().catch(() => null);
    const email = (body?.email ?? '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: 'Email inválido' }, { status: 400 });
    }

    try {
        const { getAnalyticsDbClient } = await import('../../db/client');
        const db = await getAnalyticsDbClient();
        if (!db) return Response.json({ error: 'DB no disponible' }, { status: 500 });

        const existing = await db.execute({
            sql: 'SELECT confirmed_at FROM newsletter_subscribers WHERE email = ?',
            args: [email],
        });

        if (existing.rows.length > 0) {
            if (existing.rows[0].confirmed_at) {
                return Response.json({ error: 'already_subscribed' }, { status: 409 });
            }
        } else {
            const id = crypto.randomUUID();
            const confirmToken = crypto.randomUUID();
            const unsubToken = crypto.randomUUID();
            await db.execute({
                sql: `INSERT INTO newsletter_subscribers (id, email, confirm_token, unsubscribe_token)
                      VALUES (?, ?, ?, ?)`,
                args: [id, email, confirmToken, unsubToken],
            });
        }

        const tokenRow = await db.execute({
            sql: 'SELECT confirm_token FROM newsletter_subscribers WHERE email = ?',
            args: [email],
        });
        const confirmToken = tokenRow.rows[0].confirm_token as string;
        const confirmUrl = `https://www.madridfemeninoxtra.com/api/confirm?token=${confirmToken}`;

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Madrid Femenino Xtra <newsletter@madridfemeninoxtra.com>',
            to: email,
            subject: 'Confirma tu suscripción a Madrid Femenino Xtra',
            html: confirmationEmail(confirmUrl),
        });

        return Response.json({ ok: true });
    } catch (e) {
        console.error('[subscribe]', e);
        return Response.json({ error: 'Error interno' }, { status: 500 });
    }
};

function confirmationEmail(confirmUrl: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#151e42;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="padding:32px 40px;text-align:center;border-bottom:3px solid #ffde59;">
            <p style="margin:0;font-family:'Arial Black',Arial,sans-serif;font-size:22px;font-weight:900;color:#ffde59;letter-spacing:2px;">MADRID FEMENINO XTRA</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;text-align:center;">
            <h1 style="margin:0 0 16px;color:#ffffff;font-size:28px;font-weight:900;">¡Ya casi estás!</h1>
            <p style="margin:0 0 32px;color:rgba(255,255,255,0.75);font-size:16px;line-height:1.6;">
              Confirma tu suscripción para recibir las últimas noticias del Real Madrid Femenino.
            </p>
            <a href="${confirmUrl}" style="display:inline-block;background:#ffde59;color:#151e42;text-decoration:none;font-weight:900;font-size:16px;padding:16px 40px;border-radius:50px;letter-spacing:1px;">
              CONFIRMAR SUSCRIPCIÓN
            </a>
            <p style="margin:32px 0 0;color:rgba(255,255,255,0.4);font-size:13px;">
              Si no solicitaste esta suscripción, ignora este email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
