
import { getPlayersDbClient } from './src/db/client.ts';

async function check() {
    try {
        const client = await getPlayersDbClient();
        if (!client) {
            console.error("No client");
            return;
        }

        const info = await client.execute("PRAGMA table_info(goles_y_asistencias)");
        console.log("goles_y_asistencias columns:", JSON.stringify(info.rows, null, 2));

        const data = await client.execute("SELECT * FROM goles_y_asistencias LIMIT 5");
        console.log("goles_y_asistencias sample:", JSON.stringify(data.rows, null, 2));

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
