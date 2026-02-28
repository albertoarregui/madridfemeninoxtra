
const { createClient } = require('@libsql/client');
require('dotenv').config();

async function run() {
    const client = createClient({
        url: process.env.TURSO_STATS_DATABASE_URL,
        authToken: process.env.TURSO_STATS_AUTH_TOKEN
    });

    const tables = ['tarjetas_rival', 'goles_propia', 'tanda_penaltis', 'alineaciones', 'goles_rival', 'tarjetas'];
    for (const table of tables) {
        const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='" + table + "'");
        console.log(table + ' exists:', res.rows.length > 0);
    }
}
run();
