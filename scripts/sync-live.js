import { scrapeMatchFromSofaScore, findRMFemeninoMatch } from '../utils/sofascore-scraper.js';
import { mapSofaScoreToDb } from '../utils/sofascore-mapper.js';
import { getCurrentMatchState, handlePostSyncBroadcast } from '../utils/match-change-detector.js';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function syncLiveMatch(matchId = null) {
  try {
    console.log('🔍 Buscando partido en vivo del Real Madrid Femenino...');

    const matchUrl = await findRMFemeninoMatch('', 'Real Madrid');

    if (!matchUrl) {
      console.log('❌ No se encontró ningún partido en vivo');
      return;
    }

    const matchStartTime = await getMatchStartTime(matchUrl);
    if (!matchStartTime) {
      console.log('⚠️ No se pudo determinar la hora del partido');
      return;
    }

    const now = new Date();
    const timeUntilMatch = matchStartTime.getTime() - now.getTime();
    const oneHourInMs = 60 * 60 * 1000;

    if (timeUntilMatch > oneHourInMs) {
      const hoursUntil = Math.floor(timeUntilMatch / oneHourInMs);
      const minutesUntil = Math.floor((timeUntilMatch % oneHourInMs) / (60 * 1000));
      console.log(`⏰ El partido comienza en ${hoursUntil}h ${minutesUntil}m. Livescore se activará 1 hora antes.`);
      return;
    }

    console.log(`📊 Scrapeando partido desde: ${matchUrl}`);

    const scrapedData = await scrapeMatchFromSofaScore(matchUrl);

    if (!scrapedData) {
      console.log('❌ Error al scrapear los datos');
      return;
    }

    console.log('🔄 Mapeando datos a base de datos...');

    const mappedData = await mapSofaScoreToDb(
      scrapedData,
      TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN
    );

    if (!mappedData) {
      console.log('❌ Error al mapear los datos');
      return;
    }

    console.log(`✅ Datos mapeados para partido ID: ${mappedData.matchId}`);

    const previousState = await getCurrentMatchState(
      mappedData.matchId,
      TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN
    );

    console.log('💾 Actualizando base de datos...');

    await handlePostSyncBroadcast(
      mappedData.matchId,
      previousState,
      TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN
    );

    console.log('🎉 ¡Partido sincronizado exitosamente!');
    console.log(`📈 Resultado: ${scrapedData.score.home} - ${scrapedData.score.away}`);
    console.log(`⏰ Minuto: ${scrapedData.time || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const matchId = process.argv[2];
  syncLiveMatch(matchId);
}

export { syncLiveMatch };