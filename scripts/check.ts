import { config } from 'dotenv';
config();

import { fetchRivalsDirectly } from '../src/utils/rivales';

async function main() {
    const r = await fetchRivalsDirectly();
    console.log("RIVALES:", r.slice(0, 5).map(x => ({ nombre: x.nombre, stats: x.stats })));
}
main();
