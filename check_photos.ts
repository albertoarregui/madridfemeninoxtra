
import { getPlayersDbClient } from './src/db/client.ts';

async function check() {
    try {
        const client = await getPlayersDbClient();
        if (!client) {
            console.error("No client");
            return;
        }

        const result = await client.execute("SELECT nombre, foto_url FROM jugadoras WHERE nombre LIKE '%Caroline Weir%'");
        console.log("Player search result:", JSON.stringify(result.rows, null, 2));

        const goalResult = await client.execute(`
            SELECT 
                j.nombre as nombre_goleadora, 
                j.foto_url as foto_goleadora 
            FROM goles_y_asistencias g 
            LEFT JOIN jugadoras j ON g.goleadora = j.id_jugadora 
            LIMIT 5
        `);
        console.log("Goals photos test:", JSON.stringify(goalResult.rows, null, 2));

    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
