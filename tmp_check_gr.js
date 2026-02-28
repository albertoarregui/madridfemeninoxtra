
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Tqn3NfLQ8cGxMWelzArZIL5CsZa0H6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVYQ2DqA88u955Pc5PCw";

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Checking goles_rival...");
        const res1 = await client.execute("SELECT COUNT(*) as count FROM goles_rival");
        console.log("Count:", res1.rows[0].count);
        const res2 = await client.execute("SELECT * FROM goles_rival ORDER BY id_gol_rival ASC LIMIT 5");
        console.log("First 5:", res2.rows);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
