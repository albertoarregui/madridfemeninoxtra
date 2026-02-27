
import { createClient } from '@libsql/client';

async function check() {
    try {
        const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
        const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiOThlNTI2MzctZmI0OC00NzA3LWE0ODctNDk5ZjgyZTk3OGZkIiwiaXNzIjoidHVyc28iLCJzdWIiOiJhbGJlcnRvYXJyZWd1aSIsImRiX2d1aWQiOiJmNTA4Y2RlNS00NjA3LTQzNTAtOGNjZi00NWExYjhhMTY5MTgiLCJncm91cF9ndWlkIjoiNjlhMzFjOTAtMmM4ZS00YjlmLWI0ZWUtZmZiZmJmZGJiMzVjIiwiZGVidWciOnsiZW1haWwiOiJhbGJlcnRvYXJyZWd1aUBnbWFpbC5jb20ifSwiY29udGV4dCI6eyJvcmdfZ3VpZCI6ImJjOGU5NWYxZmZiOS00OWFiLTg4ZWMtNGNhOGE1ZDJjMzc slideyIsImFjY291bnRzX2d1aWQiOiI3NzI5ZTI4Yi1iOWM4LTRhMTgtYWY1NS03YmZiZmRiYjM1YyIsImFjY291bnRzX2RldiI6ImFsYmVydG9hcnJlZ3VpIn19.QpxBHsd1geVYQ2DqA88u955Pc5PCwmmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVY";

        const client = createClient({ url, authToken });

        const result = await client.execute("SELECT COUNT(*) as count FROM clubes");
        console.log("Total clubs:", result.rows[0].count);

        const result2 = await client.execute("SELECT nombre FROM clubes LIMIT 10");
        console.log("Sample clubs:", JSON.stringify(result2.rows, null, 2));

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
