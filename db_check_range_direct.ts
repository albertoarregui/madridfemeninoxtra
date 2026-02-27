
import { createClient } from '@libsql/client';

async function check() {
    try {
        const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
        const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODg1NzcsImlkIjoiOThlNTI2MzctZmI0OC00NzA3LWE0ODctNDk5ZjgyZTk3OGZkIiwiaXNzIjoidHVyc28iLCJzdWIiOiJhbGJlcnRvYXJyZWd1aSIsImRiX2d1aWQiOiJmNTA4Y2RlNS00NjA3LTQzNTAtOGNjZi00NWExYjhhMTY5MTgiLCJncm91cF9ndWlkIjoiNjlhMzFjOTAtMmM4ZS00YjlmLWI0ZWUtZmZiZmJmZGJiMzVjIiwiZGVidWciOnsiZW1haWwiOiJhbGJlcnRvYXJyZWd1aUBnbWFpbC5jb20ifSwiY29udGV4dCI6eyJvcmdfZ3VpZCI6ImJjOGU5NWYxZmZiOS00OWFiLTg4ZWMtNGNhOGE1ZDJjMzc slideyIsImFjY291bnRzX2d1aWQiOiI3NzI5ZTI4Yi1iOWM4LTRhMTgtYWY1NS03YmZiZmRiYjM1YyIsImFjY291bnRzX2RldiI6ImFsYmVydG9hcnJlZ3VpIn19.QpxBHsd1geVYQ2DqA88u955Pc5PCwmmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVY";

        const client = createClient({ url, authToken });

        const result = await client.execute("SELECT MIN(fecha) as min_fecha, MAX(fecha) as max_fecha, COUNT(*) as total FROM calendario");
        console.log("Calendar range:", JSON.stringify(result.rows, null, 2));

        const countsByMonth = await client.execute(`
            SELECT strftime('%Y-%m', fecha) as month, COUNT(*) as count 
            FROM calendario 
            GROUP BY month 
            ORDER BY month
        `);
        console.log("Matches by month:", JSON.stringify(countsByMonth.rows, null, 2));

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
