import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({
    url: process.env.TURSO_STATS_DATABASE_URL,
    authToken: process.env.TURSO_STATS_AUTH_TOKEN,
});

async function debugMatch266() {
    try {
        console.log('--- DEBUGGING MATCH 266 ---');

        const match = await db.execute({
            sql: "SELECT * FROM partidos WHERE id_partido = ?",
            args: [266]
        });

        const alineaciones = await db.execute({
            sql: "SELECT COUNT(*) as count FROM alineaciones WHERE id_partido = ?",
            args: [266]
        });

        const alineaciones_titulares = await db.execute({
            sql: "SELECT COUNT(*) as count FROM alineaciones WHERE id_partido = ? AND titular = 1",
            args: [266]
        });

        const goles = await db.execute({
            sql: "SELECT * FROM goles_y_asistencias WHERE id_partido = ?",
            args: [266]
        });

        const tarjetas = await db.execute({
            sql: "SELECT * FROM tarjetas WHERE id_partido = ?",
            args: [266]
        });

        console.log('\n[partidos]:', JSON.stringify(match.rows, null, 2));
        console.log('\n[goles_y_asistencias]:', goles.rows.length);
        console.log('[tarjetas]:', tarjetas.rows.length);
        console.log('\n[alineaciones count]:', alineaciones.rows[0].count);
        console.log('[alineaciones titulares]:', alineaciones_titulares.rows[0].count);

    } catch (error) {
        console.error(error);
    }
}

debugMatch266();
