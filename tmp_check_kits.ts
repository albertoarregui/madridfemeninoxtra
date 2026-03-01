
import { getPlayersDbClient } from './src/db/client';
import dotenv from 'dotenv';
dotenv.config();

async function checkKits() {
    const client = await getPlayersDbClient();
    if (!client) {
        console.error('No client');
        return;
    }

    try {
        console.log('--- Table: equipacion_partido ---');
        const epCols = await client.execute("PRAGMA table_info(equipacion_partido)");
        console.log(epCols.rows);

        console.log('--- Table: equipaciones ---');
        const eCols = await client.execute("PRAGMA table_info(equipaciones)");
        console.log(eCols.rows);

        const kitData = await client.execute(`
            SELECT ep.*, e.imagen_url 
            FROM equipacion_partido ep 
            JOIN equipaciones e ON ep.id_equipacion = e.id_equipacion
            LIMIT 5
        `);
        console.log('--- Sample Kit Data ---');
        console.log(kitData.rows);

    } catch (e) {
        console.error(e);
    }
}

checkKits();
