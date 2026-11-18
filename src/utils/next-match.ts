import { parseMatchDate } from './date-helper';

const MATCH_DURATION_MS = 120 * 60 * 1000;
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
const LIVE_CACHE_S = 300;
const MIN_CACHE_S = 60;
const MAX_CACHE_S = 24 * 60 * 60;

type UpcomingMatches = { allGames: any[]; calendarMatches: any[] };

export async function fetchUpcomingMatches(now = new Date()): Promise<UpcomingMatches | null> {
    try {
        const [{ getPlayersDbClient }, { gamesSql, mapGameRow }, { mapCalendarRow }] = await Promise.all([
            import('../db/client'),
            import('./partidos'),
            import('./calendar'),
        ]);
        const client = await getPlayersDbClient();
        if (!client) return null;
        const desde = new Date(now.getTime() - WINDOW_MS).toISOString().slice(0, 10);
        const { rows } = await client.execute({ sql: gamesSql('p.fecha >= ?'), args: [desde] });
        return {
            allGames: rows.map(mapGameRow),
            calendarMatches: rows.map((row: any) => mapCalendarRow({ ...row, id: row.partido_id })),
        };
    } catch (error) {
        console.error('[fetchUpcomingMatches] Error:', error);
        return null;
    }
}

export function pickNextMatch(upcoming: UpcomingMatches | null, now = new Date()) {
    if (upcoming === null) return { nextMatch: null, live: false, failed: true };

    const liveMatch = upcoming.allGames.find((game) => {
        if (!game.fecha || !game.hora) return false;
        const matchDate = parseMatchDate(game.fecha, game.hora);
        return now >= matchDate && now <= new Date(matchDate.getTime() + MATCH_DURATION_MS);
    });

    const nextMatch = liveMatch ||
        upcoming.calendarMatches.find((match) => parseMatchDate(match.fecha, match.hora) >= now) ||
        null;

    return { nextMatch, live: Boolean(liveMatch), failed: false };
}

export function nextMatchCacheSeconds(nextMatch: any, live: boolean, now = new Date(), failed = false): number {
    if (live || failed) return LIVE_CACHE_S;
    if (!nextMatch?.fecha) return MAX_CACHE_S;
    const untilKickoff = Math.floor((parseMatchDate(nextMatch.fecha, nextMatch.hora).getTime() - now.getTime()) / 1000);
    return Math.min(MAX_CACHE_S, Math.max(MIN_CACHE_S, untilKickoff));
}
