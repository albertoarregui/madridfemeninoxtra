import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const secret = new URL(request.url).searchParams.get('secret');
    if (secret !== process.env.NEWSLETTER_WEBHOOK_SECRET) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: any;
    try {
        payload = await request.json();
    } catch {
        return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const contentType = payload?.sys?.contentType?.sys?.id;
    if (contentType !== 'noticia') {
        return Response.json({ skipped: true });
    }

    const fields = payload?.fields ?? {};
    const title      = fields.title?.['es-ES']      ?? fields.title?.['en-US']      ?? '';
    const subtitle   = fields.subtitle?.['es-ES']   ?? fields.subtitle?.['en-US']   ?? '';
    const slug       = fields.slug?.['es-ES']        ?? fields.slug?.['en-US']       ?? '';
    const category   = fields.category?.['es-ES']   ?? fields.category?.['en-US']   ?? '';
    const imageUrl   = fields.featuredImage?.['es-ES']?.fields?.file?.url
        ? `https:${fields.featuredImage['es-ES'].fields.file.url}?fm=webp&w=600&h=380&q=80&fit=fill`
        : null;

    if (!slug) return Response.json({ skipped: true, reason: 'no slug' });

    const articleUrl = `https://www.madridfemeninoxtra.com/noticias/${slug}`;

    try {
        const { getAnalyticsDbClient } = await import('../../../db/client');
        const db = await getAnalyticsDbClient();
        if (!db) return Response.json({ error: 'DB no disponible' }, { status: 500 });

        const rows = await db.execute(
            `SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE confirmed_at IS NOT NULL`
        );

        if (rows.rows.length === 0) {
            return Response.json({ sent: 0 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        let sent = 0;

        const subscribers = rows.rows as { email: string; unsubscribe_token: string }[];
        for (let i = 0; i < subscribers.length; i += 50) {
            const batch = subscribers.slice(i, i + 50);
            await Promise.all(batch.map(({ email, unsubscribe_token }) =>
                resend.emails.send({
                    from: 'Madrid Femenino Xtra <newsletter@madridfemeninoxtra.com>',
                    to: email,
                    subject: title,
                    html: newsletterEmail({ title, subtitle, category, imageUrl, articleUrl, unsubToken: unsubscribe_token }),
                }).then(() => { sent++; }).catch(e => console.error(`[newsletter] Error sending to ${email}:`, e))
            ));
        }

        console.log(`[newsletter] Sent to ${sent}/${subscribers.length} subscribers`);
        return Response.json({ sent });
    } catch (e) {
        console.error('[newsletter/send]', e);
        return Response.json({ error: 'Error interno' }, { status: 500 });
    }
};

function newsletterEmail({ title, subtitle, category, imageUrl, articleUrl, unsubToken }: {
    title: string;
    subtitle: string;
    category: string;
    imageUrl: string | null;
    articleUrl: string;
    unsubToken: string;
}): string {
    const unsubUrl = `https://www.madridfemeninoxtra.com/api/unsubscribe?token=${unsubToken}`;
    const imgBlock = imageUrl
        ? `<img src="${imageUrl}" alt="${title}" width="560" style="width:100%;border-radius:12px;display:block;margin-bottom:24px;">`
        : '';

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:24px 40px;background:#151e42;text-align:center;border-bottom:3px solid #ffde59;">
            <a href="https://www.madridfemeninoxtra.com" style="text-decoration:none;">
              <p style="margin:0;font-family:'Arial Black',Arial,sans-serif;font-size:20px;font-weight:900;color:#ffde59;letter-spacing:2px;">MADRID FEMENINO XTRA</p>
            </a>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${category ? `<p style="margin:0 0 12px;font-size:12px;font-weight:900;letter-spacing:2px;color:#ffde59;background:#151e42;display:inline-block;padding:4px 14px;border-radius:50px;">${category.toUpperCase()}</p><br><br>` : ''}
            ${imgBlock}
            <h1 style="margin:0 0 16px;color:#151e42;font-size:26px;font-weight:900;line-height:1.2;">${title}</h1>
            ${subtitle ? `<p style="margin:0 0 32px;color:#555;font-size:16px;line-height:1.6;">${subtitle}</p>` : ''}
            <a href="${articleUrl}" style="display:inline-block;background:#ffde59;color:#151e42;text-decoration:none;font-weight:900;font-size:15px;padding:14px 36px;border-radius:50px;letter-spacing:1px;">
              LEER ARTÍCULO →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#f7f7f7;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;line-height:1.6;">
              Recibes este email porque te suscribiste a Madrid Femenino Xtra.<br>
              <a href="${unsubUrl}" style="color:#aaa;">Darse de baja</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
