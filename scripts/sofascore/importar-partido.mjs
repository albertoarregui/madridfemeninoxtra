#!/usr/bin/env node
// Importa en Turso un partido de Sofascore a partir del paquete JSON que devuelve ChatGPT
// (respuestas en bruto de la API de Sofascore; ver scripts/sofascore/PROMPT_CHATGPT.md).
//
// Uso:  node scripts/sofascore/importar-partido.mjs partido.json [--dry] [--forzar-eventos]
//   --dry              no escribe nada; solo muestra el informe
//   --forzar-eventos   reescribe alineación, goles y tarjetas aunque el partido ya los tenga
//
// Qué hace:
//   - Siempre (reemplaza): tiros, posiciones medias, gráfico de dominio, mapas de calor,
//     estadísticas del partido y de cada jugadora.
//   - Solo si el partido aún no los tiene (o con --forzar-eventos): alineación, goles,
//     goles del rival, autogoles, tarjetas, penaltis fallados y tanda de penaltis.
//   - Rellena hora, formación, público y capitana solo si están vacíos.
//   - Antes de escribir comprueba que los goles de Sofascore cuadran con el resultado.
import fs from 'node:fs';
import { createClient } from '@libsql/client/web';

const RM_TEAM_ID = 305051;
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const DRY = args.includes('--dry');
const FORZAR = args.includes('--forzar-eventos');
if (!file) { console.error('Uso: node scripts/sofascore/importar-partido.mjs partido.json [--dry] [--forzar-eventos]'); process.exit(1); }

const env = { ...process.env };
for (const f of ['.env.vercel', '.env.local', '.env']) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2];
    }
}
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

// ── Lectura del paquete ──────────────────────────────────────────────────────
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const pick = (k, inner) => { const v = raw[k]; return v && inner && v[inner] !== undefined ? v[inner] : v; };
const event = pick('event', 'event');
const statistics = pick('statistics', 'statistics') || [];
const lineups = raw.lineups || {};
const incidents = pick('incidents', 'incidents') || [];
const shotmap = pick('shotmap', 'shotmap') || [];
const avgPos = raw.average_positions || raw['average-positions'] || {};
const graph = pick('graph', 'graphPoints') || [];
const heatmaps = raw.heatmaps || {};
if (!event?.id) { console.error('El paquete no trae "event" con id.'); process.exit(1); }

const rmHome = event.homeTeam?.id === RM_TEAM_ID ? true : event.awayTeam?.id === RM_TEAM_ID ? false : null;
if (rmHome === null) { console.error('El Real Madrid (id 305051) no juega este partido.'); process.exit(1); }
const RM = rmHome ? 'home' : 'away';
const RIV = rmHome ? 'away' : 'home';
const isRm = isHome => (isHome === true) === rmHome;
const fechaMadrid = new Date(event.startTimestamp * 1000).toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' });
const fecha = fechaMadrid.slice(0, 10);
const hora = fechaMadrid.slice(11, 16);
const golesRm = (rmHome ? event.homeScore : event.awayScore)?.current;
const golesRival = (rmHome ? event.awayScore : event.homeScore)?.current;

const informe = [];
const avisos = [];
const stmts = [];
const num = v => (v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const minutoTxt = (t, add) => (t == null ? null : add ? `${t}+${add}` : String(t));
const norm = s => String(s || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

// ── Partido ──────────────────────────────────────────────────────────────────
let partido = (await db.execute({ sql: 'SELECT * FROM partidos WHERE sofascore_id = ?', args: [event.id] })).rows[0];
if (!partido) {
    const cands = (await db.execute({ sql: 'SELECT * FROM partidos WHERE fecha = ?', args: [fecha] })).rows;
    if (cands.length !== 1) { console.error(`No encuentro un único partido con fecha ${fecha} (${cands.length}). Créalo primero en la base de datos.`); process.exit(1); }
    partido = cands[0];
}
const P = partido.id_partido;
informe.push(`Partido ${P} (${fecha}) · Sofascore ${event.id} · ${event.homeTeam.name} ${event.homeScore?.current}-${event.awayScore?.current} ${event.awayTeam.name}`);
if (partido.goles_rm != null && (partido.goles_rm !== golesRm || partido.goles_rival !== golesRival))
    avisos.push(`El resultado de la BD (${partido.goles_rm}-${partido.goles_rival}) no coincide con Sofascore (${golesRm}-${golesRival}).`);

// ── Jugadoras del Madrid: emparejar con la tabla jugadoras ───────────────────
const plantilla = (await db.execute({
    sql: `SELECT DISTINCT j.id_jugadora, j.nombre, j.sofascore_id FROM jugadoras j
          WHERE j.id_jugadora IN (SELECT id_jugadora FROM dorsales WHERE id_temporada = ?)
             OR j.id_jugadora IN (SELECT id_jugadora FROM alineaciones WHERE id_partido = ?)
             OR j.sofascore_id IS NOT NULL`,
    args: [partido.id_temporada, P],
})).rows;
const cache = new Map();
function resolver(sid, nombre) {
    const key = `${sid}|${nombre}`;
    if (cache.has(key)) return cache.get(key);
    let hit = plantilla.find(s => sid && Number(s.sofascore_id) === Number(sid));
    const n = norm(nombre); const toks = n.split(' ');
    const pool = plantilla.filter(s => !s.sofascore_id || Number(s.sofascore_id) === Number(sid));
    if (!hit) hit = pool.find(s => norm(s.nombre) === n);
    if (!hit) hit = pool.find(s => { const t = norm(s.nombre).split(' '); return t.every(x => toks.includes(x)) || toks.every(x => t.includes(x)); });
    if (!hit) { const c = pool.filter(s => norm(s.nombre).split(' ').includes(toks[toks.length - 1])); if (c.length === 1) hit = c[0]; }
    if (!hit && toks.length === 1) { const c = pool.filter(s => norm(s.nombre).split(' ')[0].startsWith(toks[0])); if (c.length === 1) hit = c[0]; }
    if (!hit) avisos.push(`Jugadora del Madrid sin emparejar: ${nombre} (Sofascore ${sid}). Créala o ponle sofascore_id y repite.`);
    else if (!hit.sofascore_id && sid) { stmts.push({ sql: 'UPDATE jugadoras SET sofascore_id = ? WHERE id_jugadora = ? AND sofascore_id IS NULL', args: [sid, hit.id_jugadora] }); hit.sofascore_id = sid; }
    const id = hit ? hit.id_jugadora : null;
    cache.set(key, id);
    return id;
}
const rmPlayers = lineups[RM]?.players || [];
const rmIds = new Set(rmPlayers.map(p => String(p.player?.id)));
for (const p of rmPlayers) resolver(p.player.id, p.player.name);

// ── Comprobación de goles ────────────────────────────────────────────────────
const golesInc = incidents.filter(i => i.incidentType === 'goal');
const golesIncRm = golesInc.filter(i => isRm(i.isHome)).length;
const golesIncRiv = golesInc.length - golesIncRm;
if (golesIncRm !== golesRm || golesIncRiv !== golesRival) avisos.push(`Los goles de las incidencias (${golesIncRm}-${golesIncRiv}) no cuadran con el marcador (${golesRm}-${golesRival}).`);

// ── Partido: datos generales (solo si están vacíos) ──────────────────────────
const sets = { sofascore_id: event.id };
if (!partido.hora) sets.hora = hora;
const formacion = lineups[RM]?.formation;
if (!partido.formacion && formacion) sets.formacion = formacion;
if (partido.asistencia == null && event.attendance) sets.asistencia = event.attendance;
const capitanaSofa = rmPlayers.find(p => p.captain);
if (capitanaSofa) {
    const idCap = resolver(capitanaSofa.player.id, capitanaSofa.player.name);
    if (!partido.capitana && idCap) sets.capitana = idCap;
    else if (idCap && partido.capitana !== idCap) avisos.push(`Capitana distinta: BD ${partido.capitana}, Sofascore ${capitanaSofa.player.name}. No la cambio.`);
}
if (partido.goles_rm == null && golesRm != null) { sets.goles_rm = golesRm; sets.goles_rival = golesRival; }
stmts.push({ sql: `UPDATE partidos SET ${Object.keys(sets).map(k => `${k} = ?`).join(', ')} WHERE id_partido = ?`, args: [...Object.values(sets), P] });

// ── Estadísticas del partido ─────────────────────────────────────────────────
const all = (statistics.find(s => s.period === 'ALL') || statistics[0] || { groups: [] }).groups.flatMap(g => g.statisticsItems || []);
const item = key => all.find(i => i.key === key);
const sv = (key, side) => num(item(key)?.[`${side}Value`]);
const st = (key, side) => num(item(key)?.[`${side}Total`]);
if (all.length) {
    const e = { id_partido: P };
    e.posesion_rm = sv('ballPossession', RM); e.posesion_rival = sv('ballPossession', RIV);
    e.xg_a_favor = sv('expectedGoals', RM); e.xg_en_contra = sv('expectedGoals', RIV);
    e.faltas_cometidas = sv('fouls', RM); e.faltas_recibidas = sv('fouls', RIV);
    for (const [pre, side] of [['rm', RM], ['rival', RIV]]) {
        Object.assign(e, {
            [`${pre}_grandes_ocasiones`]: sv('bigChanceCreated', side),
            [`${pre}_tiros`]: sv('totalShotsOnGoal', side), [`${pre}_tiros_puerta`]: sv('shotsOnGoal', side),
            [`${pre}_tiros_palo`]: sv('hitWoodwork', side), [`${pre}_paradas`]: sv('goalkeeperSaves', side),
            [`${pre}_corners`]: sv('cornerKicks', side), [`${pre}_pases_totales`]: sv('passes', side),
            [`${pre}_pases_completados`]: sv('accuratePasses', side),
            [`${pre}_pases_largo_totales`]: st('accurateLongBalls', side), [`${pre}_pases_largo_completados`]: sv('accurateLongBalls', side),
            [`${pre}_pases_tercio_totales`]: st('finalThirdPhaseStatistic', side), [`${pre}_pases_tercio_completados`]: sv('finalThirdPhaseStatistic', side),
            [`${pre}_centros_totales`]: st('accurateCross', side), [`${pre}_centros_completados`]: sv('accurateCross', side),
            [`${pre}_toques_area_rival`]: sv('touchesInOppBox', side), [`${pre}_entradas_totales`]: sv('totalTackle', side),
            [`${pre}_entradas_ganadas`]: sv('wonTacklePercent', side), [`${pre}_tiros_libres`]: sv('freeKicks', side),
            [`${pre}_duelos_suelo_totales`]: st('groundDuelsPercentage', side), [`${pre}_duelos_suelo_ganados`]: sv('groundDuelsPercentage', side),
            [`${pre}_duelos_aereos_totales`]: st('aerialDuelsPercentage', side), [`${pre}_duelos_aereos_ganados`]: sv('aerialDuelsPercentage', side),
            [`${pre}_regates`]: st('dribblesPercentage', side), [`${pre}_intercepciones`]: sv('interceptionWon', side),
            [`${pre}_recuperaciones`]: sv('ballRecovery', side), [`${pre}_despejes`]: sv('totalClearance', side),
            [`${pre}_fueras_juego`]: sv('offsides', side),
        });
    }
    const cols = Object.keys(e).filter(k => e[k] !== null);
    stmts.push({ sql: `INSERT INTO estadisticas_partidos (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})
                       ON CONFLICT(id_partido) DO UPDATE SET ${cols.filter(k => k !== 'id_partido').map(k => `${k} = excluded.${k}`).join(', ')}`,
                 args: cols.map(k => e[k]) });
    informe.push(`Estadísticas del partido: ${cols.length - 1} valores`);
} else avisos.push('Sin estadísticas de partido en el paquete.');

// ── Estadísticas de cada jugadora ────────────────────────────────────────────
const PLAYER_MAP = {
    valoracion: 'rating', tiros_totales: 'totalShots', tiros_puerta: 'onTargetScoringAttempt', toques: 'touches',
    regates_totales: 'totalContest', regates_completados: 'wonContest', perdidas: 'possessionLostCtrl', fueras_juego: 'totalOffside',
    pases_totales: 'totalPass', pases_completados: 'accuratePass', pases_clave: 'keyPass',
    pases_largo_totales: 'totalLongBalls', pases_largo_completados: 'accurateLongBalls', centros_totales: 'totalCross', centros_completados: 'accurateCross',
    entradas: 'totalTackle', bloqueos: 'outfielderBlock', despejes: 'totalClearance', intercepciones: 'interceptionWon', recuperaciones: 'ballRecovery',
    regateada: 'challengeLost', duelos_suelo_ganados: 'duelWon', duelos_aereos_ganados: 'aerialWon',
    faltas_recibidas: 'wasFouled', faltas_cometidas: 'fouls',
    pases_ultimo_tercio_totales: 'totalOppositionHalfPasses', pases_ultimo_tercio_completados: 'accurateOppositionHalfPasses',
    xg: 'expectedGoals', xa: 'expectedAssists', grandes_ocasiones_creadas: 'bigChanceCreated', grandes_ocasiones_falladas: 'bigChanceMissed',
    tiros_palo: 'hitWoodwork', tiros_fuera: 'shotOffTarget', tiros_bloqueados: 'blockedScoringAttempt', entradas_ganadas: 'wonTackle',
    ultimo_hombre: 'lastManTackle', despejes_linea: 'clearanceOffLine', errores_tiro: 'errorLeadToAShot', errores_gol: 'errorLeadToAGoal',
    penaltis_provocados: 'penaltyWon', penaltis_cometidos: 'penaltyConceded', paradas: 'saves', paradas_dentro_area: 'savedShotsFromInsideTheBox',
    despejes_punos: 'punches', blocajes_aereos: 'goodHighClaim', salidas: 'totalKeeperSweeper', salidas_acertadas: 'accurateKeeperSweeper',
    penaltis_parados: 'penaltySave', penaltis_recibidos: 'penaltyFaced', goles_evitados: 'goalsPrevented',
    conducciones: 'ballCarriesCount', conducciones_progresivas: 'progressiveBallCarriesCount', distancia_conducciones: 'totalBallCarriesDistance', progresion: 'totalProgression',
};
const SIN_CERO = new Set(['valoracion', 'goles_evitados']);
let nStats = 0;
for (const p of rmPlayers) {
    const s = p.statistics || {};
    if (!s.minutesPlayed) continue;
    const idJ = resolver(p.player.id, p.player.name); if (!idJ) continue;
    const row = {};
    for (const [col, key] of Object.entries(PLAYER_MAP)) row[col] = s[key] !== undefined ? num(s[key]) : SIN_CERO.has(col) ? null : 0;
    if (s.duelWon != null && s.duelLost != null) row.duelos_suelo_totales = s.duelWon + s.duelLost;
    if (s.aerialWon != null && s.aerialLost != null) row.duelos_aereos_totales = s.aerialWon + s.aerialLost;
    const exists = (await db.execute({ sql: 'SELECT id_est_jugadora FROM estadisticas_jugadoras WHERE id_partido = ? AND id_jugadora = ?', args: [P, idJ] })).rows[0];
    const cols = Object.keys(row);
    if (exists) stmts.push({ sql: `UPDATE estadisticas_jugadoras SET ${cols.map(k => `${k} = ?`).join(', ')} WHERE id_est_jugadora = ?`, args: [...cols.map(k => row[k]), exists.id_est_jugadora] });
    else stmts.push({ sql: `INSERT INTO estadisticas_jugadoras (id_partido, id_jugadora, ${cols.join(', ')}) VALUES (?, ?, ${cols.map(() => '?').join(', ')})`, args: [P, idJ, ...cols.map(k => row[k])] });
    nStats++;
}
informe.push(`Estadísticas de jugadoras: ${nStats}`);

// ── Tiros, posiciones medias, dominio y mapas de calor (se reemplazan) ───────
stmts.push({ sql: 'DELETE FROM tiros WHERE id_partido = ?', args: [P] });
let tirosRm = 0; let golesTiroRm = 0;
for (const s of shotmap) {
    let esRm = isRm(s.isHome) ? 1 : 0;
    if (rmIds.size && rmIds.has(String(s.player?.id)) !== Boolean(esRm)) esRm = rmIds.has(String(s.player?.id)) ? 1 : 0;
    if (esRm) { tirosRm++; if (s.shotType === 'goal' && s.goalType !== 'own') golesTiroRm++; }
    stmts.push({ sql: `INSERT OR REPLACE INTO tiros (id_partido, es_rm, id_jugadora, jugadora_nombre, sofascore_jugadora_id, minuto, minuto_anadido, segundo_partido, resultado, tipo_gol, situacion, parte_cuerpo, zona_porteria, xg, xgot, x, y, porteria_y, porteria_z, bloqueo_x, bloqueo_y)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [P, esRm, esRm ? resolver(s.player?.id, s.player?.name) : null, s.player?.name || '', num(s.player?.id), num(s.time), num(s.addedTime), num(s.timeSeconds),
            s.shotType || null, s.goalType || null, s.situation || null, s.bodyPart || null, s.goalMouthLocation || null, num(s.xg), num(s.xgot),
            num(s.playerCoordinates?.x), num(s.playerCoordinates?.y), num(s.goalMouthCoordinates?.y), num(s.goalMouthCoordinates?.z),
            num(s.blockCoordinates?.x), num(s.blockCoordinates?.y)] });
}
informe.push(`Tiros: ${shotmap.length} (${tirosRm} del Madrid)`);
if (shotmap.length && golesTiroRm + golesInc.filter(i => isRm(i.isHome) && i.incidentClass === 'ownGoal').length !== golesRm)
    avisos.push(`Los goles del mapa de tiros (${golesTiroRm}) no cuadran con los del Madrid (${golesRm}).`);

stmts.push({ sql: 'DELETE FROM posiciones_medias WHERE id_partido = ?', args: [P] });
for (const side of ['home', 'away']) for (const a of avgPos[side] || []) {
    const esRm = side === RM ? 1 : 0;
    stmts.push({ sql: 'INSERT OR REPLACE INTO posiciones_medias (id_partido, es_rm, id_jugadora, jugadora_nombre, sofascore_jugadora_id, x, y, acciones) VALUES (?,?,?,?,?,?,?,?)',
        args: [P, esRm, esRm ? resolver(a.player?.id, a.player?.name) : null, a.player?.name || '', num(a.player?.id), num(a.averageX), num(a.averageY), num(a.pointsCount)] });
}
stmts.push({ sql: 'DELETE FROM dominio_partido WHERE id_partido = ?', args: [P] });
for (const g of graph) stmts.push({ sql: 'INSERT OR REPLACE INTO dominio_partido (id_partido, minuto, valor) VALUES (?,?,?)', args: [P, num(g.minute), rmHome ? num(g.value) : -num(g.value)] });
let nHeat = 0;
for (const [pid, h] of Object.entries(heatmaps)) {
    const pts = (Array.isArray(h) ? h : h?.heatmap || []).map(p => [num(p.x), num(p.y)]).filter(p => p[0] != null);
    const name = rmPlayers.find(p => String(p.player.id) === String(pid))?.player.name;
    const idJ = name ? resolver(pid, name) : plantilla.find(s => Number(s.sofascore_id) === Number(pid))?.id_jugadora;
    if (!idJ || !pts.length) continue;
    stmts.push({ sql: 'INSERT OR REPLACE INTO mapas_calor (id_partido, id_jugadora, puntos) VALUES (?,?,?)', args: [P, idJ, JSON.stringify(pts)] });
    nHeat++;
}
informe.push(`Posiciones medias: ${(avgPos.home || []).length + (avgPos.away || []).length} · Dominio: ${graph.length} puntos · Mapas de calor: ${nHeat}`);

// ── Eventos: alineación, goles, tarjetas… (solo si faltan) ───────────────────
const hay = async (tabla) => (await db.execute({ sql: `SELECT count(*) n FROM ${tabla} WHERE id_partido = ?`, args: [P] })).rows[0].n > 0;
const subs = incidents.filter(i => i.incidentType === 'substitution');
const conMinutos = (await db.execute({ sql: 'SELECT count(*) n FROM alineaciones WHERE id_partido = ? AND minutos_jugados > 0', args: [P] })).rows[0].n > 0;
if (!conMinutos || FORZAR) {
    stmts.push({ sql: 'DELETE FROM alineaciones WHERE id_partido = ?', args: [P] });
    for (const p of rmPlayers) {
        const idJ = resolver(p.player.id, p.player.name); if (!idJ) continue;
        const ent = subs.find(i => isRm(i.isHome) && i.playerIn?.id === p.player.id);
        const sal = subs.find(i => isRm(i.isHome) && i.playerOut?.id === p.player.id);
        stmts.push({ sql: 'INSERT INTO alineaciones (id_partido, id_jugadora, convocada, titular, minutos_jugados, minuto_entrada, minuto_salida) VALUES (?,?,?,?,?,?,?)',
            args: [P, idJ, 1, p.substitute ? 0 : 1, num(p.statistics?.minutesPlayed) || 0, ent ? minutoTxt(ent.time, ent.addedTime) : null, sal ? minutoTxt(sal.time, sal.addedTime) : null] });
    }
    informe.push(`Alineación: ${rmPlayers.length} convocadas`);
} else informe.push('Alineación: ya existía, no se toca (usa --forzar-eventos para reescribirla)');

const tipoGol = (inc, shot) => inc.incidentClass === 'penalty' ? 'Penalti' : shot?.situation === 'free-kick' ? 'Falta directa'
    : ['corner', 'set-piece', 'throw-in-set-piece'].includes(shot?.situation) ? 'A balón parado' : 'Jugada';
const PARTE = { 'right-foot': 'DERECHA', 'left-foot': 'IZQUIERDA', head: 'CABEZA', other: 'CUERPO' };
const shotDe = inc => shotmap.find(s => s.shotType === 'goal' && s.player?.id === inc.player?.id && Math.abs((s.time ?? 0) - (inc.time ?? 0)) <= 1);
if (!(await hay('goles_y_asistencias')) && !(await hay('goles_rival')) || FORZAR) {
    if (FORZAR) for (const t of ['goles_y_asistencias', 'goles_rival', 'goles_propia']) stmts.push({ sql: `DELETE FROM ${t} WHERE id_partido = ?`, args: [P] });
    for (const g of [...golesInc].sort((a, b) => (a.time - b.time) || ((a.addedTime || 0) - (b.addedTime || 0)))) {
        const fav = rmHome ? g.homeScore : g.awayScore; const con = rmHome ? g.awayScore : g.homeScore;
        const min = minutoTxt(g.time, g.addedTime); const own = g.incidentClass === 'ownGoal';
        if (isRm(g.isHome)) {
            if (own) { // autogol de una rival a favor del Madrid
                stmts.push({ sql: 'INSERT INTO goles_y_asistencias (goleadora, asistente, id_partido, goles_a_favor, goles_en_contra, minuto, parte_cuerpo, tipo) VALUES (NULL, NULL, ?, ?, ?, ?, NULL, ?)', args: [P, fav, con, min, 'Propia puerta'] });
                stmts.push({ sql: 'INSERT INTO goles_propia (id_partido, id_jugadora, rival_nombre, minuto) VALUES (?, NULL, ?, ?)', args: [P, g.player?.name || null, min] });
            } else {
                const shot = shotDe(g);
                stmts.push({ sql: 'INSERT INTO goles_y_asistencias (goleadora, asistente, id_partido, goles_a_favor, goles_en_contra, minuto, parte_cuerpo, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    args: [resolver(g.player?.id, g.player?.name), g.assist1 ? resolver(g.assist1.id, g.assist1.name) : null, P, fav, con, min, PARTE[shot?.bodyPart] || null, tipoGol(g, shot)] });
            }
        } else if (own) { // autogol de una jugadora del Madrid
            stmts.push({ sql: 'INSERT INTO goles_rival (id_partido, goleadora, asistente, minuto, tipo) VALUES (?, ?, NULL, ?, ?)', args: [P, g.player?.name || '', min, 'en_propia'] });
            stmts.push({ sql: 'INSERT INTO goles_propia (id_partido, id_jugadora, rival_nombre, minuto) VALUES (?, ?, NULL, ?)', args: [P, resolver(g.player?.id, g.player?.name), min] });
        } else {
            stmts.push({ sql: 'INSERT INTO goles_rival (id_partido, goleadora, asistente, minuto, tipo) VALUES (?, ?, ?, ?, ?)',
                args: [P, g.player?.name || '', g.assist1?.name || null, min, g.incidentClass === 'penalty' ? 'penalti' : 'jugada'] });
        }
    }
    informe.push(`Goles: ${golesInc.length} insertados`);
} else informe.push('Goles: ya existían, no se tocan');

const cards = incidents.filter(i => i.incidentType === 'card');
const TIPO_TARJETA = { yellow: 'Amarilla', yellowRed: 'Doble Amarilla', red: 'Roja Directa' };
if (!(await hay('tarjetas')) && !(await hay('tarjetas_rival')) || FORZAR) {
    if (FORZAR) for (const t of ['tarjetas', 'tarjetas_rival']) stmts.push({ sql: `DELETE FROM ${t} WHERE id_partido = ?`, args: [P] });
    for (const c of cards) {
        const tipo = TIPO_TARJETA[c.incidentClass]; if (!tipo) continue;
        const min = minutoTxt(c.time, c.addedTime);
        if (isRm(c.isHome)) { const idJ = resolver(c.player?.id, c.player?.name || c.playerName); if (idJ) stmts.push({ sql: 'INSERT INTO tarjetas (id_partido, id_jugadora, tipo_tarjeta, minuto) VALUES (?,?,?,?)', args: [P, idJ, tipo, min] }); }
        else stmts.push({ sql: 'INSERT INTO tarjetas_rival (id_partido, nombre, tipo_tarjeta, minuto) VALUES (?,?,?,?)', args: [P, c.player?.name || c.playerName || '', tipo, min] });
    }
    informe.push(`Tarjetas: ${cards.length}`);
} else informe.push('Tarjetas: ya existían, no se tocan');

const fallados = incidents.filter(i => i.incidentType === 'inGamePenalty' && i.incidentClass !== 'scored');
if (fallados.length && (!(await hay('penaltis_fallados')) || FORZAR)) {
    for (const f of fallados) stmts.push({ sql: 'INSERT INTO penaltis_fallados (id_partido, id_jugadora, nombre_rival, minuto) VALUES (?,?,?,?)',
        args: [P, isRm(f.isHome) ? resolver(f.player?.id, f.player?.name) : null, isRm(f.isHome) ? null : f.player?.name || null, minutoTxt(f.time, f.addedTime)] });
    informe.push(`Penaltis fallados: ${fallados.length}`);
}
const tanda = incidents.filter(i => i.incidentType === 'penaltyShootout');
if (tanda.length && (!(await hay('tanda_penaltis')) || FORZAR)) {
    tanda.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)).forEach((t, i) => stmts.push({ sql: 'INSERT INTO tanda_penaltis (id_partido, orden, id_jugadora, nombre_rival, resultado) VALUES (?,?,?,?,?)',
        args: [P, i + 1, isRm(t.isHome) ? resolver(t.player?.id, t.player?.name) : null, isRm(t.isHome) ? null : t.player?.name || null, t.incidentClass === 'scored' ? 'GOL' : 'FALLADO'] }));
    stmts.push({ sql: 'UPDATE partidos SET penaltis = 1 WHERE id_partido = ?', args: [P] });
    informe.push(`Tanda de penaltis: ${tanda.length} lanzamientos`);
}

// ── Resultado ────────────────────────────────────────────────────────────────
console.log(informe.join('\n'));
if (avisos.length) console.log('\nAVISOS:\n- ' + avisos.join('\n- '));
const bloqueantes = avisos.filter(a => /no cuadran|sin emparejar/.test(a));
if (DRY) { console.log(`\n(simulación) ${stmts.length} sentencias. No se ha escrito nada.`); process.exit(0); }
if (bloqueantes.length) { console.log('\nNo escribo nada hasta resolver los avisos de goles o jugadoras sin emparejar.'); process.exit(2); }
const r = await db.batch(stmts, 'write');
console.log(`\nEscrito: ${stmts.length} sentencias, ${r.reduce((a, x) => a + x.rowsAffected, 0)} filas.`);

const secret = env.CACHE_REVALIDATION_SECRET;
if (secret) {
    const site = env.SITE_URL || 'https://www.madridfemeninoxtra.com';
    const res = await fetch(`${site}/api/cache/revalidate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cache-revalidation-secret': secret },
        body: JSON.stringify({ tables: ['partidos', 'alineaciones', 'goles_y_asistencias', 'goles_rival', 'goles_propia', 'tarjetas', 'tarjetas_rival', 'penaltis_fallados', 'tanda_penaltis', 'estadisticas_partidos', 'estadisticas_jugadoras', 'jugadoras'], tags: ['rankings', 'matches', 'players', 'statistics'] }),
    });
    console.log(`Caché de la web: ${res.status}`);
}
