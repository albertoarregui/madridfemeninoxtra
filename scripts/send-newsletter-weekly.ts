import { createClient as createContentfulClient } from 'contentful';
import { createClient as createTursoClient } from '@libsql/client';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CONTENTFUL_SPACE_ID  = process.env.CONTENTFUL_SPACE_ID!;
const CONTENTFUL_TOKEN     = process.env.CONTENTFUL_ACCESS_TOKEN!;
const TURSO_URL            = process.env.TURSO_NEWS_DATABASE_URL!;
const TURSO_TOKEN          = process.env.TURSO_NEWS_AUTH_TOKEN!;
const RESEND_API_KEY       = process.env.RESEND_API_KEY!;

if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_TOKEN || !TURSO_URL || !TURSO_TOKEN || !RESEND_API_KEY) {
    console.error('[weekly] Faltan variables de entorno');
    process.exit(1);
}

function getLastWeekRange(): { from: string; to: string } {
    const now   = new Date();
    const day   = now.getDay(); // 0=dom, 1=lun ... 6=sáb
    const diffToLastMonday = day === 0 ? 6 : day - 1;

    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - diffToLastMonday - 7);
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    return {
        from: lastMonday.toISOString(),
        to:   lastSunday.toISOString(),
    };
}

async function fetchNoticias(category: string, limit: number, from: string, to: string): Promise<any[]> {
    const contentful = createContentfulClient({ space: CONTENTFUL_SPACE_ID, accessToken: CONTENTFUL_TOKEN });
    const entries = await contentful.getEntries({
        content_type:            'noticia',
        'fields.category':       category,
        'sys.createdAt[gte]':    from,
        'sys.createdAt[lte]':    to,
        order:                   ['-sys.createdAt'] as any,
        limit,
    });
    return entries.items.map((item: any) => ({
        title:     item.fields.title     ?? '',
        subtitle:  item.fields.subtitle  ?? '',
        slug:      item.fields.slug      ?? '',
        category:  item.fields.category  ?? '',
        imageUrl:  item.fields.featuredImage?.fields?.file?.url
            ? `https:${item.fields.featuredImage.fields.file.url}?fm=webp&w=560&h=320&q=80&fit=fill`
            : null,
    }));
}

function articleCard(n: { title: string; subtitle: string; slug: string; imageUrl: string | null }): string {
    const url = `https://www.madridfemeninoxtra.com/noticias/${n.slug}`;
    const img = n.imageUrl
        ? `<img src="${n.imageUrl}" alt="${n.title}" width="520" style="width:100%;border-radius:8px;display:block;margin-bottom:12px;">`
        : '';
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-bottom:1px solid #f0f0f0;padding-bottom:20px;">
      <tr><td>
        ${img}
        <p style="margin:0 0 6px;font-family:'Arial Black',Arial,sans-serif;font-size:17px;font-weight:900;color:#151e42;line-height:1.2;">${n.title}</p>
        ${n.subtitle ? `<p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:14px;color:#666;line-height:1.5;">${n.subtitle}</p>` : ''}
        <a href="${url}" style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#151e42;text-decoration:none;border-bottom:2px solid #ffde59;">Leer más →</a>
      </td></tr>
    </table>`;
}

function sectionBlock(label: string, items: any[]): string {
    if (!items.length) return '';
    return `
    <tr><td style="padding:0 0 8px;">
      <p style="margin:0 0 16px;font-family:'Arial Black',Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:2px;color:#ffde59;background:#151e42;display:inline-block;padding:4px 14px;border-radius:50px;">${label}</p>
      ${items.map(articleCard).join('')}
    </td></tr>`;
}

function buildEmail(actualidad: any[], cronicas: any[], datos: any[], unsubToken: string): string {
    const unsubUrl = `https://www.madridfemeninoxtra.com/api/unsubscribe?token=${unsubToken}`;
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:24px 40px;background:#151e42;text-align:center;border-bottom:3px solid #ffde59;">
            <a href="https://www.madridfemeninoxtra.com" style="text-decoration:none;">
              <p style="margin:0;font-family:'Arial Black',Arial,sans-serif;font-size:20px;font-weight:900;color:#ffde59;letter-spacing:2px;">MADRID FEMENINO XTRA</p>
            </a>
            <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);">Resumen semanal</p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:32px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${sectionBlock('ACTUALIDAD', actualidad)}
            ${sectionBlock('CRÓNICAS', cronicas)}
            ${sectionBlock('DATOS', datos)}
          </table>
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f7f7f7;border-top:1px solid #eee;text-align:center;">
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

async function main() {
    const { from, to } = getLastWeekRange();
    console.log(`[weekly] Rango: ${from} → ${to}`);

    const [actualidad, cronicas, datos] = await Promise.all([
        fetchNoticias('ACTUALIDAD', 5, from, to),
        fetchNoticias('CRÓNICA',    10, from, to),
        fetchNoticias('DATO',       3,  from, to),
    ]);

    const total = actualidad.length + cronicas.length + datos.length;
    console.log(`[weekly] Noticias: ${actualidad.length} actualidad, ${cronicas.length} crónicas, ${datos.length} datos`);

    if (total === 0) {
        console.log('[weekly] Sin noticias esta semana. No se envía nada.');
        return;
    }

    const db = createTursoClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
    const rows = await db.execute(
        `SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE confirmed_at IS NOT NULL`
    );

    if (rows.rows.length === 0) {
        console.log('[weekly] Sin suscriptores confirmados.');
        return;
    }

    const resend = new Resend(RESEND_API_KEY);
    let sent = 0;

    const subscribers = rows.rows as { email: string; unsubscribe_token: string }[];
    for (let i = 0; i < subscribers.length; i += 50) {
        const batch = subscribers.slice(i, i + 50);
        await Promise.all(batch.map(({ email, unsubscribe_token }) =>
            resend.emails.send({
                from:    'Madrid Femenino Xtra <newsletter@madridfemeninoxtra.com>',
                to:      email,
                subject: 'Resumen semanal · Madrid Femenino Xtra',
                html:    buildEmail(actualidad, cronicas, datos, unsubscribe_token),
            }).then(() => { sent++; })
              .catch(e => console.error(`[weekly] Error → ${email}:`, e))
        ));
    }

    console.log(`[weekly] Enviado a ${sent}/${subscribers.length} suscriptores.`);
}

main().catch(e => { console.error('[weekly] Error fatal:', e); process.exit(1); });
