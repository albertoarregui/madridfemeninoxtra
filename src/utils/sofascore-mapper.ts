import { createClient } from '@libsql/client';
import type {
  MatchData,
  PlayerLineup,
  TeamStats,
  GoalEvent,
  CardEvent,
} from './sofascore-scraper';

export interface MappedMatchData {
  matchId: string | number;
  matchUpdates: {
    goles_rm: number;
    goles_rival: number;
    tiempo_partido?: string;
  };
  alineacionesHome: MappedLineup[];
  alineacionesAway: MappedLineup[];
  estadisticasPartido: StatsPartidoUpdate;
  estadisticasJugadoras: StatsJugadora[];
  goles: GoalUpdate[];
  golesRival: GoalRivalUpdate[];
  tarjetas: CardUpdate[];
  tarjetasRival: CardRivalUpdate[];
  penaltis?: PenaltyUpdate[];
}

export interface MappedLineup {
  id_jugadora: string | number;
  minutos_jugados: number;
  titular: boolean;
  convocada: boolean;
  minuto_salida?: number;
}

export interface StatsPartidoUpdate {
  posesion_local?: number;
  posesion_visitante?: number;
  tiros_local?: number;
  tiros_visitante?: number;
  tiros_puerta_local?: number;
  tiros_puerta_visitante?: number;
  pases_local?: number;
  pases_visitante?: number;
  pases_precision_local?: number;
  pases_precision_visitante?: number;
  tackles_local?: number;
  tackles_visitante?: number;
  faltas_local?: number;
  faltas_visitante?: number;
  corners_local?: number;
  corners_visitante?: number;
  fueras_de_juego_local?: number;
  fueras_de_juego_visitante?: number;
  [key: string]: any;
}

export interface StatsJugadora {
  id_jugadora: string | number;
  id_partido: string | number;
  valoracion?: number;
  pases_clave?: number;
  tiros_totales?: number;
  tiros_puerta?: number;
  toques?: number;
  toques_area_rival?: number;
  pases_completados?: number;
  pases_totales?: number;
  pases_ultimo_tercio_completados?: number;
  pases_ultimo_tercio_totales?: number;
  pases_largo_completados?: number;
  pases_largo_totales?: number;
  centros_completados?: number;
  centros_totales?: number;
  fueras_juego?: number;
  regates_completados?: number;
  regates_totales?: number;
  perdidas?: number;
  entradas?: number;
  intercepciones?: number;
  bloqueos?: number;
  despejes?: number;
  regateada?: number;
  duelos_suelo_ganados?: number;
  duelos_suelo_totales?: number;
  duelos_aereos_ganados?: number;
  duelos_aereos_totales?: number;
  faltas_recibidas?: number;
  faltas_cometidas?: number;
}

export interface GoalUpdate {
  id_jugadora: string | number;
  minuto: number;
  asistente?: string | number;
  tipo?: string;
}

export interface GoalRivalUpdate {
  id_club: number;
  jugadora_nombre?: string;
  minuto: number;
  asistente_nombre?: string;
  tipo?: string;
}

export interface CardUpdate {
  id_jugadora: string | number;
  minuto: number;
  tipo_tarjeta: 'AMARILLA' | 'ROJA';
}

export interface CardRivalUpdate {
  id_club: number;
  jugadora_nombre: string;
  minuto: number;
  tipo_tarjeta: 'AMARILLA' | 'ROJA';
}

export interface PenaltyUpdate {
  id_jugadora?: string | number;
  jugadora_nombre?: string;
  marcado: boolean;
  minuto?: number;
  es_local: boolean;
}

export async function mapSofaScoreToDb(
  scrapedData: MatchData,
  dbUrl: string,
  dbToken: string
): Promise<MappedMatchData | null> {
  const client = createClient({ url: dbUrl, authToken: dbToken });

  try {
    const isRMHome = scrapedData.homeTeam.toLowerCase().includes('real madrid');
    const rmLineup = isRMHome ? scrapedData.homeLineup : scrapedData.awayLineup;
    const rivalLineup = isRMHome ? scrapedData.awayLineup : scrapedData.homeLineup;
    const rmGoals = isRMHome ? scrapedData.homeGoals : scrapedData.awayGoals;
    const rivalGoals = isRMHome ? scrapedData.awayGoals : scrapedData.homeGoals;
    const rmCards = isRMHome ? scrapedData.homeCards : scrapedData.awayCards;
    const rivalCards = isRMHome ? scrapedData.awayCards : scrapedData.homeCards;
    const rivalTeam = isRMHome ? scrapedData.awayTeam : scrapedData.homeTeam;
    const matchId = await findMatchIdByTeamsAndDate(
      rivalTeam,
      scrapedData.date || null,
      client
    );

    if (!matchId) {
      console.warn(
        `Could not find match for ${scrapedData.homeTeam} vs ${scrapedData.awayTeam}`
      );
      return null;
    }

    console.log(`Mapped match ID: ${matchId}`);

    const matchInfo = await getMatchInfo(matchId, client);
    if (!matchInfo) {
      console.error(`Could not retrieve info for match ${matchId}`);
      return null;
    }

    const alineacionesHome = await mapLineups(rmLineup, client, true);
    const alineacionesAway = await mapLineups(rivalLineup, client, false);

    const estadisticasPartido = mapStats(scrapedData);

    const estadisticasJugadoras = await mapPlayerStats(
      rmLineup,
      rivalLineup,
      matchId,
      client
    );

    const rivalClubId = await getRivalClubId(rivalTeam, client);

    const goles = await mapGoals(rmGoals, matchId, client);
    const golesRival = mapGoalsRival(rivalGoals, rivalClubId);

    const tarjetas = await mapCards(rmCards, matchId, client);
    const tarjetasRival = mapCardsRival(rivalCards, rivalClubId);

    const penaltis = scrapedData.penalties
      ? await mapPenalties(scrapedData.penalties, matchId, client)
      : undefined;

    const rmScore = isRMHome ? (scrapedData.score.home ?? 0) : (scrapedData.score.away ?? 0);
    const rivalScore = isRMHome ? (scrapedData.score.away ?? 0) : (scrapedData.score.home ?? 0);

    return {
      matchId,
      matchUpdates: {
        goles_rm: rmScore,
        goles_rival: rivalScore,
        tiempo_partido: `${scrapedData.matchTime.period} ${scrapedData.matchTime.minute || ''}`,
      },
      alineacionesHome,
      alineacionesAway,
      estadisticasPartido,
      estadisticasJugadoras,
      goles,
      golesRival,
      tarjetas,
      tarjetasRival,
      penaltis,
    };
  } catch (error) {
    console.error('Error mapping SofaScore data:', error);
    return null;
  }
}

async function findMatchIdByTeamsAndDate(
  rivalTeam: string,
  date: string | null,
  client: any
): Promise<string | number | null> {
  try {
    const rivalKeyword = `%${rivalTeam.toLowerCase().replace(/femenino/gi, '').trim().split(' ').filter(w => w.length > 2).slice(0, 2).join('%')}%`;

    if (date) {
      const result = await client.execute({
        sql: `
          SELECT p.id_partido
          FROM partidos p
          LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
          LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
          WHERE (LOWER(cl.nombre) LIKE '%real madrid%' OR LOWER(cv.nombre) LIKE '%real madrid%')
            AND (LOWER(cl.nombre) LIKE ? OR LOWER(cv.nombre) LIKE ?)
            AND DATE(p.fecha) = ?
          LIMIT 1
        `,
        args: [rivalKeyword, rivalKeyword, date],
      });

      if (result.rows.length > 0) return result.rows[0].id_partido;
    }

    const fallback = await client.execute({
      sql: `
        SELECT p.id_partido
        FROM partidos p
        LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
        LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
        WHERE (LOWER(cl.nombre) LIKE '%real madrid%' OR LOWER(cv.nombre) LIKE '%real madrid%')
          AND (LOWER(cl.nombre) LIKE ? OR LOWER(cv.nombre) LIKE ?)
          AND p.goles_rm IS NULL
        ORDER BY p.fecha ASC
        LIMIT 1
      `,
      args: [rivalKeyword, rivalKeyword],
    });

    if (fallback.rows.length > 0) return fallback.rows[0].id_partido;

    return null;
  } catch (error) {
    console.error('Error finding match ID:', error);
    return null;
  }
}

async function getMatchInfo(
  matchId: string | number,
  client: any
): Promise<any> {
  try {
    const result = await client.execute({
      sql: `
        SELECT 
          p.id_temporada,
          p.id_competicion,
          p.id_club_local,
          p.id_club_visitante,
          t.temporada,
          c.competicion
        FROM partidos p
        LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
        LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
        WHERE p.id_partido = ?
      `,
      args: [matchId],
    });

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting match info:', error);
    return null;
  }
}

async function mapLineups(
  lineup: PlayerLineup[],
  client: any,
  isHome: boolean
): Promise<MappedLineup[]> {
  const mapped: MappedLineup[] = [];

  for (const player of lineup) {
    try {
      const jugadoraId = await findJugadoraByName(player.name, client);

      if (jugadoraId) {
        mapped.push({
          id_jugadora: jugadoraId,
          minutos_jugados: player.minutesPlayed || 0,
          titular: Boolean(player.starter),
          convocada: true,
          minuto_salida: player.substitutedOutMinute || undefined,
        });
      }
    } catch (error) {
      console.warn(`Could not map player ${player.name}:`, error);
    }
  }

  return mapped;
}

async function findJugadoraByName(
  name: string,
  client: any
): Promise<string | number | null> {
  if (!name.trim()) return null;
  try {
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];

    const r1 = await client.execute({
      sql: `SELECT id_jugadora, nombre FROM jugadoras WHERE LOWER(nombre) LIKE LOWER(?) ORDER BY LENGTH(nombre) ASC LIMIT 1`,
      args: [`%${name}%`],
    });
    if (r1.rows.length > 0) return r1.rows[0].id_jugadora;

    if (parts.length >= 2 && firstName !== lastName) {
      const r2 = await client.execute({
        sql: `SELECT id_jugadora, nombre FROM jugadoras WHERE LOWER(nombre) LIKE LOWER(?) AND LOWER(nombre) LIKE LOWER(?) ORDER BY LENGTH(nombre) ASC LIMIT 1`,
        args: [`%${firstName}%`, `%${lastName}%`],
      });
      if (r2.rows.length > 0) return r2.rows[0].id_jugadora;
    }

    const r3 = await client.execute({
      sql: `SELECT id_jugadora, nombre FROM jugadoras WHERE LOWER(nombre) LIKE LOWER(?) ORDER BY LENGTH(nombre) ASC LIMIT 1`,
      args: [`%${lastName}%`],
    });
    if (r3.rows.length > 0) return r3.rows[0].id_jugadora;

    return null;
  } catch (error) {
    console.error(`Error finding jugadora ${name}:`, error);
    return null;
  }
}

async function getRivalClubId(teamName: string, client: any): Promise<number> {
  try {
    const words = teamName
      .toLowerCase()
      .replace(/femenino|femeni|c\.f\.|cf|s\.a\.|sad/gi, '')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 2);

    if (words.length === 0) return 0;

    const keyword = `%${words.join('%')}%`;
    const result = await client.execute({
      sql: `SELECT id_club FROM clubes WHERE LOWER(nombre) LIKE LOWER(?) LIMIT 1`,
      args: [keyword],
    });

    if (result.rows.length > 0) return Number(result.rows[0].id_club);

    const r2 = await client.execute({
      sql: `SELECT id_club FROM clubes WHERE LOWER(nombre) LIKE LOWER(?) LIMIT 1`,
      args: [`%${words[0]}%`],
    });
    if (r2.rows.length > 0) return Number(r2.rows[0].id_club);

    return 0;
  } catch {
    return 0;
  }
}

function mapStats(scrapedData: MatchData): StatsPartidoUpdate {
  return {
    posesion_local: scrapedData.homeStats.possession || undefined,
    posesion_visitante: scrapedData.awayStats.possession || undefined,
    tiros_local: scrapedData.homeStats.shots || undefined,
    tiros_visitante: scrapedData.awayStats.shots || undefined,
    tiros_puerta_local: scrapedData.homeStats.shots_on_target || undefined,
    tiros_puerta_visitante: scrapedData.awayStats.shots_on_target || undefined,
    pases_local: scrapedData.homeStats.passes || undefined,
    pases_visitante: scrapedData.awayStats.passes || undefined,
    pases_precision_local: scrapedData.homeStats.passes_accuracy || undefined,
    pases_precision_visitante: scrapedData.awayStats.passes_accuracy || undefined,
    tackles_local: scrapedData.homeStats.tackles || undefined,
    tackles_visitante: scrapedData.awayStats.tackles || undefined,
    faltas_local: scrapedData.homeStats.fouls || undefined,
    faltas_visitante: scrapedData.awayStats.fouls || undefined,
    corners_local: scrapedData.homeStats.corners || undefined,
    corners_visitante: scrapedData.awayStats.corners || undefined,
    fueras_de_juego_local: scrapedData.homeStats.offsides || undefined,
    fueras_de_juego_visitante: scrapedData.awayStats.offsides || undefined,
  };
}

async function mapPlayerStats(
  homeLineup: PlayerLineup[],
  awayLineup: PlayerLineup[],
  matchId: string | number,
  client: any
): Promise<StatsJugadora[]> {
  const stats: StatsJugadora[] = [];
  const allPlayers = [...homeLineup, ...awayLineup];

  for (const player of allPlayers) {
    try {
      const jugadoraId = await findJugadoraByName(player.name, client);

      if (jugadoraId && player.stats) {
        stats.push({
          id_jugadora: jugadoraId,
          id_partido: matchId,
          valoracion: player.stats.rating,
          pases_clave: player.stats.keyPasses,
          tiros_totales: player.stats.shots?.total,
          tiros_puerta: player.stats.shots?.onTarget,
          toques: player.stats.balls?.touched,
          toques_area_rival: player.stats.balls?.inBox,
          pases_completados: player.stats.passes?.completed,
          pases_totales: player.stats.passes?.total,
          regates_completados: player.stats.dribbles?.completed,
          regates_totales: player.stats.dribbles?.total,
          duelos_suelo_ganados: player.stats.duels?.won,
          duelos_suelo_totales: player.stats.duels?.total,
          faltas_recibidas: player.stats.fouls?.suffered,
          faltas_cometidas: player.stats.fouls?.committed,
          centros_completados: player.stats.crosses?.completed,
          centros_totales: player.stats.crosses?.total,
          intercepciones: player.stats.interceptions,
          entradas: player.stats.tackles,
        });
      }
    } catch (error) {
      console.warn(`Could not map stats for ${player.name}`);
    }
  }

  return stats;
}

async function mapGoals(
  goals: GoalEvent[],
  matchId: string | number,
  client: any
): Promise<GoalUpdate[]> {
  const mapped: GoalUpdate[] = [];

  for (const goal of goals) {
    try {
      const jugadoraId = await findJugadoraByName(goal.player, client);

      if (jugadoraId) {
        let assistentId: string | number | undefined;
        if (goal.assist) {
          assistentId = await findJugadoraByName(goal.assist, client) ?? undefined;
        }

        mapped.push({
          id_jugadora: jugadoraId,
          minuto: goal.minute,
          asistente: assistentId,
          tipo: goal.isFromPenalty ? 'penalti' : undefined,
        });
      }
    } catch (error) {
      console.warn(`Could not map goal for ${goal.player}`);
    }
  }

  return mapped;
}

function mapGoalsRival(goals: GoalEvent[], rivalClubId: number): GoalRivalUpdate[] {
  return goals.map((goal) => ({
    id_club: rivalClubId,
    jugadora_nombre: goal.player,
    minuto: goal.minute,
    asistente_nombre: goal.assist,
    tipo: goal.isFromPenalty ? 'penalti' : undefined,
  }));
}

async function mapCards(
  cards: CardEvent[],
  matchId: string | number,
  client: any
): Promise<CardUpdate[]> {
  const mapped: CardUpdate[] = [];

  for (const card of cards) {
    try {
      const jugadoraId = await findJugadoraByName(card.player, client);

      if (jugadoraId) {
        mapped.push({
          id_jugadora: jugadoraId,
          minuto: card.minute,
          tipo_tarjeta:
            card.type === 'YELLOW' ? 'AMARILLA' : 'ROJA',
        });
      }
    } catch (error) {
      console.warn(`Could not map card for ${card.player}`);
    }
  }

  return mapped;
}

function mapCardsRival(cards: CardEvent[], rivalClubId: number): CardRivalUpdate[] {
  return cards.map((card) => ({
    id_club: rivalClubId,
    jugadora_nombre: card.player,
    minuto: card.minute,
    tipo_tarjeta: card.type === 'YELLOW' ? 'AMARILLA' : 'ROJA',
  }));
}

async function mapPenalties(
  penalties: any,
  matchId: string | number,
  client: any
): Promise<PenaltyUpdate[]> {
  const mapped: PenaltyUpdate[] = [];

  if (penalties.shootout) {
    for (const shot of penalties.shootout.home) {
      const jugadoraId = await findJugadoraByName(shot.player, client);
      mapped.push({
        id_jugadora: jugadoraId || undefined,
        jugadora_nombre: shot.player,
        marcado: shot.scored,
        minuto: shot.minute,
        es_local: true,
      });
    }

    for (const shot of penalties.shootout.away) {
      mapped.push({
        jugadora_nombre: shot.player,
        marcado: shot.scored,
        minuto: shot.minute,
        es_local: false,
      });
    }
  }

  return mapped;
}
