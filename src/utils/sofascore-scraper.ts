export interface MatchData {
  homeTeam: string;
  awayTeam: string;
  date?: string; // ISO date "2025-03-15"
  score: {
    home: number | null;
    away: number | null;
  };
  matchTime: {
    period: string; // '1H' | '2H' | 'HT' | 'FT' | 'NS' | 'ET' | 'PENALTIES'
    minute: number | null;
    isLive: boolean;
  };
  homeLineup: PlayerLineup[];
  awayLineup: PlayerLineup[];
  matchStats: MatchStats;
  homeStats: TeamStats;
  awayStats: TeamStats;
  events: MatchEvent[];
  homeGoals: GoalEvent[];
  awayGoals: GoalEvent[];
  homeCards: CardEvent[];
  awayCards: CardEvent[];
  penalties?: PenaltyData;
}

export interface PlayerLineup {
  name: string;
  position: string;
  number: number;
  starter: boolean;
  minutesPlayed?: number;
  substitutedOutMinute?: number;
  stats?: PlayerStats;
}

export interface PlayerStats {
  rating?: number;
  passes?: { completed: number; total: number };
  shots?: { total: number; onTarget: number };
  tackles?: number;
  interceptions?: number;
  dribbles?: { completed: number; total: number };
  duels?: { won: number; total: number };
  fouls?: { committed: number; suffered: number };
  balls?: { touched: number; inBox: number };
  crosses?: { completed: number; total: number };
  clearances?: number;
  keyPasses?: number;
  offside?: number;
}

export interface MatchStats {
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  passes?: { home: number; away: number };
  passAccuracy?: { home: number; away: number };
  tackles?: { home: number; away: number };
  fouls?: { home: number; away: number };
  corners?: { home: number; away: number };
  offsides?: { home: number; away: number };
}

export interface TeamStats {
  possession: number;
  passes: number;
  passes_accuracy: number;
  shots: number;
  shots_on_target: number;
  tackles: number;
  fouls: number;
  corners: number;
  offsides: number;
  balls_touched: number;
  crosses: number;
  [key: string]: any;
}

export interface GoalEvent {
  player: string;
  minute: number;
  isOwnGoal?: boolean;
  isFromPenalty?: boolean;
  assist?: string;
}

export interface CardEvent {
  player: string;
  minute: number;
  type: 'YELLOW' | 'RED';
}

export interface MatchEvent {
  type: 'GOAL' | 'CARD' | 'SUBSTITUTION' | 'VAR' | 'CORNER' | 'FOUL';
  minute: number;
  team: 'home' | 'away';
  description: string;
  players?: string[];
}

export interface PenaltyData {
  home: number;
  away: number;
  winner: 'home' | 'away' | null;
  shootout?: {
    home: PenaltyShot[];
    away: PenaltyShot[];
  };
}

export interface PenaltyShot {
  player: string;
  scored: boolean;
  minute?: number;
}

const API_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Referer': 'https://www.sofascore.com/',
  'Origin': 'https://www.sofascore.com',
  'Cache-Control': 'no-cache',
};

export function extractEventId(url: string): string | null {
  const hashId = url.match(/[#/]id[:/](\d+)/);
  if (hashId) return hashId[1];

  const directMatch = url.match(/\/match\/(\d+)/);
  if (directMatch) return directMatch[1];

  const nums = url.match(/\b(\d{6,})\b/g);
  if (nums) return nums[nums.length - 1];

  return null;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: API_HEADERS });
  if (!res.ok) throw new Error(`SofaScore API ${res.status}: ${url}`);
  return res.json();
}

function emptyTeamStats(): TeamStats {
  return {
    possession: 0, passes: 0, passes_accuracy: 0, shots: 0,
    shots_on_target: 0, tackles: 0, fouls: 0, corners: 0,
    offsides: 0, balls_touched: 0, crosses: 0,
  };
}

function parseMatchTime(event: any): { period: string; minute: number | null; isLive: boolean } {
  const type = event.status?.type || '';
  const desc = (event.status?.description || '').toLowerCase();

  if (type === 'finished') return { period: 'FT', minute: null, isLive: false };
  if (type === 'notstarted') return { period: 'NS', minute: null, isLive: false };
  if (type === 'postponed') return { period: 'PP', minute: null, isLive: false };
  if (type === 'canceled') return { period: 'CAN', minute: null, isLive: false };

  if (type === 'inprogress') {
    let period = '1H';
    if (desc.includes('half time') || desc === 'ht') period = 'HT';
    else if (desc.includes('2nd') || event.status?.code === 7) period = '2H';
    else if (desc.includes('extra') || desc.includes('overtime')) period = 'ET';
    else if (desc.includes('penalt')) period = 'PENALTIES';

    const minute = event.time?.played ?? null;
    return { period, minute, isLive: true };
  }

  return { period: 'NS', minute: null, isLive: false };
}

function parseLineup(players: any[]): PlayerLineup[] {
  return players.map((p: any) => ({
    name: p.player?.name || p.player?.shortName || '',
    position: p.position || p.player?.position || '',
    number: parseInt(p.jerseyNumber || '0') || 0,
    starter: !p.substitute,
    minutesPlayed: p.statistics?.minutesPlayed ?? undefined,
    substitutedOutMinute: p.statistics?.substitutionMinute ?? undefined,
    stats: parsePlayerStats(p.statistics),
  }));
}

function parsePlayerStats(s: any): PlayerStats | undefined {
  if (!s) return undefined;
  return {
    rating: s.rating ?? undefined,
    passes: s.totalPasses !== undefined
      ? { completed: s.accuratePasses ?? 0, total: s.totalPasses }
      : undefined,
    shots: s.totalShots !== undefined
      ? { total: s.totalShots, onTarget: s.shotsOnTarget ?? 0 }
      : undefined,
    tackles: s.tackles ?? undefined,
    interceptions: s.interceptions ?? undefined,
    dribbles: s.successfulDribbles !== undefined
      ? { completed: s.successfulDribbles, total: s.attemptedDribbles ?? s.successfulDribbles }
      : undefined,
    duels: s.duelsWon !== undefined
      ? { won: s.duelsWon, total: (s.duelsWon ?? 0) + (s.duelsLost ?? 0) }
      : undefined,
    fouls: s.fouls !== undefined
      ? { committed: s.fouls, suffered: s.foulsSuffered ?? 0 }
      : undefined,
    balls: s.touches !== undefined
      ? { touched: s.touches, inBox: s.touchesInOppBox ?? 0 }
      : undefined,
    keyPasses: s.keyPasses ?? undefined,
    clearances: s.clearances ?? undefined,
  };
}

function parseStats(statistics: any[]): { matchStats: MatchStats; homeStats: TeamStats; awayStats: TeamStats } {
  const matchStats: MatchStats = {};
  const homeStats = emptyTeamStats();
  const awayStats = emptyTeamStats();

  const allPeriod = statistics.find((s: any) => s.period === 'ALL');
  if (!allPeriod) return { matchStats, homeStats, awayStats };

  for (const group of allPeriod.groups || []) {
    for (const item of group.statisticsItems || []) {
      const hv = item.homeValue ?? 0;
      const av = item.awayValue ?? 0;
      switch (item.key) {
        case 'ballPossession':
          matchStats.possession = { home: hv, away: av };
          homeStats.possession = hv; awayStats.possession = av; break;
        case 'totalShots': case 'shots':
          matchStats.shots = { home: hv, away: av };
          homeStats.shots = hv; awayStats.shots = av; break;
        case 'shotsOnTarget':
          matchStats.shotsOnTarget = { home: hv, away: av };
          homeStats.shots_on_target = hv; awayStats.shots_on_target = av; break;
        case 'accuratePasses': case 'passes':
          matchStats.passes = { home: hv, away: av };
          homeStats.passes = hv; awayStats.passes = av; break;
        case 'tackles':
          matchStats.tackles = { home: hv, away: av };
          homeStats.tackles = hv; awayStats.tackles = av; break;
        case 'fouls': case 'foulsConceded':
          matchStats.fouls = { home: hv, away: av };
          homeStats.fouls = hv; awayStats.fouls = av; break;
        case 'cornerKicks': case 'corners':
          matchStats.corners = { home: hv, away: av };
          homeStats.corners = hv; awayStats.corners = av; break;
        case 'offsides':
          matchStats.offsides = { home: hv, away: av };
          homeStats.offsides = hv; awayStats.offsides = av; break;
      }
    }
  }

  return { matchStats, homeStats, awayStats };
}

export async function scrapeMatchFromSofaScore(matchUrl: string): Promise<MatchData | null> {
  const eventId = extractEventId(matchUrl);
  if (!eventId) {
    console.error('Could not extract event ID from URL:', matchUrl);
    return null;
  }

  console.log(`  SofaScore event ID: ${eventId}`);

  try {
    const [eventRes, lineupsRes, incidentsRes, statsRes] = await Promise.allSettled([
      fetchJson(`https://api.sofascore.com/api/v1/event/${eventId}`),
      fetchJson(`https://api.sofascore.com/api/v1/event/${eventId}/lineups`),
      fetchJson(`https://api.sofascore.com/api/v1/event/${eventId}/incidents`),
      fetchJson(`https://api.sofascore.com/api/v1/event/${eventId}/statistics/0`),
    ]);

    if (eventRes.status === 'rejected') {
      console.error('Could not fetch event data:', eventRes.reason);
      return null;
    }

    const event = eventRes.value.event;

    const score = {
      home: event.homeScore?.current ?? null,
      away: event.awayScore?.current ?? null,
    };

    const matchTime = parseMatchTime(event);

    const date = event.startTimestamp
      ? new Date(event.startTimestamp * 1000).toISOString().split('T')[0]
      : undefined;

    let homeLineup: PlayerLineup[] = [];
    let awayLineup: PlayerLineup[] = [];
    if (lineupsRes.status === 'fulfilled') {
      homeLineup = parseLineup(lineupsRes.value.home?.players || []);
      awayLineup = parseLineup(lineupsRes.value.away?.players || []);
    }

    const homeGoals: GoalEvent[] = [];
    const awayGoals: GoalEvent[] = [];
    const homeCards: CardEvent[] = [];
    const awayCards: CardEvent[] = [];
    const events: MatchEvent[] = [];

    if (incidentsRes.status === 'fulfilled') {
      for (const inc of incidentsRes.value.incidents || []) {
        const minute = (inc.time ?? 0) + (inc.addedTime ?? 0);

        if (inc.incidentType === 'goal') {
          const goal: GoalEvent = {
            player: inc.player?.name || inc.player?.shortName || '',
            minute,
            isOwnGoal: inc.incidentClass === 'ownGoal',
            isFromPenalty: inc.incidentClass === 'penalty',
            assist: inc.assist1?.name ?? undefined,
          };
          if (inc.isHome) homeGoals.push(goal);
          else awayGoals.push(goal);

          events.push({ type: 'GOAL', minute, team: inc.isHome ? 'home' : 'away', description: goal.player });
        } else if (inc.incidentType === 'card') {
          const card: CardEvent = {
            player: inc.player?.name || inc.player?.shortName || '',
            minute,
            type: (inc.incidentClass === 'red' || inc.incidentClass === 'yellowRed') ? 'RED' : 'YELLOW',
          };
          if (inc.isHome) homeCards.push(card);
          else awayCards.push(card);

          events.push({ type: 'CARD', minute, team: inc.isHome ? 'home' : 'away', description: card.player });
        } else if (inc.incidentType === 'substitution') {
          events.push({
            type: 'SUBSTITUTION', minute,
            team: inc.isHome ? 'home' : 'away',
            description: `${inc.playerIn?.name || ''} ↔ ${inc.playerOut?.name || ''}`,
          });
        }
      }
    }

    let matchStats: MatchStats = {};
    let homeStats: TeamStats = emptyTeamStats();
    let awayStats: TeamStats = emptyTeamStats();
    if (statsRes.status === 'fulfilled') {
      const parsed = parseStats(statsRes.value.statistics || []);
      matchStats = parsed.matchStats;
      homeStats = parsed.homeStats;
      awayStats = parsed.awayStats;
    }

    return {
      homeTeam: event.homeTeam?.name || '',
      awayTeam: event.awayTeam?.name || '',
      date,
      score,
      matchTime,
      homeLineup,
      awayLineup,
      matchStats,
      homeStats,
      awayStats,
      events,
      homeGoals,
      awayGoals,
      homeCards,
      awayCards,
    };
  } catch (error) {
    console.error('Error fetching from SofaScore API:', error);
    return null;
  }
}

export async function findRMFemeninoMatch(matchDate: string, opponent: string): Promise<string | null> {
  try {
    const searchData = await fetchJson(
      'https://api.sofascore.com/api/v1/search/all?q=Real%20Madrid%20Femenino'
    );

    const teamResult = (searchData.results || []).find((r: any) =>
      r.type === 'team' &&
      r.entity?.name?.toLowerCase().includes('real madrid') &&
      r.entity?.name?.toLowerCase().includes('femenino')
    );

    if (!teamResult?.entity?.id) {
      console.error('Real Madrid Femenino not found in SofaScore search');
      return null;
    }

    const teamId = teamResult.entity.id;
    console.log(`  RM Femenino SofaScore team ID: ${teamId}`);
    
    const eventsData = await fetchJson(
      `https://api.sofascore.com/api/v1/team/${teamId}/events/next/0`
    );

    const evts: any[] = eventsData.events || [];

    const match = opponent
      ? evts.find((e: any) =>
          e.homeTeam?.name?.toLowerCase().includes(opponent.toLowerCase()) ||
          e.awayTeam?.name?.toLowerCase().includes(opponent.toLowerCase())
        )
      : evts[0];

    if (!match) {
      console.error(`No upcoming match found${opponent ? ` vs ${opponent}` : ''}`);
      return null;
    }

    return `https://www.sofascore.com/match/${match.id}`;
  } catch (error) {
    console.error('Error finding RM Femenino match:', error);
    return null;
  }
}
