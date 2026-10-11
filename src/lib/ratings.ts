import { getPlayersDbClient, getAnalyticsDbClient } from '../db/client';
import { getCurrentSeason } from '../utils/season';

export type RatingMatch = {
 id:number; fecha:string; hora:string; club_local:string; club_visitante:string;
 local_foto_url:string|null; visitante_foto_url:string|null; competicion:string; competicion_foto_url:string|null;
 goles_rm:number; goles_rival:number; entrenador_id:number|null; entrenador_nombre:string|null; entrenador_foto_url:string|null;
};
export type RatingPerson = { id:number; name:string; position:string; minutes:number; number:string; image:string|null; titular:boolean; coach:boolean };
export type RatingAggregate = { id:number; average:number|null; count:number; mvpVotes:number };
const BASE_MATCH = `SELECT p.id_partido AS id, p.fecha, p.hora, cl.nombre AS club_local,cv.nombre AS club_visitante,
 cl.foto_url AS local_foto_url,cv.foto_url AS visitante_foto_url,
 c.competicion, c.foto_url AS competicion_foto_url,
 p.goles_rm,p.goles_rival, p.id_entrenador AS entrenador_id,
 en.nombre AS entrenador_nombre,en.foto_url AS entrenador_foto_url
 FROM partidos p
 LEFT JOIN clubes cl ON cl.id_club=p.id_club_local
 LEFT JOIN clubes cv ON cv.id_club=p.id_club_visitante
 LEFT JOIN competiciones c ON c.id_competicion=p.id_competicion
 LEFT JOIN entrenadores en ON en.id_entrenador=p.id_entrenador
 JOIN temporadas t ON t.id_temporada=p.id_temporada
 WHERE p.goles_rm IS NOT NULL AND p.goles_rival IS NOT NULL AND t.temporada=?`;
function asMatch(row:any):RatingMatch {return {
 id:Number(row.id),fecha:String(row.fecha||''),hora:String(row.hora||''),club_local:String(row.club_local||''),
 club_visitante:String(row.club_visitante||''),local_foto_url:row.local_foto_url?String(row.local_foto_url):null,
 visitante_foto_url:row.visitante_foto_url?String(row.visitante_foto_url):null,competicion:String(row.competicion||''),
 competicion_foto_url:row.competicion_foto_url?String(row.competicion_foto_url):null,
 goles_rm:Number(row.goles_rm),goles_rival:Number(row.goles_rival),
 entrenador_id:row.entrenador_id===null?null:Number(row.entrenador_id),
 entrenador_nombre:row.entrenador_nombre?String(row.entrenador_nombre):null,
 entrenador_foto_url:row.entrenador_foto_url?String(row.entrenador_foto_url):null
};}
export async function recentRatingMatches(limit=100):Promise<RatingMatch[]> {
 const db=await getPlayersDbClient(); if(!db)return[];
 const r=await db.execute({
  sql:BASE_MATCH+' ORDER BY p.fecha DESC, p.hora DESC LIMIT ?',
  args:[getCurrentSeason(),Math.max(1,Math.min(100,limit))]
 });
 return r.rows.map(asMatch);
}
export async function ratingMatch(id:number):Promise<RatingMatch|null> {
 const db=await getPlayersDbClient(); if(!db)return null;
 const r=await db.execute({sql:BASE_MATCH+' AND p.id_partido=? LIMIT 1',args:[getCurrentSeason(),id]});
 return r.rows[0]?asMatch(r.rows[0]):null;
}
export async function ratingPeople(id:number):Promise<RatingPerson[]> {
 const db=await getPlayersDbClient();if(!db)return[];
 const result=await db.execute({sql:`SELECT a.id_jugadora AS id, j.nombre, j.posicion,a.minutos_jugados,a.titular,
 a.minuto_entrada,a.minuto_salida,d.dorsal,d.foto_perfil_url,d.foto_url
 FROM alineaciones a JOIN jugadoras j ON a.id_jugadora=j.id_jugadora
 JOIN partidos p ON p.id_partido=a.id_partido
 LEFT JOIN dorsales d ON d.id_jugadora=a.id_jugadora AND d.id_temporada=p.id_temporada
 WHERE a.id_partido=? AND (a.titular=1 OR COALESCE(a.minutos_jugados,0)>0 OR (a.minuto_entrada IS NOT NULL AND CAST(a.minuto_entrada AS INTEGER)>0))
 ORDER BY a.titular DESC, CAST(d.dorsal AS INTEGER),j.nombre`,args:[id]});
 const unique=new Map<number,RatingPerson>();
 for(const x of result.rows) {
   const playerId=Number(x.id);if(!unique.has(playerId))
   unique.set(playerId,{id:playerId,name:String(x.nombre||''),position:String(x.posicion||''),
    number:String(x.dorsal||''),minutes:Number(x.minutos_jugados||0),
    titular:Number(x.titular||0)===1,coach:false,image:x.foto_perfil_url?String(x.foto_perfil_url):x.foto_url?String(x.foto_url):null});
 }
 return Array.from(unique.values());
}
export function startTimeUTC(m:RatingMatch):number {
 const time=/^\d{1,2}:\d{2}/.test(m.hora)?m.hora.slice(0,5):'20:00';
 const guess=Date.parse(m.fecha+'T'+time+':00Z');
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess));
 const part=(key:string)=>Number(parts.find(x=>x.type===key)?.value);
 const localEpoch=Date.UTC(part('year'),part('month')-1,part('day'),part('hour'),part('minute'));
 return guess-(localEpoch-guess);
}
export function ratingsOpen(m:RatingMatch):boolean {
 const opening = startTimeUTC(m) + 2 * 60 * 60 * 1000;
 return Date.now() >= opening && Date.now() < opening + 72 * 60 * 60 * 1000;
}
export function ratingHref(m:RatingMatch):string {
 const slug=(m.club_local+'-vs-'+m.club_visitante).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 return '/valoraciones/'+m.id+'-'+slug+'-'+m.fecha;
}
export async function ratingSummary(id:number):Promise<RatingAggregate[]> {
 const db=await getAnalyticsDbClient();if(!db)return[];
 try {
  const r=await db.execute({sql:`SELECT subject_id AS id, ROUND(AVG(score),1) AS average, COUNT(*) AS count,
 SUM(CASE WHEN is_mvp=1 THEN 1 ELSE 0 END) AS mvpVotes
 FROM match_reader_ratings WHERE match_id=? GROUP BY subject_id`,args:[id]});
  return r.rows.map(x=>({id:Number(x.id),average:x.average===null?null:Number(x.average),
   count:Number(x.count),mvpVotes:Number(x.mvpVotes||0)}));
 }catch(e){if(String(e).includes('no such table'))return[];throw e;}
}
export async function ensureRatingsTable() {
 const db=await getAnalyticsDbClient();if(!db)throw Error('Analytics unavailable');
 await db.execute(`CREATE TABLE IF NOT EXISTS match_reader_ratings (
 match_id INTEGER NOT NULL, user_id TEXT NOT NULL, subject_id INTEGER NOT NULL,
 score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 10),
 is_mvp INTEGER NOT NULL DEFAULT 0 CHECK(is_mvp IN (0,1)),
 updated_at TEXT NOT NULL DEFAULT (datetime('now')),
 PRIMARY KEY(match_id,user_id,subject_id)
 )`);
 await db.execute('CREATE INDEX IF NOT EXISTS idx_reader_ratings_match ON match_reader_ratings(match_id)');
 return db;
}
