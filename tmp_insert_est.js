import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Tqn3NfLQ8cGxMWelzArZIL5CsZa0H6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVYQ2DqA88u955Pc5PCw";

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Copying records from alineaciones to estadisticas_jugadoras (ignoring orphans)...");

        // This query inserts the mapping. Or Ignores if they already exist
        const insertQuery = `
            INSERT OR IGNORE INTO estadisticas_jugadoras (id_est_jugadora, id_partido, id_jugadora)
            SELECT a.id_alineacion, a.id_partido, a.id_jugadora
            FROM alineaciones a
            JOIN partidos p ON a.id_partido = p.id_partido
            JOIN jugadoras j ON a.id_jugadora = j.id_jugadora;
        `;

        await client.execute(insertQuery);
        console.log("Done inserting rows!");

        const countRes = await client.execute("SELECT COUNT(*) as count FROM estadisticas_jugadoras");
        console.log(`Current rows in estadisticas_jugadoras: ${countRes.rows[0].count}`);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
