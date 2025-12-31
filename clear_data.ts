
import { turso } from "./src/lib/turso";

async function clearData() {
    console.log("Clearing data...");
    const tables = ['predictions', 'ratings', 'mvp_votes', 'season_awards', 'season-awards'];

    for (const table of tables) {
        try {
            await turso.execute(`DELETE FROM "${table}"`); // Quote for hyphenated names
            console.log(`Cleared ${table}`);
        } catch (e: any) {
            console.log(`Could not clear ${table}: ${e.message}`);
        }
    }
}

clearData();
