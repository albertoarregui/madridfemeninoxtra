import { createClient } from "@libsql/client";

const url = "libsql://madridfemeninoxtra-albertoarregui.turso.io";
const authToken = "eyJhIjoiNjQ5NDIyYmZlYmM3YjgwNmZhNzJkODk5IiwiaWQiOiJtYWRyaWRmZW1lbmlub3h0cmEtYWxiZXJ0b2FycmVndWkiLCJraWQiOiJtb25zdGVyIn0.eyJpYXQiOjE3MzAyMjIwOTV9.P84_c-9dguPfq1wbG41D0vICe3Tf-7L-F_l3s8wb42tJ7tI4O9Z9xH_j_1v0l5_g5_p4_s3_k2_y1"; // Use actual token or process.env if available, but for debug I'll assume we need to set it or rely on existing env. 
// Ideally I should read from file or env. Since I cannot know the token, I will assume process.env.TURSO_AUTH_TOKEN is set in the environment where I run this.

const client = createClient({
    url: process.env.TURSO_DATABASE_URL || url,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function debug() {
    try {
        const rivalId = 32; // Barcelona
        console.log("Testing with Rival ID:", rivalId);

        const sql = `
            SELECT
                p.id_partido,
                p.fecha,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = p.id_partido AND t.id_equipo != ? AND (UPPER(t.tipo_tarjeta) LIKE '%AMARILLA%' OR UPPER(t.tipo_tarjeta) LIKE '%YELLOW%') AND UPPER(t.tipo_tarjeta) NOT LIKE '%DOBLE%') as amarillas_rm,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = p.id_partido AND t.id_equipo != ? AND (UPPER(t.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(t.tipo_tarjeta) LIKE '%RED%' OR UPPER(t.tipo_tarjeta) LIKE '%DOBLE%')) as rojas_rm
            FROM partidos p
            WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
            ORDER BY p.fecha DESC
            LIMIT 5
        `;

        const result = await client.execute({ sql, args: [rivalId, rivalId, rivalId, rivalId] });
        console.log("Query Result Rows:", result.rows);
    } catch (e) {
        console.error("Error:", e);
    }
}

debug();
