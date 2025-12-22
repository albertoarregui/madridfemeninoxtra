import { createClient } from "@libsql/client";

const url = "libsql://madridfemeninoxtra-albertoarregui.turso.io";
const authToken = "eyJhIjoiNjQ5NDIyYmZlYmM3YjgwNmZhNzJkODk5IiwiaWQiOiJtYWRyaWRmZW1lbmlub3h0cmEtYWxiZXJ0b2FycmVndWkiLCJraWQiOiJtb25zdGVyIn0.eyJpYXQiOjE3MzAyMjIwOTV9.P84_c-9dguPfq1wbG41D0vICe3Tf-7L-F_l3s8wb42tJ7tI4O9Z9xH_j_1v0l5_g5_p4_s3_k2_y1";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL || url,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkSchema() {
    try {
        const result = await client.execute("SELECT * FROM tarjetas LIMIT 1");
        if (result.rows.length > 0) {
            console.log("Columns:", Object.keys(result.rows[0]));
            console.log("Sample Data:", result.rows[0]);
        } else {
            console.log("Table is empty, cannot check columns easily via SELECT *");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

checkSchema();
