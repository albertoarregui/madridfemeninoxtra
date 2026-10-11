import type { APIRoute } from 'astro';
import { ratingMatch, ratingPeople, ratingSummary, ratingsOpen, ensureRatingsTable } from '../../../lib/ratings';
import { getAnalyticsDbClient } from '../../../db/client';
export const prerender = false;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const validId=(str:string|undefined)=>/^\d{1,8}$/.test(str||'')?Number(str):null;
const isPreview=()=>process.env.VERCEL_ENV!=='production';
export const GET: APIRoute=async({params,locals})=>{
 const id=validId(params.id);if(!id)return json({error:'Partido no válido'},400);
 const match=await ratingMatch(id);if(!match)return json({error:'Partido no encontrado'},404);
 const [aggregates,people]=await Promise.all([ratingSummary(id),ratingPeople(id)]);
 let own:Record<string,{score:number,mvp:boolean}>={};
 const user=typeof locals.currentUser==='function'?await locals.currentUser():null;
 if(user && !isPreview()){
   try{const db=await getAnalyticsDbClient();const rows=await db?.execute({sql:'SELECT subject_id,score,is_mvp FROM match_reader_ratings WHERE match_id=? AND user_id=?',args:[id,user.id]});
   for(const row of rows?.rows||[])own[String(row.subject_id)]={score:Number(row.score),mvp:Number(row.is_mvp)===1};
   }catch(e){if(!String(e).includes('no such table'))throw e;}
 }
 return json({aggregates,own,open:ratingsOpen(match),preview:isPreview(),loggedIn:!!user,participants:people.length});
};
export const POST: APIRoute=async({request,params,locals,url})=>{
 const id=validId(params.id);if(!id)return json({error:'Partido no válido'},400);
 // Las vistas previas permiten probar la interfaz sin escribir en la base de producción.
 if(isPreview())return json({demo:true,message:'Vista previa: el voto no se guarda hasta publicar en producción.'});
 if(request.headers.get('origin')!==url.origin)return json({error:'Origen no permitido'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Formato incorrecto'},415);
 const user=typeof locals.currentUser==='function'?await locals.currentUser():null;
 if(!user)return json({error:'Inicia sesión para enviar tus valoraciones.'},401);
 const match=await ratingMatch(id);if(!match)return json({error:'Partido no encontrado'},404);
 if(!ratingsOpen(match))return json({error:'La votación de este partido está cerrada.'},403);
 const text=await request.text();if(text.length>2000)return json({error:'Datos demasiado largos'},413);
 let body:any;try{body=JSON.parse(text);}catch{return json({error:'JSON inválido'},400);}
 const scores=body?.scores;if(!Array.isArray(scores)||scores.length>25)return json({error:'Valoraciones no válidas'},400);
 const people=await ratingPeople(id);const allowed=new Set(people.map(x=>x.id));
 if(match.entrenador_id)allowed.add(-match.entrenador_id);
 const used=new Set<number>(),valid:{id:number;score:number;mvp:number}[]=[];
 let mvpCount=0;
 for(const entry of scores){
  const subject=Number(entry?.id),score=Number(entry?.score);
  if(!Number.isInteger(subject)||!allowed.has(subject)||used.has(subject)||!Number.isInteger(score)||score<1||score>10)return json({error:'Puntuación o participante no válido'},400);
  const mvp=entry.mvp===true?1:0;if(mvp && subject < 0)return json({error:'La MVP debe ser una jugadora'},400);
  if(mvp)mvpCount++;
  used.add(subject);valid.push({id:subject,score,mvp});
 }
 if(mvpCount>1)return json({error:'Elige una sola MVP'},400);
 try{
  const db=await ensureRatingsTable();
  const recentVote=await db.execute({sql:'SELECT updated_at FROM match_reader_ratings WHERE match_id=? AND user_id=? LIMIT 1',args:[id,user.id]});
  const lastUpdate=recentVote.rows[0]?.updated_at;
  if(lastUpdate) {
    const then=Date.parse(String(lastUpdate).replace(' ','T')+'Z');
    if(Number.isFinite(then)&&Date.now()-then<20_000)return json({error:'Espera unos segundos antes de modificar tu voto.'},429);
  }
  const statements:any[]=[{sql:'DELETE FROM match_reader_ratings WHERE match_id=? AND user_id=?',args:[id,user.id]}];
  for(const entry of valid)statements.push({sql:'INSERT INTO match_reader_ratings(match_id,user_id,subject_id,score,is_mvp) VALUES(?,?,?,?,?)',args:[id,user.id,entry.id,entry.score,entry.mvp]});
  await db.batch(statements,'write');
  return json({ok:true,aggregates:await ratingSummary(id)});
 }catch(e){console.error('[ratings-save]',e instanceof Error?e.message:'error');return json({error:'No se ha podido guardar el voto'},503);}
};
