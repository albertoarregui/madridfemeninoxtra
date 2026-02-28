
// Mock import.meta.glob for tsx
if (!global.import) global.import = {};
if (!global.import.meta) global.import.meta = {};
global.import.meta.glob = () => ({});

import { fetchMatchEvents, fetchMatchLineups, fetchMatchSubstitutions } from './src/utils/partidos';
import dotenv from 'dotenv';
dotenv.config();

async function debug() {
    try {
        const id = 265;
        console.log('--- Checking Match 265 with current code ---');

        const lineup = await fetchMatchLineups(id);
        console.log('Lineup length:', lineup.length);
        if (lineup.length > 0) console.log('Sample player:', lineup[0].name);

        const subs = await fetchMatchSubstitutions(id);
        console.log('Subs length:', subs.length);

        const events = await fetchMatchEvents(id);
        console.log('Events length:', events.length);
        console.log('Event types:', events.map(e => ({ t: e.type, m: e.minute })));
    } catch (e) {
        console.error('Error in debug:', e);
    }
}
debug();
