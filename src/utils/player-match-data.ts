// Datos por partido para los comparadores «Jugadora vs rival» y «Con o sin».
// Cuatro consultas ligeras que se guardan juntas en caché un día: las páginas
// filtran en memoria y el CDN guarda cada combinación de filtros.
import { cached } from "./cache";
import { cacheTags } from "../lib/cache-tags";
import { slugify } from "./players";
import { slugify as matchSlugify } from "./partidos";
import { competitionDisplayName } from "./competiciones";

export interface PMatch {
    id: string; slug: string; fecha: string; temporada: string; competicion: string;
    rival: string; rivalSlug: string; local: boolean; gf: number; gc: number; resultado: "V" | "E" | "D";
    /** Minutos de los goles a favor y en contra (para «en el campo / fuera»). */
    gfMin: number[]; gcMin: number[]; duracion: number;
}
export interface PApp {
    m: string; p: string; titular: boolean; min: number; entrada: number | null; salida: number | null;
    goles: number; asist: number; nota: number | null; ta: number; tr: number;
}
export interface PlayerMatchData {
    matches: Record<string, PMatch>;
    players: Record<string, { nombre: string; slug: string; posicion: string }>;
    apps: PApp[];
}

export const OFICIALES = new Set(["Liga F", "Primera Iberdrola", "UWCL", "Copa de la Reina", "Supercopa de España"]);
const RM = /real madrid/i;
const minuteOf = (value: unknown) => {
    const n = parseInt(String(value ?? "").trim(), 10);
    return Number.isFinite(n) ? n : null;
};

async function load(): Promise<PlayerMatchData> {
    const { getPlayersDbClient } = await import("../db/client");
    const client = await getPlayersDbClient();
    if (!client) return { matches: {}, players: {}, apps: [] };
    const played = `p.goles_rm IS NOT NULL AND p.goles_rm != '' AND p.goles_rival IS NOT NULL AND p.goles_rival != '' AND date(p.fecha) <= date('now')`;
    const [matchRows, appRows, gfRows, gcRows] = await Promise.all([
        client.execute(`
            SELECT p.id_partido, p.fecha, p.goles_rm, p.goles_rival, p.penaltis, t.temporada, c.competicion,
                   cl.nombre AS local, cv.nombre AS visitante
            FROM partidos p
            JOIN temporadas t ON p.id_temporada = t.id_temporada
            JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
            WHERE ${played}`),
        // Goles, asistencias, notas y tarjetas se agregan una vez por tabla
        // (sin subconsultas por fila, para no multiplicar las lecturas).
        client.execute(`
            WITH g AS (SELECT id_partido, goleadora AS id, COUNT(*) AS n FROM goles_y_asistencias WHERE goleadora IS NOT NULL GROUP BY 1, 2),
                 s AS (SELECT id_partido, asistente AS id, COUNT(*) AS n FROM goles_y_asistencias WHERE asistente IS NOT NULL GROUP BY 1, 2),
                 t AS (SELECT id_partido, id_jugadora AS id,
                         SUM(CASE WHEN UPPER(tipo_tarjeta) = 'AMARILLA' THEN 1 ELSE 0 END) AS ta,
                         SUM(CASE WHEN UPPER(tipo_tarjeta) LIKE '%ROJA%' OR UPPER(tipo_tarjeta) LIKE '%DOBLE%' THEN 1 ELSE 0 END) AS tr
                       FROM tarjetas GROUP BY 1, 2)
            SELECT a.id_partido, a.id_jugadora, a.titular, a.minutos_jugados, a.minuto_entrada, a.minuto_salida,
                   j.nombre, j.posicion, COALESCE(g.n, 0) AS goles, COALESCE(s.n, 0) AS asist, ej.valoracion AS nota,
                   COALESCE(t.ta, 0) AS ta, COALESCE(t.tr, 0) AS tr
            FROM alineaciones a
            JOIN jugadoras j ON j.id_jugadora = a.id_jugadora
            JOIN partidos p ON p.id_partido = a.id_partido
            LEFT JOIN g ON g.id_partido = a.id_partido AND g.id = a.id_jugadora
            LEFT JOIN s ON s.id_partido = a.id_partido AND s.id = a.id_jugadora
            LEFT JOIN t ON t.id_partido = a.id_partido AND t.id = a.id_jugadora
            LEFT JOIN estadisticas_jugadoras ej ON ej.id_partido = a.id_partido AND ej.id_jugadora = a.id_jugadora
            WHERE ${played} AND (a.minutos_jugados > 0 OR a.titular = 1 OR a.convocada = 1)`),
        // A favor: goles_y_asistencias ya incluye los autogoles de las rivales.
        client.execute(`
            SELECT g.id_partido, g.minuto FROM goles_y_asistencias g JOIN partidos p ON p.id_partido = g.id_partido WHERE ${played}`),
        // En contra: goles de la rival (sin sus autogoles, que son a favor) y autogoles propios.
        client.execute(`
            SELECT gr.id_partido, gr.minuto FROM goles_rival gr JOIN partidos p ON p.id_partido = gr.id_partido
            WHERE ${played} AND COALESCE(gr.tipo, '') != 'en_propia'
            UNION ALL
            SELECT gp.id_partido, gp.minuto FROM goles_propia gp JOIN partidos p ON p.id_partido = gp.id_partido
            WHERE ${played} AND gp.id_jugadora IS NOT NULL`),
    ]);

    const data: PlayerMatchData = { matches: {}, players: {}, apps: [] };
    for (const r of matchRows.rows as any[]) {
        const local = RM.test(String(r.local || ""));
        const fecha = String(r.fecha || "").slice(0, 10);
        const gf = Number(r.goles_rm), gc = Number(r.goles_rival);
        const pen = String(r.penaltis ?? "").trim();
        const resultado = gf > gc ? "V" : gf < gc ? "D" : pen === "1" ? "V" : pen === "0" ? "D" : "E";
        const rival = String((local ? r.visitante : r.local) || "");
        data.matches[String(r.id_partido)] = {
            id: String(r.id_partido),
            slug: `${matchSlugify(r.local)}-vs-${matchSlugify(r.visitante)}-${fecha}`,
            fecha, temporada: String(r.temporada),
            competicion: /amistoso/i.test(String(r.competicion)) ? "Amistosos" : competitionDisplayName(r.competicion, { temporada: r.temporada }),
            rival, rivalSlug: matchSlugify(rival), local, gf, gc, resultado,
            gfMin: [], gcMin: [], duracion: 90,
        };
    }
    for (const r of gfRows.rows as any[]) { const m = data.matches[String(r.id_partido)]; const min = minuteOf(r.minuto); if (m && min != null) m.gfMin.push(min); }
    for (const r of gcRows.rows as any[]) { const m = data.matches[String(r.id_partido)]; const min = minuteOf(r.minuto); if (m && min != null) m.gcMin.push(min); }
    for (const r of appRows.rows as any[]) {
        const mid = String(r.id_partido), pid = String(r.id_jugadora);
        if (!data.matches[mid]) continue;
        if (!data.players[pid]) data.players[pid] = { nombre: String(r.nombre), slug: slugify(r.nombre), posicion: String(r.posicion || "") };
        const min = Number(r.minutos_jugados) || 0;
        // Prórroga: la duración del partido es el mayor minuto conocido (90 o 120).
        if (min > 90) data.matches[mid].duracion = Math.max(data.matches[mid].duracion, min);
        data.apps.push({
            m: mid, p: pid, titular: Number(r.titular) === 1, min,
            entrada: minuteOf(r.minuto_entrada), salida: minuteOf(r.minuto_salida),
            goles: Number(r.goles) || 0, asist: Number(r.asist) || 0,
            nota: r.nota != null && Number(r.nota) > 0 ? Number(r.nota) : null,
            ta: Number(r.ta) || 0, tr: Number(r.tr) || 0,
        });
    }
    return data;
}

const DAY = 24 * 60 * 60 * 1000;
export const fetchPlayerMatchData = () =>
    cached("comparadores:player-match:v2", DAY, load, { tags: [cacheTags.matches, cacheTags.lineups, cacheTags.statistics] });

export type MatchFilter = { temporada?: string; competicion?: string };
export function matchPasses(m: PMatch, f: MatchFilter) {
    if (f.temporada && f.temporada !== "todas" && m.temporada !== f.temporada) return false;
    if (!f.competicion || f.competicion === "todas") return true;
    if (f.competicion === "oficiales") return OFICIALES.has(m.competicion);
    return m.competicion === f.competicion;
}

/** Tramo que la jugadora estuvo en el campo, en minutos del partido. */
export function onPitch(app: PApp, m: PMatch): [number, number] | null {
    if (app.min <= 0) return null;
    const start = app.titular ? 0 : (app.entrada ?? Math.max(0, m.duracion - app.min));
    const end = app.salida ?? Math.min(m.duracion, start + app.min);
    return end > start ? [start, end] : null;
}
