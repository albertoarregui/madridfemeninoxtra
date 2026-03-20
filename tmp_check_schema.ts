import { getPlayersDbClient } from './src/db/client';

async function check() {
    const client = await getPlayersDbClient();
    if (!client) return;
    const res = await client.execute("PRAGMA table_info(estadisticas_jugadoras)");
    console.log(JSON.stringify(res.rows, null, 2));
}

check();
