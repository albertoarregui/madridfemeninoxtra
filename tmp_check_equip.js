import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Tqn3NfLQ8cGxMWelzArZIL5CsZa0H6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVYQ2DqA88u955Pc5PCw";

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Schema for equipacion_partidos:");
        const res = await client.execute("SELECT sql FROM sqlite_master WHERE name='equipacion_partidos'");
        console.log(res.rows[0]?.sql);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
