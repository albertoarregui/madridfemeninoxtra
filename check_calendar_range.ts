
import { getPlayersDbClient } from './src/db/client.ts';

async function check() {
    try {
        const client = await getPlayersDbClient();
        if (!client) {
            console.error("No client");
            return;
        }

        const result = await client.execute("SELECT MIN(fecha) as min_fecha, MAX(fecha) as max_fecha, COUNT(*) as total FROM calendario");
        console.log("Calendar range:", JSON.stringify(result.rows, null, 2));

        const countsByMonth = await client.execute(`
            SELECT strftime('%Y-%m', fecha) as month, COUNT(*) as count 
            FROM calendario 
            GROUP BY month 
            ORDER BY month
        `);
        console.log("Matches by month:", JSON.stringify(countsByMonth.rows, null, 2));

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
