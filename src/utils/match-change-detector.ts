import { broadcastMatchUpdate } from './live-stream';
import { createClient } from '@libsql/client';

export interface ChangeEvent {
  field: string;
  from: any;
  to: any;
  type: 'GOAL' | 'CARD' | 'SUBSTITUTION' | 'STAT' | 'TIME' | 'LINEUP';
}

export async function detectAndBroadcastChanges(
  matchId: string | number,
  previousSnapshot: any,
  newSnapshot: any
) {
  const changes: ChangeEvent[] = [];

  if (previousSnapshot?.goles_rm !== newSnapshot?.goles_rm) {
    changes.push({
      field: 'goles_rm',
      from: previousSnapshot?.goles_rm || 0,
      to: newSnapshot?.goles_rm || 0,
      type: 'GOAL',
    });
  }

  if (previousSnapshot?.goles_rival !== newSnapshot?.goles_rival) {
    changes.push({
      field: 'goles_rival',
      from: previousSnapshot?.goles_rival || 0,
      to: newSnapshot?.goles_rival || 0,
      type: 'GOAL',
    });
  }

  if (previousSnapshot?.tiempo_partido !== newSnapshot?.tiempo_partido) {
    changes.push({
      field: 'tiempo_partido',
      from: previousSnapshot?.tiempo_partido,
      to: newSnapshot?.tiempo_partido,
      type: 'TIME',
    });
  }

  if (previousSnapshot?.cards_count !== newSnapshot?.cards_count) {
    changes.push({
      field: 'tarjetas',
      from: previousSnapshot?.cards_count || 0,
      to: newSnapshot?.cards_count || 0,
      type: 'CARD',
    });
  }

  if (previousSnapshot?.lineups_count !== newSnapshot?.lineups_count) {
    changes.push({
      field: 'alineaciones',
      from: previousSnapshot?.lineups_count || 0,
      to: newSnapshot?.lineups_count || 0,
      type: 'LINEUP',
    });
  }

  if (previousSnapshot?.stats_count !== newSnapshot?.stats_count) {
    changes.push({
      field: 'estadisticas',
      from: previousSnapshot?.stats_count || 0,
      to: newSnapshot?.stats_count || 0,
      type: 'STAT',
    });
  }

  if (changes.length > 0) {
    console.log(`🔄 Broadcasting ${changes.length} changes for match ${matchId}`);

    broadcastMatchUpdate(matchId, 'match_update', {
      matchId,
      changes,
      timestamp: new Date().toISOString(),
    });

    if (
      changes.some((c) => c.type === 'GOAL' && c.field.includes('goles_'))
    ) {
      broadcastMatchUpdate(matchId, 'goal_scored', {
        matchId,
        homeScore: newSnapshot?.goles_rm,
        awayScore: newSnapshot?.goles_rival,
        time: newSnapshot?.tiempo_partido,
      });
    }

    if (changes.some((c) => c.type === 'CARD')) {
      broadcastMatchUpdate(matchId, 'card_shown', {
        matchId,
        message: 'Tarjeta mostrada',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return changes;
}

export async function getCurrentMatchState(
  matchId: string | number,
  dbUrl: string,
  dbToken: string
): Promise<any> {
  try {
    const client = createClient({ url: dbUrl, authToken: dbToken });

    const result = await client.execute({
      sql: `
        SELECT 
          p.id_partido,
          p.goles_rm,
          p.goles_rival,
          p.tiempo_partido,
          (SELECT COUNT(*) FROM alineaciones WHERE id_partido = p.id_partido) as lineups_count,
          (SELECT COUNT(*) FROM estadisticas_jugadoras WHERE id_partido = p.id_partido) as stats_count,
          (SELECT COUNT(*) FROM goles_y_asistencias WHERE id_partido = p.id_partido) + 
          (SELECT COUNT(*) FROM goles_rival WHERE id_partido = p.id_partido) as goals_count,
          (SELECT COUNT(*) FROM tarjetas WHERE id_partido = p.id_partido) + 
          (SELECT COUNT(*) FROM tarjetas_rival WHERE id_partido = p.id_partido) as cards_count
        FROM partidos p
        WHERE p.id_partido = ?
      `,
      args: [matchId],
    });

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting match state:', error);
    return null;
  }
}

export async function handlePostSyncBroadcast(
  matchId: string | number,
  previousState: any,
  dbUrl: string,
  dbToken: string
): Promise<void> {
  const newState = await getCurrentMatchState(matchId, dbUrl, dbToken);

  if (newState) {
    await detectAndBroadcastChanges(matchId, previousState, newState);
  }
}
