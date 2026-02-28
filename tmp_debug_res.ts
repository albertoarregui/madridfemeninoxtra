
import { fetchMatchEvents, fetchMatchLineups, fetchMatchSubstitutions, fetchGamesDirectly } from './src/utils/partidos';
import dotenv from 'dotenv';
dotenv.config();

async function debug() {
    const allGames = await fetchGamesDirectly();
    const game = allGames.find(g => g.id_partido === 265);
    if (!game) {
        console.log('Game 265 not found');
        return;
    }
    console.log('--- Debugging Match 265 ---');
    console.log('Game:', game.club_local, 'vs', game.club_visitante, 'Date:', game.fecha);

    const lineup = await fetchMatchLineups(game.id_partido);
    console.log('Lineup count:', lineup.length);

    const subs = await fetchMatchSubstitutions(game.id_partido);
    console.log('Subs count:', subs.length);

    const timeline = await fetchMatchEvents(game.id_partido, game.goles_rm);
    console.log('Events count:', timeline.length);
    console.log('Sample Event Types:', timeline.map(e => e.type));
}
debug();
