
import { getPlayersDbClient } from './src/db/client.js';

async function check() {
    const db = await getPlayersDbClient();
    if (!db) {
        console.log('No DB');
        return;
    }
    const clubs = await db.execute("SELECT id_club, nombre FROM clubes WHERE nombre LIKE '%Real Madrid%'");
    console.log('Clubs:', clubs.rows);
    const tarjetas = await db.execute("SELECT id_equipo, COUNT(*) as count FROM tarjetas GROUP BY id_equipo");
    console.log('Tarjetas counts by team ID:', tarjetas.rows);
}

check();
