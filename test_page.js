import 'dotenv/config';
import { fetchGamesDirectly, fetchMatchLineups, fetchMatchSubstitutions, fetchMatchEvents, fetchStadiumStats, fetchRefereeStats } from './src/utils/partidos.js';

async function testPage() {
    try {
        console.log("Fetching all games...");
        const allGames = await fetchGamesDirectly();
        console.log(`Found ${allGames.length} games.`);

        if (allGames.length === 0) return;

        const game = allGames[0];
        console.log(`\nTesting game: ${game.slug} (ID: ${game.id_partido})`);

        console.log("- Fetching lineup...");
        await fetchMatchLineups(game.id_partido);
        console.log("- Fetching subs...");
        await fetchMatchSubstitutions(game.id_partido);
        console.log("- Fetching events...");
        await fetchMatchEvents(game.id_partido, game.goles_rm);
        console.log("- Fetching stadium stats...");
        await fetchStadiumStats(game.estadio);
        console.log("- Fetching referee stats...");
        if (game.id_arbitra) await fetchRefereeStats(game.id_arbitra);

        console.log("\nALL FETCHES SUCCESSFUL!");
    } catch (error) {
        console.error("\nTEST FAILED:", error);
    }
}

testPage();
