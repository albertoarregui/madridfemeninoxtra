import 'dotenv/config';
import { getPlayersDbClient } from './src/db/client.js';

async function check() {
    const client = await getPlayersDbClient();
    if (!client) return;
    const r = await client.execute("PRAGMA table_info(estadisticas_partidos)");
    console.log(JSON.stringify(r.rows, null, 2));
}
check();
