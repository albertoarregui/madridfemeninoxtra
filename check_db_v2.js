
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL || '',
        authToken: process.env.TURSO_AUTH_TOKEN || '',
    });

    try {
        console.log('Checking cards for a match...');
        // Get some matches
        const matches = await client.execute('SELECT id_partido, id_club_local, id_club_visitante FROM partidos LIMIT 5');
        console.log('Sample matches:', JSON.stringify(matches.rows, null, 2));

        if (matches.rows.length > 0) {
            const matchId = matches.rows[0].id_partido;
            const cards = await client.execute({
                sql: 'SELECT * FROM tarjetas WHERE id_partido = ?',
                args: [matchId]
            });
            console.log(`Cards for match ${matchId}:`, JSON.stringify(cards.rows, null, 2));
        }

        const rmCards = await client.execute('SELECT COUNT(*) as count FROM tarjetas WHERE id_equipo = 433 OR id_equipo = "433"');
        console.log('Total Real Madrid cards (local/visitor check):', rmCards.rows[0].count);

        const cardTypes = await client.execute('SELECT DISTINCT tipo_tarjeta FROM tarjetas');
        console.log('Distinct card types:', JSON.stringify(cardTypes.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

check();
