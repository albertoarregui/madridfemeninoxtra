
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Tqn3NfLQ8cGxMWelzArZIL5CsZa0H6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVYQ2DqA88u955Pc5PCw";

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Checking tables...");
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
        console.log("Tables:", tables.rows.map(r => r.name));

        const gr = await client.execute("PRAGMA table_info(goles_rival);");
        console.log("goles_rival columns:", gr.rows);

        const tr = await client.execute("PRAGMA table_info(tarjetas_rival);");
        console.log("tarjetas_rival columns:", tr.rows);

    } catch (e) {
        console.error(e);
    }
}

run();
