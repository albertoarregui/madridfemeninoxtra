import { createClient } from '@libsql/client';
import "dotenv/config";

async function run() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    const db = createClient({ url, authToken });

    const res = await db.execute("SELECT * FROM tarjetas_rival LIMIT 5");
    console.log(res.rows);
}
run();
