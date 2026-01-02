
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

async function run() {
    console.log("Fetching matches...");
    const result = await client.execute(`
            SELECT
                p.id_partido,
                cl.nombre AS club_local,
                e.nombre AS estadio,
                e.ciudad
            FROM partidos p
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
    `);

    const matches = result.rows;
    console.log(`Total Matches: ${matches.length}`);

    let totalTrips = 0;
    let homeGames = 0;
    let missingLocs = [];
    let tripsList = [];

    matches.forEach((m: any) => {
        const localNameNormalized = normalizeLocationName(m.club_local);
        const stadiumNameNormalized = m.estadio ? normalizeLocationName(m.estadio) : '';

        const isHomeGame = localNameNormalized.includes('realmadrid') ||
            localNameNormalized.includes('tacon') ||
            localNameNormalized.includes('alfredo') ||
            stadiumNameNormalized.includes('alfredo') ||
            stadiumNameNormalized.includes('ciudadrealmadrid');

        if (isHomeGame) {
            homeGames++;
        } else {
            const locationName = m.estadio || m.ciudad || m.club_local;
            const hostCoords = getCoordinates(locationName, 'stadium');

            if (hostCoords) {
                totalTrips++;
                tripsList.push(`${m.club_local} (Loc: ${locationName})`);
            } else {
                missingLocs.push(`${m.club_local} (Loc: ${locationName})`);
            }
        }
    });

    console.log(`Home Games: ${homeGames}`);
    console.log(`Away Games (Potential Trips): ${matches.length - homeGames}`);
    console.log(`Trips Counted: ${totalTrips}`);
    console.log(`Missing Locations: ${missingLocs.length}`);

    if (missingLocs.length > 0) {
        console.log("\n--- MISSING LOCATIONS ---");
        missingLocs.forEach(l => console.log(l));
    }

    // Check if Madrid teams are in tripsList
    const madridTrips = tripsList.filter(t => t.toLowerCase().includes('atletico') || t.toLowerCase().includes('madrid cff') || t.toLowerCase().includes('rayo'));
    console.log(`\nTrips to local rivals (Atleti, Madrid CFF, Rayo): ${madridTrips.length}`);
}

run();
