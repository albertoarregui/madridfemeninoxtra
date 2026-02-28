import 'dotenv/config';
import { getPlayersDbClient } from './src/db/client.js';

async function check() {
    const client = await getPlayersDbClient();
    if (!client) return;
    const r = await client.execute("PRAGMA table_info(goles_y_asistencias)");
    console.log(r.rows.map(c => c.name));
}
check();
