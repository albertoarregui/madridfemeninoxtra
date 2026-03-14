
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    console.log('Connecting to:', url);

    const client = createClient({
        url: url || '',
        authToken: authToken || '',
    });

    try {
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables in DB:', tables.rows.map(r => r.name));

        if (tables.rows.find(r => r.name === 'partidos')) {
            console.log('Checking cards for a match...');
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
        }

        const rmCards = await client.execute('SELECT COUNT(*) as count FROM tarjetas WHERE id_equipo = 433 OR id_equipo = "433"');
        console.log('Total Real Madrid cards in tarjetas table:', rmCards.rows[0].count);

        const cardTypes = await client.execute('SELECT DISTINCT tipo_tarjeta FROM tarjetas');
        console.log('Distinct card types:', JSON.stringify(cardTypes.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

check();
