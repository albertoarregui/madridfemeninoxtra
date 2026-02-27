
import { createClient } from '@libsql/client';

async function check() {
    try {
        const url = "libsql://realmadridfem-database-albertoarregui.turso.io";
        const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsicmciXSwiaWF0IjoxNzY2ODM1MzU3LCJpZCI6ImYxMjE1NWQyLTE1MDItNGFmOC1hZDE0LTE3YmFhZjBlMDUwNyIsImlzcyI6InR1cnNvIiwic3ViIjoiYWxiZXJ0b2FycmVndWkiLCJkYl9ndWlkIjoiZDY1NGRkNWMtOWM1Ni00MWZkLTliMzYtNzMwNDU1OTNiN2EwIiwiZ3JvdXBfZ3VpZCI6IjY5YTMxYzkwLTJjOGUtNGI5Zi1iNGVlLWZmYmZiZmRiYjM1YyIsImRlYnVnIjp7ImVtYWlsIjoiYWxiZXJ0b2FycmVndWlAZ21haWwuY29tIn0sImNvbnRleHQiOnsib3JnX2d1aWQiOiJiYzhlOTVmMWZmYjktNDlhYi04OGVjLTRjYThhNWQyYzM3YyIsImFjY291bnRzX2d1aWQiOiI3NzI5ZTI4Yi1iOWM4LTRhMTgtYWY1NS03YmZiZmRiYjM1YyIsImFjY291bnRzX2RldiI6ImFsYmVydG9hcnJlZ3VpIn19.QpxBHsd1geVYQ2DqA88u955Pc5PCw6mmmZ4i2EeWkrZibBOlznxzyrH10OpxBHsd1geVY";

        const client = createClient({ url, authToken });

        const info = await client.execute("PRAGMA table_info(goles_y_asistencias)");
        console.log("goles_y_asistencias columns:", JSON.stringify(info.rows, null, 2));

        const data = await client.execute("SELECT * FROM goles_y_asistencias LIMIT 5");
        console.log("goles_y_asistencias sample:", JSON.stringify(data.rows, null, 2));

        const players = await client.execute("SELECT nombre, foto_url FROM jugadoras WHERE foto_url IS NOT NULL LIMIT 5");
        console.log("Players with photos:", JSON.stringify(players.rows, null, 2));

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
