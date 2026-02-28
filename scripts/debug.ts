import { config } from 'dotenv';
config();
import { fetchRivalsDirectly } from '../src/utils/rivales';

async function main() {
    const rivals = await fetchRivalsDirectly();
    console.log("RIVALES:", rivals.length);
    if (rivals.length > 0) {
        console.log("First rival stats:", rivals[0].stats);
    }
}
main();
