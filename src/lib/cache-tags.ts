export const cacheTags = {
    matches: 'matches', match: (id: string | number) => `match-${id}`,
    goals: 'goals', lineups: 'lineups', statistics: 'statistics', rankings: 'rankings',
    players: 'players', player: (id: string | number) => `player-${id}`,
    stadiums: 'stadiums', stadium: (id: string | number) => `stadium-${id}`,
    coaches: 'coaches', coach: (id: string | number) => `coach-${id}`,
    calendar: 'calendar', rivals: 'rivals', homepage: 'homepage',
} as const;

export function tagsForPath(pathname: string): string[] {
    const tags: string[] = [];
    if (/^\/api\/(partidos|games\/)/.test(pathname)) tags.push(cacheTags.matches, cacheTags.calendar, cacheTags.goals, cacheTags.lineups, cacheTags.statistics);
    if (/^\/api\/(goles_y_asistencias|xg-timeline|assist-network|finishing-players|team-stats)/.test(pathname)) {
        tags.push(cacheTags.goals, cacheTags.statistics, cacheTags.rankings, cacheTags.players, cacheTags.matches);
    }
    if (/^\/api\/players/.test(pathname)) tags.push(cacheTags.players, cacheTags.statistics, cacheTags.rankings);
    if (/^\/api\/player-radar/.test(pathname)) tags.push(cacheTags.players, cacheTags.statistics, cacheTags.rankings);
    if (/^\/api\/coaches/.test(pathname)) tags.push(cacheTags.coaches, cacheTags.matches);
    if (/^\/api\/(rivals|clubes)/.test(pathname)) tags.push(cacheTags.rivals, cacheTags.matches, cacheTags.statistics);
    if (/^\/api\/(buscador|opciones_filtro)/.test(pathname)) tags.push(cacheTags.matches, cacheTags.players, cacheTags.statistics);
    if (/^\/api\/search/.test(pathname)) tags.push(cacheTags.matches, cacheTags.players, cacheTags.rivals, cacheTags.coaches, cacheTags.stadiums);
    if (pathname === '/' || pathname === '/home') tags.push(cacheTags.homepage, cacheTags.matches);
    if (/^\/(partidos|calendario)/.test(pathname)) tags.push(cacheTags.matches, cacheTags.calendar);
    if (/^\/partidos\/[^/]+\/?$/.test(pathname)) {
        tags.push(cacheTags.goals, cacheTags.lineups, cacheTags.statistics, cacheTags.stadiums, cacheTags.coaches, 'referees');
    }
    if (/^\/(jugadoras|plantilla)/.test(pathname)) tags.push(cacheTags.players, cacheTags.statistics);
    if (/^\/(estadisticas|rankings|records|comparador)/.test(pathname)) tags.push(cacheTags.statistics, cacheTags.rankings);
    if (/^\/estadios/.test(pathname)) tags.push(cacheTags.stadiums);
    if (/^\/entrenadores/.test(pathname)) tags.push(cacheTags.coaches);
    if (/^\/rivales/.test(pathname)) tags.push(cacheTags.rivals, cacheTags.matches);
    return [...new Set(tags)];
}

export const tagsAfterWrite = {
    match: (id: string | number) => [
        cacheTags.matches, cacheTags.match(id), cacheTags.calendar,
        cacheTags.statistics, cacheTags.lineups, cacheTags.goals, cacheTags.rankings,
        cacheTags.homepage,
    ],
    goal: (matchId: string | number, playerId?: string | number) => [
        cacheTags.match(matchId), cacheTags.matches, cacheTags.goals,
        cacheTags.statistics, cacheTags.rankings,
        ...(playerId == null ? [] : [cacheTags.player(playerId)]),
    ],
    player: (id: string | number) => [cacheTags.players, cacheTags.player(id), cacheTags.statistics],
    stadium: (id: string | number) => [cacheTags.stadiums, cacheTags.stadium(id), cacheTags.matches, cacheTags.statistics],
    lineup: (matchId: string | number, playerId: string | number) => [
        cacheTags.match(matchId), cacheTags.matches, cacheTags.lineups,
        cacheTags.statistics, cacheTags.player(playerId),
    ],
    coach: (id: string | number) => [cacheTags.coaches, cacheTags.coach(id), cacheTags.matches],
} as const;
