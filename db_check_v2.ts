
import { getPlayersDbClient } from './src/db/client.ts';

async function check() {
    try {
        const client = await getPlayersDbClient();
        if (!client) {
            console.error("No client");
            return;
        }
        console.log("Checking tables...");

        // Check calendario columns
        const calInfo = await client.execute("PRAGMA table_info(calendario)");
        console.log("Calendario columns:", JSON.stringify(calInfo.rows, null, 2));

        // Check jugadoras columns
        const playerInfo = await client.execute("PRAGMA table_info(jugadoras)");
        console.log("Jugadoras columns:", JSON.stringify(playerInfo.rows, null, 2));

        // Check some data
        const calData = await client.execute("SELECT * FROM calendario LIMIT 1");
        console.log("Calendario sample row:", JSON.stringify(calData.rows[0], null, 2));

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
