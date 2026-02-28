import { config } from 'dotenv';
config();
import { getPlayersDbClient } from '../src/db/client';

async function check() {
    const client = await getPlayersDbClient();
    try {
        const c = await client.execute('PRAGMA table_info(clubes)');
        console.log(JSON.stringify(c.rows.map(r => r.name), null, 2));
    } catch (err) { console.error("ERROR CAUGHT IN DEBUG:", err); }
}
check();
