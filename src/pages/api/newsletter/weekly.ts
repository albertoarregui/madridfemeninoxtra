import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { createHash } from 'node:crypto';
import { madridDate, madridClock, isoDays, mondayAt10Madrid, norm } from '../../../lib/newsletter-time';
import { contentfulClient } from '../../../lib/contentful';
import { getAnalyticsDbClient } from '../../../db/client';

export const prerender = false;
const URL_BASE = 'https://www.madridfemeninoxtra.com';
const CATEGORIES: Record<string, string> = {
  actualidad: 'ACTUALIDAD', noticias: 'ACTUALIDAD', declaraciones: 'ACTUALIDAD', entrevista: 'ACTUALIDAD',
  entrevistas: 'ACTUALIDAD', seleccion: 'ACTUALIDAD', selecciones: 'ACTUALIDAD',
  fichaje: 'FICHAJES', fichajes: 'FICHAJES', mercado: 'FICHAJES',
  cronica: 'CRÓNICAS', cronicas: 'CRÓNICAS', previa: 'CRÓNICAS', uwcl: 'CRÓNICAS',
  cantera: 'LA FÁBRICA', 'la fabrica': 'LA FÁBRICA', 'la fábrica': 'LA FÁBRICA',
  dato: 'DATOS', datos: 'DATOS', estadisticas: 'DATOS', estadistica: 'DATOS',
};
const ORDER = ['ACTUALIDAD', 'FICHAJES', 'CRÓNICAS', 'LA FÁBRICA', 'DATOS'];
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
type Item = { slug:string; title:string; description:string; category:string; date:string; image:string|null };
async function weeklyItems(monday: string): Promise<Item[]> {
  const start = isoDays(monday,-7);
  const response = await contentfulClient.getEntries({
    content_type: 'noticia',
    order: ['-sys.createdAt'] as any,
    limit: 200,
    include: 1,
  });
  const seen = new Set<string>();
  return response.items.flatMap((item: any) => {
    const f=item.fields||{}, raw=String(f.category||''), category=CATEGORIES[norm(raw)];
    const stamp = item.sys.firstPublishedAt || item.sys.publishedAt || item.sys.createdAt;
    if(!category || !stamp || madridDate(new Date(stamp)) < start || madridDate(new Date(stamp)) >= monday) return [];
    if(!f.slug || !f.title || seen.has(String(f.slug))) return [];
    seen.add(String(f.slug));
    const url=f.featuredImage?.fields?.file?.url;
    const image=typeof url==='string' ? (url.startsWith('//')?'https:'+url:url) : null;
    return [{slug:String(f.slug),title:String(f.title),description:String(f.subtitle||'').slice(0,180),category,date:madridDate(new Date(stamp)),image}];
  }).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);
}
function htmlFor(items: Item[], unsub: string, monday:string): string {
  const sections=ORDER.map(category=>{
    const news=items.filter(x=>x.category===category);
    if(!news.length) return '';
    return `<h2 style="font-size:15px;color:#d4a843;letter-spacing:2px;margin:28px 0 12px">${category}</h2>${news.map(n=>`<div style="padding:15px 0;border-bottom:1px solid #d6dbe3">
      ${n.image ? `<img src="${escapeHtml(n.image)}?w=640&fm=webp&q=75" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:8px">`:''}
      <p style="margin:12px 0 5px;font-size:17px;font-weight:700;color:#192640"><a style="color:inherit;text-decoration:none" href="${URL_BASE}/noticias/${encodeURIComponent(n.slug)}">${escapeHtml(n.title)}</a></p>
      ${n.description?`<p style="color:#526174;line-height:1.55;margin:5px 0">${escapeHtml(n.description)}</p>`:''}
      <a href="${URL_BASE}/noticias/${encodeURIComponent(n.slug)}" style="color:#966d22;font-weight:700">Leer noticia →</a>
    </div>`).join('')}`;
  }).join('');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head><body style="margin:0;background:#edf0f5;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:26px;background:white">
    <div style="background:#101b2f;padding:25px;text-align:center;border-bottom:3px solid #d4a843"><p style="color:#d4a843;font-weight:800;letter-spacing:2px">MADRID FEMENINO XTRA</p><h1 style="font-size:27px;color:white">La semana blanca</h1><p style="color:#bbc4d0">Noticias del Real Madrid Femenino</p></div>
    <p style="color:#59657a">Resumen de la semana del ${escapeHtml(isoDays(monday,-7))} al ${escapeHtml(isoDays(monday,-1))}.</p>
    ${sections}
    <p style="font-size:12px;color:#68778c;line-height:1.6;margin-top:30px">Recibes este correo por tu suscripción confirmada a Madrid Femenino Xtra. <a href="${URL_BASE}/api/unsubscribe?token=${encodeURIComponent(unsub)}">Darse de baja</a>.</p>
  </div></body></html>`;
}
export const GET: APIRoute = async ({ request }) => {
  if(process.env.VERCEL_ENV !== 'production') return Response.json({preview:true,scheduled:false,reason:'La newsletter no se ejecuta en vistas previas.'},{status:200});
  const authorization=request.headers.get('authorization');
  const expected=process.env.CRON_SECRET;
  if(!expected || authorization!==`Bearer ${expected}`) return new Response('Unauthorized',{status:401});
  const now=new Date(),monday=madridDate(now);
  if(new Date(monday+'T12:00:00Z').getUTCDay()!==1 || madridClock(now)>=10) return Response.json({skipped:'Fuera de ventana de programación'});
  const schedule=mondayAt10Madrid(monday);
  if(new Date(schedule).getTime() <= now.getTime()+60000) return Response.json({skipped:'Hora de envío demasiado cercana'});
  try {
    const items=await weeklyItems(monday);
    if(!items.length) return Response.json({skipped:'No hay noticias de las cinco categorías'});
    const db=await getAnalyticsDbClient();
    if(!db || !process.env.RESEND_API_KEY) return Response.json({error:'Servicio no disponible'},{status:503});
    await db.execute(`CREATE TABLE IF NOT EXISTS newsletter_weekly_deliveries (
      week_start TEXT NOT NULL, email TEXT NOT NULL, resend_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY(week_start,email))`);
    const subscribers=await db.execute('SELECT email,unsubscribe_token FROM newsletter_subscribers WHERE confirmed_at IS NOT NULL');
    if(subscribers.rows.length===0) return Response.json({skipped:'No hay suscriptores confirmados'});
    const resend=new Resend(process.env.RESEND_API_KEY);
    let queued=0,failed=0;
    for(const row of subscribers.rows) {
      const email=String(row.email||'');
      if(!email || !row.unsubscribe_token) {failed++;continue;}
      const claim=await db.execute({sql:'INSERT OR IGNORE INTO newsletter_weekly_deliveries(week_start,email) VALUES (?,?)',args:[monday,email]});
      if(!claim.rowsAffected) continue;
      const payload={from:'Madrid Femenino Xtra <newsletter@madridfemeninoxtra.com>',to:email,subject:`MFX Weekly · La semana blanca · ${isoDays(monday,-7)}`,html:htmlFor(items,String(row.unsubscribe_token),monday),scheduledAt:schedule};
      const idempotencyKey='mfx-weekly-'+monday+'-'+createHash('sha256').update(email).digest('hex').slice(0,24);
      try {
        const outcome=await resend.emails.send(payload,{idempotencyKey});
        if(outcome.error || !outcome.data?.id) throw Error(outcome.error?.message||'Resend sin identificador');
        await db.execute({sql:'UPDATE newsletter_weekly_deliveries SET resend_id=? WHERE week_start=? AND email=?',args:[outcome.data.id,monday,email]});
        queued++;
      } catch(e) {
        failed++;
        await db.execute({sql:'DELETE FROM newsletter_weekly_deliveries WHERE week_start=? AND email=? AND resend_id IS NULL',args:[monday,email]});
        console.error('[newsletter/weekly] Envío no programado',e instanceof Error?e.message:'error');
      }
    }
    return Response.json({scheduledFor:schedule,week:monday,stories:items.length,queued,failed});
  }catch(e) {
    console.error('[newsletter/weekly]',e instanceof Error?e.message:'error');
    return Response.json({error:'Error preparando el resumen'},{status:500});
  }
};
