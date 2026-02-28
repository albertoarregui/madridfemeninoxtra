import 'dotenv/config';
import { getPlayersDbClient } from './src/db/client.js';

async function checkDorsales() {
    try {
        const client = await getPlayersDbClient();
        if (!client) return;

        const result = await client.execute("PRAGMA table_info(dorsales)");
        console.log("Columns in 'dorsales':");
        result.rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

checkDorsales();
