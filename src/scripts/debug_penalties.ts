
import { createClient } from '@libsql/client';

const TURSO_DATABASE_URL = "libsql://season-awards-madridfemeninoxtra.aws-eu-west-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjY4MzUzNTcsImlkIjoiZjEyMTU1ZDItMTUyZi00NDg3LTliYmEtOGVjY2QwZDZkYWM3IiwicmlkIjoiYWM3Y2Q5M2QtYTg5OS00Yzc0LWFhZDMtYmQwZDQxODRjOWQwIn0.l4jiWFPy2EY1DhoGuNXq-fZ1gQ9u8dqPfJWyVzopXjzmaqp-g2k0T2lbcWcfbNT8-LuTN-O-nrSaj2bUATgUCQ";

async function getDbClient() {
    return createClient({
        url: TURSO_DATABASE_URL,
        authToken: TURSO_AUTH_TOKEN
    });
}

async function checkPenalties() {
    try {
        const client = await getDbClient();
        if (!client) {
            console.error("No client");
            return;
        }

        const query = `SELECT name FROM sqlite_master WHERE type='table'`;
        const result = await client.execute(query);
        console.log("Tables:", JSON.stringify(result.rows, null, 2));

        /*
        const query2 = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN id_jugadora IS NOT NULL THEN 1 ELSE 0 END) as with_player,
                SUM(CASE WHEN lanzadora_rival IS NOT NULL AND lanzadora_rival != '' THEN 1 ELSE 0 END) as with_rival_name,
                SUM(CASE WHEN id_jugadora IS NULL AND (lanzadora_rival IS NULL OR lanzadora_rival = '') THEN 1 ELSE 0 END) as mystery
            FROM penaltis
        `;
        const stats = await client.execute(query2);
        console.log("Stats:", JSON.stringify(stats.rows, null, 2));
        */

    } catch (e) {
        console.error(e);
    }
}

checkPenalties();
