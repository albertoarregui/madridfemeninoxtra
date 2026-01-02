
import { createClient } from '@libsql/client';
import { getCoordinates, normalizeLocationName, KNOWN_LOCATIONS } from './src/consts/location-data';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing env vars");
    process.exit(1);
}

const client = createClient({ url, authToken });

const missingPlayers = [
    "Misa Rodríguez", "Kenti Robles", "Daiane Limeira", "Babett Peter", "Thaisa Moreno",
    "Aurelie Kaci", "Maite Oroz", "Kosovare Asllani", "Sofia Jakobsson", "Yohana Gómez",
    "Ivana Andrés", "Teresa Abelleira", "Marta Corredera", "Chi Obogagu", "Jessica Martínez",
    "Esther González", "Nahikari García", "Méline Gerard", "Carla Camacho", "Paula Partido",
    "Linda Caicedo", "Freja Siri", "Bea Ortiz", "Mylène Chavas", "Olaya Rodríguez",
    "María Valle", "Sara López", "Andrea Alonso", "Amaya García", "Antonia Silva",
    "Yasmim Ribeiro", "María Méndez", "Sheila García", "Eva Navarro", "Maëlle Lakrar",
    "Irune Dorado", "Noe Bejarano", "Sara Däbritz", "Merle Frohms", "Hanna Bennison",
    "Sara Holmgaard", "Bella Andersson", "Iris Ashley Santiago", "Lotte Keukelaar",
    "Claudia de la Cuerda", "Noe Llamas", "Ohiane San Martín"
];

async function run() {
    console.log("Fetching players...");

    // Fetch all players to do a fuzzy name match if needed, or exact if possible
    const result = await client.execute("SELECT nombre, lugar_nacimiento FROM jugadoras");
    const allPlayers = result.rows;

    console.log(`Checking ${missingPlayers.length} reported missing players against ${allPlayers.length} total players.`);

    const foundInDb = [];
    const notFoundInDb = [];
    const missingLocationData = [];
    const missingCoords = [];

    for (const name of missingPlayers) {
        // Simple fuzzy match: check if DB name includes the reported surname/name or vice versa
        // Let's try to match loosely
        const player = allPlayers.find((p: any) => {
            const dbName = p.nombre.toLowerCase();
            const searchName = name.toLowerCase();
            return dbName.includes(searchName) || searchName.includes(dbName) ||
                (searchName.split(' ')[0] === dbName.split(' ')[0] && searchName.split(' ').pop() === dbName.split(' ').pop());
        });

        if (player) {
            foundInDb.push(player);
            const birthPlace = player.lugar_nacimiento;
            if (!birthPlace) {
                missingLocationData.push({ name: player.nombre, reason: "No lugar_nacimiento in DB" });
            } else {
                const coords = getCoordinates(birthPlace, 'city');
                if (!coords) {
                    missingCoords.push({ name: player.nombre, place: birthPlace, normalized: normalizeLocationName(birthPlace) });
                } else {
                    // Weird, user says they are missing but we have coords?
                    // Maybe the map limit (top 50?) or something else?
                    // console.log(`Configured correctly? ${player.nombre} -> ${birthPlace} -> ${coords.label}`);
                }
            }
        } else {
            notFoundInDb.push(name);
        }
    }

    console.log(`\n--- PLAYERS WITH NO BIRTHPLACE IN DB (${missingLocationData.length}) ---`);
    missingLocationData.forEach(p => console.log(`${p.name}`));

    console.log(`\n--- PLAYERS WITH UNMAPPED COORDINATES (${missingCoords.length}) ---`);
    missingCoords.forEach(p => console.log(`${p.name}: "${p.place}" (norm: ${p.normalized})`));

    console.log(`\n--- PLAYERS NOT FOUND IN DB (${notFoundInDb.length}) ---`);
    notFoundInDb.forEach(n => console.log(n));
}

run();
