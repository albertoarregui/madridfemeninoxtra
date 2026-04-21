import { createClient } from '@libsql/client';

const JSON_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*',
};

interface MatchSnapshot {
  id_partido: string | number;
  goles_rm: number;
  goles_rival: number;
  tiempo_partido: string;
  estado: 'P' | 'E' | 'V' | 'D';
  lineups_count: number;
  stats_count: number;
  goals_count: number;
  cards_count: number;
  last_update: number;
  hash: string; 
}

const activeStreams = new Map<number, Set<any>>();
const matchSnapshots = new Map<string | number, MatchSnapshot>();

export const GET = async ({ url }: { url: URL }) => {
  const matchId = url.searchParams.get('matchId');

  if (!matchId) {
    return new Response('Missing matchId parameter', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = import.meta.env;
  if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    return new Response('Database not configured', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  let encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream({
    async start(c: ReadableStreamDefaultController<Uint8Array>) {
      controller = c;

      const initialData = await getMatchSnapshot(
        matchId,
        TURSO_DATABASE_URL,
        TURSO_AUTH_TOKEN
      );

      if (initialData) {
        sendEvent(controller, encoder, 'connected', {
          message: 'Connected to live stream',
          matchId,
          data: initialData,
        });

        matchSnapshots.set(matchId, initialData);

        if (!activeStreams.has(Number(matchId))) {
          activeStreams.set(Number(matchId), new Set());
        }
        activeStreams.get(Number(matchId))?.add(controller);

        const interval = setInterval(async () => {
          try {
            const updated = await getMatchSnapshot(
              matchId,
              TURSO_DATABASE_URL,
              TURSO_AUTH_TOKEN
            );

            if (!updated) {
              clearInterval(interval);
              controller.close();
              return;
            }

            const previous = matchSnapshots.get(matchId);

            if (previous && updated.hash !== previous.hash) {
              const changes = detectChanges(previous, updated);

              if (changes.length > 0) {
                sendEvent(controller, encoder, 'update', {
                  matchId,
                  changes,
                  data: updated,
                  timestamp: new Date().toISOString(),
                });

                matchSnapshots.set(matchId, updated);
              }
            } else if (!previous) {
              matchSnapshots.set(matchId, updated);
            }

            sendEvent(controller, encoder, 'ping', { timestamp: Date.now() });
          } catch (error: any) {
            console.error('Stream error:', error);
            sendEvent(controller, encoder, 'error', {
              error: error.message,
            });
          }
        }, 5000); 

        controller.signal.addEventListener('abort', () => {
          clearInterval(interval);
          activeStreams.get(Number(matchId))?.delete(controller);
          matchSnapshots.delete(matchId);
        });
      } else {
        sendEvent(controller, encoder, 'error', {
          error: 'Match not found',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: JSON_HEADERS,
  });
};

async function getMatchSnapshot(
  matchId: string | number,
  dbUrl: string,
  dbToken: string
): Promise<MatchSnapshot | null> {
  try {
    const client = createClient({ url: dbUrl, authToken: dbToken });

    const matchResult = await client.execute({
      sql: `
        SELECT 
          p.id_partido,
          IFNULL(p.goles_rm, 0) as goles_rm,
          IFNULL(p.goles_rival, 0) as goles_rival,
          IFNULL(p.tiempo_partido, '') as tiempo_partido,
          CASE 
            WHEN p.goles_rm IS NULL THEN 'P'
            WHEN CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 'V'
            WHEN CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 'D'
            ELSE 'E'
          END as estado,
          (SELECT COUNT(*) FROM alineaciones WHERE id_partido = p.id_partido) as lineups_count,
          (SELECT COUNT(*) FROM estadisticas_jugadoras WHERE id_partido = p.id_partido) as stats_count,
          (SELECT COUNT(*) FROM goles_y_asistencias WHERE id_partido = p.id_partido) + 
          (SELECT COUNT(*) FROM goles_rival WHERE id_partido = p.id_partido) as goals_count,
          (SELECT COUNT(*) FROM tarjetas WHERE id_partido = p.id_partido) + 
          (SELECT COUNT(*) FROM tarjetas_rival WHERE id_partido = p.id_partido) as cards_count,
          CAST((julianday('now') * 86400000) AS INTEGER) as last_update
        FROM partidos p
        WHERE p.id_partido = ?
      `,
      args: [matchId],
    });

    if (matchResult.rows.length === 0) {
      return null;
    }

    const row = matchResult.rows[0] as any;

    const snapshot: MatchSnapshot = {
      id_partido: row.id_partido,
      goles_rm: row.goles_rm,
      goles_rival: row.goles_rival,
      tiempo_partido: row.tiempo_partido,
      estado: row.estado,
      lineups_count: row.lineups_count,
      stats_count: row.stats_count,
      goals_count: row.goals_count,
      cards_count: row.cards_count,
      last_update: row.last_update,
      hash: computeHash(row),
    };

    return snapshot;
  } catch (error) {
    console.error('Error getting match snapshot:', error);
    return null;
  }
}

function computeHash(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

function detectChanges(
  previous: MatchSnapshot,
  current: MatchSnapshot
): Array<{ field: string; from: any; to: any }> {
  const changes: Array<{ field: string; from: any; to: any }> = [];

  if (previous.goles_rm !== current.goles_rm) {
    changes.push({
      field: 'goles_rm',
      from: previous.goles_rm,
      to: current.goles_rm,
    });
  }

  if (previous.goles_rival !== current.goles_rival) {
    changes.push({
      field: 'goles_rival',
      from: previous.goles_rival,
      to: current.goles_rival,
    });
  }

  if (previous.tiempo_partido !== current.tiempo_partido) {
    changes.push({
      field: 'tiempo_partido',
      from: previous.tiempo_partido,
      to: current.tiempo_partido,
    });
  }

  if (previous.estado !== current.estado) {
    changes.push({
      field: 'estado',
      from: previous.estado,
      to: current.estado,
    });
  }

  if (previous.lineups_count !== current.lineups_count) {
    changes.push({
      field: 'lineups',
      from: previous.lineups_count,
      to: current.lineups_count,
    });
  }

  if (previous.stats_count !== current.stats_count) {
    changes.push({
      field: 'player_stats',
      from: previous.stats_count,
      to: current.stats_count,
    });
  }

  if (previous.goals_count !== current.goals_count) {
    changes.push({
      field: 'goals',
      from: previous.goals_count,
      to: current.goals_count,
    });
  }

  if (previous.cards_count !== current.cards_count) {
    changes.push({
      field: 'cards',
      from: previous.cards_count,
      to: current.cards_count,
    });
  }

  return changes;
}

function sendEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  eventType: string,
  data: any
): void {
  try {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  } catch (error) {
    console.error('Error sending event:', error);
  }
}

export function broadcastMatchUpdate(
  matchId: string | number,
  eventType: string,
  data: any
): void {
  const controllers = activeStreams.get(Number(matchId));

  if (!controllers) return;

  let encoder = new TextEncoder();

  controllers.forEach((controller) => {
    sendEvent(controller, encoder, eventType, data);
  });
}
