// Rankings de «más X en un solo partido».
// Una única consulta trae, por jugadora y partido, goles, asistencias y las
// estadísticas individuales. El resultado se guarda en caché un día y las
// peticiones (estadística · competición · temporada) se filtran en memoria.
import { cached } from "./cache";
import { cacheTags } from "../lib/cache-tags";
import { slugify } from "./players";
import { slugify as matchSlugify } from "./partidos";
import { competitionDisplayName } from "./competiciones";

export const MATCH_STATS = [
    { value: "goles", label: "Goles" },
    { value: "asistencias", label: "Asistencias" },
    { value: "goles_generados", label: "Goles + Asist." },
    { value: "tiros_totales", label: "Tiros" },
    { value: "tiros_puerta", label: "Tiros a puerta" },
    { value: "pases_clave", label: "Pases clave" },
    { value: "pases_completados", label: "Pases completados" },
    { value: "regates_completados", label: "Regates" },
    { value: "toques", label: "Toques" },
    { value: "duelos_ganados", label: "Duelos ganados" },
    { value: "recuperaciones", label: "Recuperaciones" },
    { value: "entradas", label: "Entradas" },
    { value: "intercepciones", label: "Intercepciones" },
    { value: "despejes", label: "Despejes" },
    { value: "valoracion", label: "Valoración" },
] as const;

export type MatchStat = (typeof MATCH_STATS)[number]["value"];
const STAT_KEYS = MATCH_STATS.map((s) => s.value) as MatchStat[];

interface MatchInfo { slug: string; fecha: string; rival: string; local: boolean; gf: number; gc: number; competicion: string; temporada: string }
interface Dataset {
    matches: Record<string, MatchInfo>;
    players: Record<string, { nombre: string; slug: string }>;
    /** [id_partido, id_jugadora, ...valores en el orden de STAT_KEYS] */
    rows: (string | number)[][];
}

const OFICIALES = new Set(["Liga F", "Primera Iberdrola", "UWCL", "Copa de la Reina", "Supercopa de España"]);
const RM = /real madrid/i;

async function load(): Promise<Dataset> {
    const { getPlayersDbClient } = await import("../db/client");
    const client = await getPlayersDbClient();
    if (!client) return { matches: {}, players: {}, rows: [] };
    const result = await client.execute(`
        WITH played AS (
            SELECT p.id_partido, p.fecha, p.goles_rm, p.goles_rival, t.temporada, c.competicion,
                   cl.nombre AS local, cv.nombre AS visitante
            FROM partidos p
            JOIN temporadas t ON p.id_temporada = t.id_temporada
            JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
            WHERE p.goles_rm IS NOT NULL AND p.goles_rm != ''
              AND p.goles_rival IS NOT NULL AND p.goles_rival != ''
              AND date(p.fecha) <= date('now')
        ),
        g AS (SELECT id_partido, goleadora AS id, COUNT(*) AS n FROM goles_y_asistencias WHERE goleadora IS NOT NULL GROUP BY 1, 2),
        a AS (SELECT id_partido, asistente AS id, COUNT(*) AS n FROM goles_y_asistencias WHERE asistente IS NOT NULL GROUP BY 1, 2),
        base AS (
            SELECT id_partido, id_jugadora AS id FROM estadisticas_jugadoras
            UNION SELECT id_partido, id FROM g
            UNION SELECT id_partido, id FROM a
        )
        SELECT pl.*, b.id AS id_jugadora, j.nombre,
            COALESCE(g.n, 0) AS goles, COALESCE(a.n, 0) AS asistencias,
            ej.tiros_totales, ej.tiros_puerta, ej.pases_clave, ej.pases_completados, ej.regates_completados,
            ej.toques, COALESCE(ej.duelos_suelo_ganados, 0) + COALESCE(ej.duelos_aereos_ganados, 0) AS duelos_ganados,
            ej.recuperaciones, ej.entradas, ej.intercepciones, ej.despejes, ej.valoracion
        FROM base b
        JOIN played pl ON pl.id_partido = b.id_partido
        JOIN jugadoras j ON j.id_jugadora = b.id
        LEFT JOIN g ON g.id_partido = b.id_partido AND g.id = b.id
        LEFT JOIN a ON a.id_partido = b.id_partido AND a.id = b.id
        LEFT JOIN estadisticas_jugadoras ej ON ej.id_partido = b.id_partido AND ej.id_jugadora = b.id
    `);

    const data: Dataset = { matches: {}, players: {}, rows: [] };
    for (const r of result.rows as any[]) {
        const mid = String(r.id_partido);
        if (!data.matches[mid]) {
            const local = RM.test(String(r.local || ""));
            const fecha = String(r.fecha || "").slice(0, 10);
            data.matches[mid] = {
                slug: `${matchSlugify(r.local)}-vs-${matchSlugify(r.visitante)}-${fecha}`,
                fecha,
                rival: String((local ? r.visitante : r.local) || ""),
                local,
                gf: Number(r.goles_rm),
                gc: Number(r.goles_rival),
                competicion: /amistoso/i.test(String(r.competicion)) ? "Amistosos" : competitionDisplayName(r.competicion, { temporada: r.temporada }),
                temporada: String(r.temporada),
            };
        }
        const pid = String(r.id_jugadora);
        if (!data.players[pid]) data.players[pid] = { nombre: String(r.nombre), slug: slugify(r.nombre) };
        const values = STAT_KEYS.map((key) => {
            if (key === "goles_generados") return Number(r.goles) + Number(r.asistencias);
            const v = Number(r[key] ?? 0);
            return Number.isFinite(v) ? v : 0;
        });
        if (values.some((v) => v > 0)) data.rows.push([mid, pid, ...values]);
    }
    return data;
}

const DAY = 24 * 60 * 60 * 1000;
const dataset = () =>
    cached("rankings:match-records:v1", DAY, load, { tags: [cacheTags.rankings, cacheTags.statistics] });

export interface MatchRecord {
    nombre: string; slug: string; value: number;
    match: MatchInfo;
}

export async function fetchMatchRecords(stat: string, competition = "todos", season = "todos", limit = 50): Promise<{ records: MatchRecord[]; seasons: string[]; competitions: string[] }> {
    const index = STAT_KEYS.indexOf(stat as MatchStat);
    const data = await dataset();
    const all = Object.values(data.matches);
    const seasons = [...new Set(all.map((m) => m.temporada))].sort().reverse();
    const competitions = [...new Set(all.map((m) => m.competicion))];
    if (index < 0) return { records: [], seasons, competitions };
    const col = index + 2;
    const records = data.rows
        .filter((row) => {
            const m = data.matches[row[0] as string];
            if (season !== "todos" && m.temporada !== season) return false;
            if (competition === "oficiales") return OFICIALES.has(m.competicion);
            return competition === "todos" || m.competicion === competition;
        })
        .filter((row) => Number(row[col]) > 0)
        // Mayor valor primero; a igualdad, el partido más reciente.
        .sort((x, y) => Number(y[col]) - Number(x[col]) || data.matches[y[0] as string].fecha.localeCompare(data.matches[x[0] as string].fecha))
        .slice(0, limit)
        .map((row) => ({ ...data.players[row[1] as string], value: Number(row[col]), match: data.matches[row[0] as string] }));
    return { records, seasons, competitions };
}
