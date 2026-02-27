
import { getPlayersDbClient } from './src/db/client.ts';

async function check() {
    try {
        const client = await getPlayersDbClient();
        console.log("Checking tables...");

        // Check calendario columns
        const calInfo = await client.execute("PRAGMA table_info(calendario)");
        console.log("Calendario columns:", calInfo.rows.map(r => r.name).join(', '));

        // Check clubes columns
        const clubInfo = await client.execute("PRAGMA table_info(clubes)");
        console.log("Clubes columns:", clubInfo.rows.map(r => r.name).join(', '));

        // Test fetchClubCount
        const count = await client.execute("SELECT COUNT(*) as count FROM clubes WHERE nombre NOT LIKE '%Real Madrid%'");
        console.log("Club count test:", count.rows[0].count);

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
