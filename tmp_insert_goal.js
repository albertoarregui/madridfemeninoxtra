
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Tqn3NfLQ8cGxMWelzArZIL5CsZa0H6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVYQ2DqA88u955Pc5PCw";

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Fetching valid id_partido...");
        const partidoRes = await client.execute("SELECT id_partido FROM partidos ORDER BY id_partido DESC LIMIT 1");
        const validId = partidoRes.rows[0].id_partido;
        console.log("Using id_partido:", validId);

        console.log("Inserting row into goles_rival...");
        const result = await client.execute({
            sql: "INSERT INTO goles_rival (id_gol_rival, id_partido, goleadora, minuto) VALUES (?, ?, ?, ?)",
            args: [280, validId, 'TBD', 0]
        });
        console.log("Insert result:", result);
    } catch (e) {
        console.error(e);
    }
}

run();
