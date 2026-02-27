
import { createClient } from '@libsql/client';

async function check() {
    try {
        const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
        const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiOThlNTI2MzctZmI0OC00NzA3LWE0ODctNDk5ZjgyZTk3OGZkIiwiaXNzIjoidHVyc28iLCJzdWIiOiJhbGJlcnRvYXJyZWd1aSIsImRiX2d1aWQiOiJmNTA4Y2RlNS00NjA3LTQzNTAtOGNjZi00NWExYjhhMTY5MTgiLCJncm91cF9ndWlkIjoiNjlhMzFjOTAtMmM4ZS00YjlmLWI0ZWUtZmZiZmJmZGJiMzVjIiwiZGVidWciOnsiZW1haWwiOiJhbGJlcnRvYXJyZWd1aUBnbWFpbC5jb20ifSwiY29udGV4dCI6eyJvcmdfZ3VpZCI6ImJjOGU5NWYxZmZiOS00OWFiLTg4ZWMtNGNhOGE1ZDJjMzc slideyIsImFjY291bnRzX2d1aWQiOiI3NzI5ZTI4Yi1iOWM4LTRhMTgtYWY1NS03YmZiZmRiYjM1YyIsImFjY291bnRzX2RldiI6ImFsYmVydG9hcnJlZ3VpIn19.QpxBHsd1geVYQ2DqA88u955Pc5PCwmmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVY";

        const client = createClient({ url, authToken });

        console.log("Checking dorsales table...");
        const info = await client.execute("PRAGMA table_info(dorsales)");
        console.log("Dorsales columns:", JSON.stringify(info.rows, null, 2));

        const data = await client.execute("SELECT * FROM dorsales WHERE foto_url IS NOT NULL LIMIT 3");
        console.log("Dorsales sample:", JSON.stringify(data.rows, null, 2));

        const joinTest = await client.execute(`
            SELECT d.foto_url, j.nombre, d.id_temporada
            FROM dorsales d 
            JOIN jugadoras j ON d.id_jugadora = j.id_jugadora
            WHERE d.foto_url IS NOT NULL 
            ORDER BY d.id_temporada DESC 
            LIMIT 5
        `);
        console.log("Join test result:", JSON.stringify(joinTest.rows, null, 2));

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
