
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Tqn3NfLQ8cGxMWelzArZIL5CsZa0H6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVYQ2DqA88u955Pc5PCw";

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Checking goles_y_asistencias schema...");
        const res = await client.execute("SELECT sql FROM sqlite_master WHERE name='goles_y_asistencias'");
        console.log(res.rows[0].sql);

        console.log("Inserting rows 1 to 279 in goles_rival...");
        const queries = [];
        for (let i = 1; i <= 279; i++) {
            queries.push(`INSERT INTO goles_rival (id_gol_rival, id_partido, goleadora, minuto) VALUES (${i}, 265, 'TBD', 0)`);
        }

        // Ejecutar en batch
        await client.executeMultiple(queries.join('; '));
        console.log("Inserted 279 rows successfully.");

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
