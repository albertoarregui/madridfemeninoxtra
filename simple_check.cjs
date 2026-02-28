
const { createClient } = require('@libsql/client');
require('dotenv').config();

async function check() {
    const client = createClient({
        url: process.env.TURSO_STATS_DATABASE_URL,
        authToken: process.env.TURSO_STATS_AUTH_TOKEN
    });

    const res = await client.execute({
        sql: "SELECT COUNT(*) as count FROM alineaciones WHERE id_partido = ?",
        args: [265]
    });
    console.log('Total alineaciones for 265:', res.rows[0].count);

    const tit = await client.execute({
        sql: "SELECT COUNT(*) as count FROM alineaciones WHERE id_partido = 265 AND titular = 1",
        args: []
    });
    console.log('Titulares for 265:', tit.rows[0].count);
}
check();
