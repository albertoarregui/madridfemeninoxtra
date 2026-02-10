import 'dotenv/config';
import { getPlayersDbClient } from './src/db/client';

async function verifyAwards() {
    const client = await getPlayersDbClient();
    if (!client) return;

    const query = `
        SELECT p.id_premio, p.id_jugadora, j.nombre, p.fecha 
        FROM jugadora_del_mes p 
        JOIN jugadoras j ON p.id_jugadora = j.id_jugadora 
        ORDER BY p.id_premio DESC 
        LIMIT 10
    `;

    const result = await client.execute(query);
    console.log('--- ÚLTIMOS PREMIOS ---');
    result.rows.forEach(r => {
        console.log(`ID: ${r.id_premio} | Player: ${r.nombre} | Date: ${r.fecha}`);
    });
    process.exit(0);
}

verifyAwards();
