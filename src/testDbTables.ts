import { createClient } from '@libsql/client';
import "dotenv/config";
async function run() {
    const url = process.env.TURSO_PLAYERS_DATABASE_URL;
    const authToken = process.env.TURSO_PLAYERS_AUTH_TOKEN;
    const db = createClient({ url, authToken });
    const res = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log(res.rows);
}
run();
