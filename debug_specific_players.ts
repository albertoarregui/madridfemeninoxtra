
import { createClient } from '@libsql/client';
import { normalizeLocationName, getCoordinates } from './src/consts/location-data';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

const targets = [
    "Kenti", "Robles",
    "Oihane", // Catch both Hernandez and San Martin
    "Andrea", "Alonso",
    "Amaya", "García",
    "Antonia", "Silva",
    "Lotte", "Keukelaar"
];

async function run() {
    console.log("Fetching players...");
    const result = await client.execute("SELECT nombre, lugar_nacimiento FROM jugadoras");

    const players = result.rows.filter((p: any) => {
        const name = p.nombre.toLowerCase();
        // Check if any target string is part of the name
        return targets.some(t => name.includes(t.toLowerCase()));
    });

    console.log(`\nFound ${players.length} matching players.`);
    console.log("\n--- DB VALUES & NORMALIZATION ---");
    players.forEach((p: any) => {
        const raw = p.lugar_nacimiento;
        const norm = normalizeLocationName(raw);
        const coords = getCoordinates(raw, 'city');
        console.log(`Player: ${p.nombre}`);
        console.log(`  Raw Birthplace: "${raw}"`);
        console.log(`  Normalized:     "${norm}"`);
        console.log(`  Found Coords:   ${coords ? 'YES (' + coords.label + ')' : 'NO'}`);
        console.log('---');
    });
}

run();
