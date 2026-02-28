
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Tqn3NfLQ8cGxMWelzArZIL5CsZa0H6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVYQ2DqA88u955Pc5PCw";

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Renaming table jugadora_del_mes to mvp...");
        await client.execute("ALTER TABLE jugadora_del_mes RENAME TO mvp;");
        console.log("Table renamed successfully.");

        console.log("Adding column foto_url to mvp table...");
        await client.execute("ALTER TABLE mvp ADD COLUMN foto_url TEXT;");
        console.log("Column added successfully.");

        const info = await client.execute("PRAGMA table_info(mvp);");
        console.log("New table structure:", info.rows);

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
