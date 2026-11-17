// Datos de la ficha de un partido: solo ese partido, en dos peticiones agrupadas
// a Turso y guardados con una sola clave de caché.
import { cached } from './cache';
import { cacheTags } from '../lib/cache-tags';
import { isOpenMatchDate, matchCacheTags, matchDateFromSlug, ownMatchTags } from '../lib/match-freshness';
import {
    buildMatchEvents,
    gamesSql,
    mapGameRow,
    mapKitRows,
    mapLineupRows,
    mapSubstitutionRows,
    MATCH_EVENT_SQL,
    MATCH_KIT_SQL,
    MATCH_LINEUP_SQL,
    MATCH_SUBSTITUTIONS_SQL,
    type MatchEventRows,
} from './partidos';

const DAY_MS = 24 * 60 * 60 * 1000;
const OPEN_TTL_MS = 7 * DAY_MS;
const CLOSED_TTL_MS = 30 * DAY_MS;
const CACHE_VERSION = 'v1';

export type StadiumRecord = { wins: number; draws: number; losses: number; total: number };
export type MatchAnalysisSummary = { tiros: number; posiciones: number; dominio: number; periodos: number };

export type MatchDetail = {
    game: any;
    lineup: any[];
    subs: any[];
    events: any[];
    kit: { url: string; nombre: string | null; tipo: string | null } | null;
    /** Balance del Real Madrid en el estadio hasta este partido (incluido si ya se jugó). */
    stadiumStats: StadiumRecord;
    /** Partidos anteriores contra el mismo rival, del más reciente al más antiguo. */
    h2h: any[];
    /** Fila de `entrenadores` del partido, sin transformar. */
    coach: Record<string, unknown> | null;
    /** Cuántas filas de análisis tiene el partido: decide si existen las pestañas. */
    analysis: MatchAnalysisSummary;
};

const EMPTY_STADIUM: StadiumRecord = { wins: 0, draws: 0, losses: 0, total: 0 };

const STADIUM_SQL = `
    SELECT
        SUM(CASE
            WHEN CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 1
            WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND CAST(p.penaltis AS INTEGER) = 1 THEN 1
            ELSE 0
        END) as wins,
        SUM(CASE
            WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND (p.penaltis IS NULL OR p.penaltis = '') THEN 1
            ELSE 0
        END) as draws,
        SUM(CASE
            WHEN CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 1
            WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND CAST(p.penaltis AS INTEGER) = 0 THEN 1
            ELSE 0
        END) as losses,
        COUNT(*) as total
    FROM partidos p
    WHERE p.id_estadio = ?
      AND p.goles_rm IS NOT NULL AND p.goles_rm != ''
      AND p.goles_rival IS NOT NULL AND p.goles_rival != ''
      AND date(p.fecha) <= date('now')
      AND p.fecha <= ?
`;

const H2H_SQL = `
    SELECT
        p.id_partido AS partido_id, p.fecha, p.hora, p.goles_rm, p.goles_rival, p.penaltis,
        t.temporada AS temporada_nombre,
        c.competicion AS competicion_nombre,
        c.foto_url AS competicion_foto_url,
        cl.nombre AS club_local,
        cl.foto_url AS local_foto_url,
        cv.nombre AS club_visitante,
        cv.foto_url AS visitante_foto_url,
        CASE
           WHEN p.goles_rm IS NULL OR p.goles_rival IS NULL THEN 'P'
           WHEN CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 'V'
           WHEN CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 'D'
           WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND (p.penaltis = '1' OR p.penaltis = 1 OR TRIM(p.penaltis) = '1') THEN 'V'
           WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND (p.penaltis = '0' OR p.penaltis = 0 OR TRIM(p.penaltis) = '0') THEN 'D'
           ELSE 'E'
        END AS resultado
    FROM partidos p
    LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
    LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
    LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
    LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
    WHERE p.id_partido != ?
      AND p.fecha < ?
      AND (p.id_club_local = ? OR p.id_club_visitante = ? OR LOWER(cl.nombre) = LOWER(?) OR LOWER(cv.nombre) = LOWER(?))
    ORDER BY p.fecha DESC
`;

const ANALYSIS_SUMMARY_SQL = `
    SELECT
        (SELECT COUNT(*) FROM tiros WHERE id_partido = ?) AS tiros,
        (SELECT COUNT(*) FROM posiciones_medias WHERE id_partido = ? AND es_rm = 1) AS posiciones,
        (SELECT COUNT(*) FROM dominio_partido WHERE id_partido = ?) AS dominio,
        (SELECT COUNT(*) FROM estadisticas_periodos WHERE id_partido = ?) AS periodos
`;

const COACH_SQL = 'SELECT id_entrenador, nombre, ciudad, pais, iso, fecha_nacimiento, foto_url FROM entrenadores WHERE id_entrenador = ?';

export const normalizeClub = (name: unknown) =>
    String(name ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const isRealMadridLocal = (game: { club_local?: unknown }) =>
    String(game.club_local ?? '').toLowerCase().includes('real madrid');

async function loadMatchDetail(slug: string, date: string): Promise<MatchDetail | null> {
    const { getPlayersDbClient, readBatch } = await import('../db/client');
    const client = await getPlayersDbClient();
    if (!client) throw new Error('Turso no disponible');

    // 1.ª petición: el partido del día del slug.
    const [gameRows] = await readBatch(client, [{
        sql: gamesSql('p.fecha = ?', 'p.id_club_local, p.id_club_visitante, p.id_entrenador'),
        args: [date],
    }]);
    const game = gameRows.map(mapGameRow).find((row) => row.slug === slug);
    if (!game) return null;

    // 2.ª petición: todo lo demás que necesita la ficha, agrupado.
    const id = game.id_partido;
    const localRM = isRealMadridLocal(game);
    const rivalId = localRM ? game.id_club_visitante : game.id_club_local;
    const rivalName = localRM ? game.club_visitante : game.club_local;
    const eventKeys = Object.keys(MATCH_EVENT_SQL) as (keyof typeof MATCH_EVENT_SQL)[];
    const statements = [
        { sql: MATCH_LINEUP_SQL, args: [id] },
        { sql: MATCH_SUBSTITUTIONS_SQL, args: [id] },
        { sql: MATCH_KIT_SQL, args: [id] },
        ...eventKeys.map((key) => ({ sql: MATCH_EVENT_SQL[key], args: [id] })),
        { sql: H2H_SQL, args: [id, String(game.fecha ?? ''), rivalId ?? -1, rivalId ?? -1, rivalName ?? '', rivalName ?? ''] },
        { sql: ANALYSIS_SUMMARY_SQL, args: [id, id, id, id] },
        ...(game.id_estadio != null ? [{ sql: STADIUM_SQL, args: [game.id_estadio, String(game.fecha ?? '')] }] : []),
        ...(game.id_entrenador != null ? [{ sql: COACH_SQL, args: [game.id_entrenador] }] : []),
    ];
    const results = await readBatch(client, statements);
    const [lineupRows, subsRows, kitRows] = results;
    const eventRows = Object.fromEntries(eventKeys.map((key, i) => [key, results[3 + i]])) as unknown as MatchEventRows;
    let next = 3 + eventKeys.length;
    const h2hRows = results[next++];
    const analysisRow = results[next++][0] ?? {};
    const stadiumRow = game.id_estadio != null ? results[next++][0] : null;
    const coachRow = game.id_entrenador != null ? results[next++][0] ?? null : null;

    const subs = mapSubstitutionRows(subsRows);
    const h2hRival = normalizeClub(rivalName);
    const h2h = h2hRows
        .map(mapGameRow)
        .filter((g) => g.isPlayed && g.slug !== game.slug
            && String(g.fecha ?? '') < String(game.fecha ?? '')
            && [g.club_local, g.club_visitante].map(normalizeClub).includes(h2hRival))
        .sort((a, b) => String(b.fecha ?? '').localeCompare(String(a.fecha ?? '')));

    return {
        game,
        lineup: mapLineupRows(lineupRows),
        subs,
        events: buildMatchEvents(eventRows, subs),
        kit: mapKitRows(kitRows),
        stadiumStats: stadiumRow ? {
            wins: Number(stadiumRow.wins || 0),
            draws: Number(stadiumRow.draws || 0),
            losses: Number(stadiumRow.losses || 0),
            total: Number(stadiumRow.total || 0),
        } : EMPTY_STADIUM,
        h2h,
        coach: coachRow,
        analysis: {
            tiros: Number(analysisRow.tiros || 0),
            posiciones: Number(analysisRow.posiciones || 0),
            dominio: Number(analysisRow.dominio || 0),
            periodos: Number(analysisRow.periodos || 0),
        },
    };
}

/**
 * Ficha de un partido a partir de su slug. Se guarda con una sola clave:
 * las fichas cerradas solo se vacían con `match-ID`/`match-slug` o `database`;
 * las abiertas, con cualquier carga de datos de partido.
 * Devuelve null si el partido no existe y lanza si Turso falla, para que un
 * fallo pasajero no quede guardado como "no existe".
 */
export async function fetchMatchDetail(slug: string): Promise<MatchDetail | null> {
    const date = matchDateFromSlug(slug);
    if (!date) return null;
    const open = isOpenMatchDate(date);
    const result = await cached(`match-detail:${CACHE_VERSION}:${slug}`, open ? OPEN_TTL_MS : CLOSED_TTL_MS, async () => {
        // Se envuelve para poder guardar también "no existe" (null no se guarda en Runtime Cache).
        return { detail: await loadMatchDetail(slug, date) };
    }, {
        tags: open ? matchCacheTags({ slug, fecha: date }) : ownMatchTags({ slug }),
        // Un slug que no existe se vacía cuando cambian los partidos.
        tagsFor: (data) => data?.detail ? matchCacheTags(data.detail.game) : [cacheTags.matches, cacheTags.calendar],
    });
    return result.detail;
}

/** Etiquetas de la respuesta "este partido no existe". */
export const MISSING_MATCH_TAGS = [cacheTags.database, cacheTags.matches, cacheTags.calendar];

/** Etiquetas y vida en caché de lo que depende de un partido (página, fragmentos y análisis). */
export function matchCachePolicy(game: { id_partido?: unknown; slug?: unknown; fecha?: unknown }) {
    const open = isOpenMatchDate(game.fecha as string | null | undefined);
    return { open, tags: matchCacheTags(game), ttlMs: open ? OPEN_TTL_MS : CLOSED_TTL_MS };
}
