/**
 * SofaScore Live Match Sync Script
 * 
 * Usage:
 *   Manual: npx tsx scripts/sync-sofascore.ts --sofascore-url "https://www.sofascore.com/match/12345678" 
 *   Cron: npx tsx scripts/sync-sofascore.ts --watch (runs every 30s)
 *   
 * Can be used in package.json scripts or cron jobs:
 *  "sync:livematch": "tsx scripts/sync-sofascore.ts"
 *  "sync:watch": "tsx scripts/sync-sofascore.ts --watch"
 */

import { 
  scrapeMatchFromSofaScore, 
  findRMFemeninoMatch 
} from '../src/utils/sofascore-scraper';
import { mapSofaScoreToDb } from '../src/utils/sofascore-mapper';
import { 
  getCurrentMatchState,
  handlePostSyncBroadcast 
} from '../src/utils/match-change-detector';
import { getMatchStartTime } from '../src/utils/match-timing';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

interface StoredMatchState {
  lastScore: { home: number; away: number } | null;
  lastSync: Date;
  goalIds: Set<string>;
}

// Argument parsing
const args = process.argv.slice(2);
const softascoreUrl = args.find(a => a.startsWith('--sofascore-url'))?.split('=')[1];
const isWatch = args.includes('--watch');
const homeTeam = args.find(a => a.startsWith('--home'))?.split('=')[1] || 'Real Madrid Femenino';
const awayTeam = args.find(a => a.startsWith('--away'))?.split('=')[1];

// Stored state for deduplication
const matchState: Map<string | number, StoredMatchState> = new Map();

async function getDatabaseClient() {
  const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;
  
  if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    throw new Error('Turso credentials not configured');
  }
  
  return createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN
  });
}

/**
 * Single sync operation
 */
async function performSync(matchUrl: string): Promise<boolean> {
  try {
    console.log(`\n[${new Date().toISOString()}] Starting sync...`);
    console.log(`Match URL: ${matchUrl}`);

    // Check if match is within 1 hour of start time
    const matchStartTime = await getMatchStartTime(matchUrl);
    if (matchStartTime) {
      const now = new Date();
      const timeUntilMatch = matchStartTime.getTime() - now.getTime();
      const oneHourInMs = 60 * 60 * 1000;

      if (timeUntilMatch > oneHourInMs) {
        const hoursUntil = Math.floor(timeUntilMatch / oneHourInMs);
        const minutesUntil = Math.floor((timeUntilMatch % oneHourInMs) / (60 * 1000));
        console.log(`⏰ El partido comienza en ${hoursUntil}h ${minutesUntil}m. Livescore se activará 1 hora antes.`);
        return true; // Not an error, just not time yet
      }
    }

    // Step 1: Scrape
    console.log('▶ Scraping SofaScore...');
    const scrapedData = await scrapeMatchFromSofaScore(matchUrl);
    
    if (!scrapedData) {
      console.error('✗ Failed to scrape match');
      return false;
    }

    console.log(`✓ Scraped successfully: ${scrapedData.homeTeam} ${scrapedData.score.home} - ${scrapedData.score.away} ${scrapedData.awayTeam}`);
    console.log(`  Time: ${scrapedData.matchTime.period} ${scrapedData.matchTime.minute || ''}`);
    console.log(`  Home: ${scrapedData.homeLineup.length} players`);
    console.log(`  Away: ${scrapedData.awayLineup.length} players`);

    // Step 2: Get DB client
    const client = await getDatabaseClient();

    // Step 3: Map data
    console.log('▶ Mapping to database schema...');
    const mappedData = await mapSofaScoreToDb(
      scrapedData,
      process.env.TURSO_DATABASE_URL!,
      process.env.TURSO_AUTH_TOKEN!
    );

    if (!mappedData) {
      console.error('✗ Failed to map data');
      return false;
    }

    console.log(`✓ Mapped: Match ID ${mappedData.matchId}`);
    console.log(`  Lineups: ${mappedData.alineacionesHome.length + mappedData.alineacionesAway.length} players`);
    console.log(`  Goals: ${mappedData.goles.length + mappedData.golesRival.length}`);
    console.log(`  Cards: ${mappedData.tarjetas.length + mappedData.tarjetasRival.length}`);

    // Step 4: Get previous state for change detection
    const previousState = await getCurrentMatchState(
      mappedData.matchId,
      process.env.TURSO_DATABASE_URL!,
      process.env.TURSO_AUTH_TOKEN!
    );

    // Step 5: Check for changes
    const stateKey = mappedData.matchId;
    const currentState = matchState.get(stateKey);
    const newScore = { home: mappedData.matchUpdates.goles_rm, away: mappedData.matchUpdates.goles_rival };
    
    if (currentState) {
      const scoreChanged = 
        currentState.lastScore?.home !== newScore.home ||
        currentState.lastScore?.away !== newScore.away;

      const timeSinceLastSync = Date.now() - currentState.lastSync.getTime();
      
      if (!scoreChanged && timeSinceLastSync < 60000) {
        console.log(`ℹ No changes in last 60s, skipping DB update`);
        return true;
      }

      if (scoreChanged) {
        console.log(`ℹ Score changed: ${currentState.lastScore?.home}-${currentState.lastScore?.away} → ${newScore.home}-${newScore.away}`);
      }
    }

    // Step 5: Sync to database
    console.log('▶ Syncing to database...');
    const syncResult = await syncToDatabase(mappedData, client);

    if (!syncResult.success) {
      console.error('✗ Database sync failed:', syncResult.error);
      return false;
    }

    console.log(`✓ Database updated successfully`);
    console.log(`  Matches: ${syncResult.updates?.matches}`);
    console.log(`  Lineups: ${syncResult.updates?.lineups}`);
    console.log(`  Stats: ${syncResult.updates?.stats}`);
    console.log(`  Goals: ${syncResult.updates?.goals}`);
    console.log(`  Cards: ${syncResult.updates?.cards}`);

    // Step 6: Broadcast changes to live viewers
    console.log('▶ Broadcasting changes to live viewers...');
    try {
      await handlePostSyncBroadcast(
        mappedData.matchId,
        previousState,
        process.env.TURSO_DATABASE_URL!,
        process.env.TURSO_AUTH_TOKEN!
      );
      console.log(`✓ Changes broadcast to SSE subscribers`);
    } catch (broadcastError) {
      console.warn('⚠ Broadcast warning (non-critical):', broadcastError);
    }

    // Update state
    matchState.set(stateKey, {
      lastScore: newScore,
      lastSync: new Date(),
      goalIds: new Set(mappedData.goles.map((g: any) => `${g.id_jugadora}-${g.minuto}`))
    });

    return true;
  } catch (error: any) {
    console.error('✗ Sync error:', error.message);
    return false;
  }
}

/**
 * Simplified sync to database (same as API version but without response)
 */
async function syncToDatabase(mappedData: any, client: any): Promise<{ success: boolean; error?: string; updates?: any }> {
  try {
    const updates = {
      matches: 0,
      lineups: 0,
      stats: 0,
      goals: 0,
      cards: 0,
    };

    // 1. Update match score and time
    await client.execute({
      sql: `
        UPDATE partidos
        SET 
          goles_rm = ?,
          goles_rival = ?,
          tiempo_partido = ?
        WHERE id_partido = ?
      `,
      args: [
        mappedData.matchUpdates.goles_rm,
        mappedData.matchUpdates.goles_rival,
        mappedData.matchUpdates.tiempo_partido,
        mappedData.matchId,
      ],
    });
    updates.matches++;

    // Skip duplicate logic - just upsert
    for (const lineup of [...mappedData.alineacionesHome, ...mappedData.alineacionesAway]) {
      try {
        await client.execute({
          sql: `
            INSERT INTO alineaciones 
            (id_partido, id_jugadora, minutos_jugados, titular, minuto_salida)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id_partido, id_jugadora) DO UPDATE SET
            minutos_jugados = excluded.minutos_jugados,
            minuto_salida = excluded.minuto_salida
          `,
          args: [
            mappedData.matchId,
            lineup.id_jugadora,
            lineup.minutos_jugados,
            lineup.titular ? 1 : 0,
            lineup.minuto_salida || null,
          ],
        });
        updates.lineups++;
      } catch (e) {
        console.debug(`  Lineup upsert skipped (duplicate or error)`);
      }
    }

    // 2. Player stats
    for (const playerStats of mappedData.estadisticasJugadoras) {
      const fields = Object.keys(playerStats).filter(
        (k) => playerStats[k] !== undefined && playerStats[k] !== null
      );
      
      if (fields.length > 0) {
        try {
          const placeholders = Array(fields.length).fill('?').join(', ');
          const values = fields.map((f) => playerStats[f]);
          const setClause = fields.map((f) => `${f} = excluded.${f}`).join(', ');

          await client.execute({
            sql: `
              INSERT INTO estadisticas_jugadoras (${fields.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT(id_partido, id_jugadora) DO UPDATE SET ${setClause}
            `,
            args: values,
          });
          updates.stats++;
        } catch (e) {
          console.debug(`  Player stats upsert skipped`);
        }
      }
    }

    // 3. Goals
    for (const goal of mappedData.goles) {
      try {
        await client.execute({
          sql: `
            INSERT INTO goles_y_asistencias 
            (id_partido, goleadora, asistente, minuto, tipo)
            VALUES (?, ?, ?, ?, ?)
          `,
          args: [
            mappedData.matchId,
            goal.id_jugadora,
            goal.asistente || null,
            goal.minuto,
            goal.tipo || null,
          ],
        });
        updates.goals++;
      } catch (e) {
        console.debug(`  Goal insert skipped (duplicate)`);
      }
    }

    // 4. Cards
    for (const card of mappedData.tarjetas) {
      try {
        await client.execute({
          sql: `
            INSERT INTO tarjetas 
            (id_partido, id_jugadora, minuto, tipo_tarjeta)
            VALUES (?, ?, ?, ?)
          `,
          args: [
            mappedData.matchId,
            card.id_jugadora,
            card.minuto,
            card.tipo_tarjeta,
          ],
        });
        updates.cards++;
      } catch (e) {
        console.debug(`  Card insert skipped (duplicate)`);
      }
    }

    return { success: true, updates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    let matchUrl = softascoreUrl;

    if (!matchUrl && awayTeam) {
      console.log(`🔍 Finding SofaScore match: ${homeTeam} vs ${awayTeam}`);
      matchUrl = await findRMFemeninoMatch(new Date().toISOString().split('T')[0], awayTeam);
      
      if (!matchUrl) {
        console.error('Could not find match. Please provide --sofascore-url');
        process.exit(1);
      }
    }

    if (!matchUrl) {
      console.error('Usage:');
      console.error('  npx tsx scripts/sync-sofascore.ts --sofascore-url "https://sofascore.com/match/12345"');
      console.error('  npx tsx scripts/sync-sofascore.ts --away "Athletic Bilbao" --watch');
      process.exit(1);
    }

    if (isWatch) {
      console.log('▶ Watch mode enabled (sync every 30s)');
      console.log('Press Ctrl+C to stop\n');

      // Initial sync
      await performSync(matchUrl);

      // Repeat every 30s
      setInterval(async () => {
        await performSync(matchUrl);
      }, 30000);
    } else {
      const success = await performSync(matchUrl);
      process.exit(success ? 0 : 1);
    }
  } catch (error: any) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
