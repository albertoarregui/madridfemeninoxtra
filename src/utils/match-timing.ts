import { extractEventId } from './sofascore-scraper';

const API_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://www.sofascore.com/',
  'Origin': 'https://www.sofascore.com',
};

export async function getMatchStartTime(matchUrl: string): Promise<Date | null> {
  const eventId = extractEventId(matchUrl);
  if (!eventId) {
    console.warn('⚠ Could not extract event ID from URL:', matchUrl);
    return null;
  }

  try {
    const res = await fetch(`https://api.sofascore.com/api/v1/event/${eventId}`, {
      headers: API_HEADERS,
    });

    if (!res.ok) {
      console.warn(`⚠ SofaScore API error ${res.status} for event ${eventId}`);
      return null;
    }

    const data = await res.json();
    const timestamp = data.event?.startTimestamp;

    if (!timestamp) {
      console.warn('⚠ No startTimestamp in SofaScore event response');
      return null;
    }

    return new Date(timestamp * 1000);
  } catch (error) {
    console.warn('⚠ Error getting match start time:', error);
    return null;
  }
}
