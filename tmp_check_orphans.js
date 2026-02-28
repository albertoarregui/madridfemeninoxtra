import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Tqn3NfLQ8cGxMWelzArZIL5CsZa0H6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVYQ2DqA88u955Pc5PCw";

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Checking for orphaned alineaciones records...");

        const qPartido = `
            SELECT a.id_alineacion, a.id_partido
            FROM alineaciones a
            LEFT JOIN partidos p ON a.id_partido = p.id_partido
            WHERE p.id_partido IS NULL
        `;
        const resPartido = await client.execute(qPartido);
        console.log("Invalid partids:", resPartido.rows);

        const qJugadora = `
            SELECT a.id_alineacion, a.id_jugadora
            FROM alineaciones a
            LEFT JOIN jugadoras j ON a.id_jugadora = j.id_jugadora
            WHERE j.id_jugadora IS NULL
        `;
        const resJugadora = await client.execute(qJugadora);
        console.log("Invalid jugadoras:", resJugadora.rows);

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
