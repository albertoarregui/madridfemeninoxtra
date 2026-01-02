
import { createClient } from "@libsql/client";
import { getCoordinates } from "../src/consts/location-data";

// User provided credentials
const url = "libsql://realmadridfem-database-madridfemeninoxtra.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTk0MTE2NjYsImlkIjoiODQzOTAxNmYtMGFjYS00Zjk1LWE3NDMtNWM3ZDU4ZWEzN2I2IiwicmlkIjoiZmNhM2I1ZmYtMGQyYi00MjA1LWJkMWYtNzBkNzU3MDZiNWNmIn0.Gj7PSxlUkjpUB9Wm49mvJ11cpyLJrJZsd2i3p7grFPq-jGzsR8bSgbiSWmrI8YJm5ZisCNz3HXJgz57BS0ZmDQ";

async function main() {
    const client = createClient({ url, authToken });

    try {
        console.log("--- Schema Inspection ---");
        const playersSchema = await client.execute("PRAGMA table_info(jugadoras)");
        console.log("Jugadoras Columns:", playersSchema.rows.map(r => r.name));

        const matchesSchema = await client.execute("PRAGMA table_info(partidos)");
        console.log("Partidos Columns:", matchesSchema.rows.map(r => r.name));
    } catch (e) {
        console.error("Schema inspection failed:", e);
    }

    console.log("--- Checking Players ---");
    try {
        const players = await client.execute("SELECT DISTINCT pais_origin FROM jugadoras");
        const missingPlayers = [];
        for (const row of players.rows) {
            const loc = row.pais_origin as string;
            // Skip null or empty
            if (!loc) continue;

            if (!getCoordinates(loc, 'city')) {
                missingPlayers.push(loc);
            }
        }
        if (missingPlayers.length > 0) {
            console.log("MISSING_PLAYERS_START");
            missingPlayers.forEach(p => console.log(p));
            console.log("MISSING_PLAYERS_END");
        } else {
            console.log("No missing player locations.");
        }
    } catch (e) {
        console.error("Error checking players:", e);
    }

    console.log("\n--- Checking Matches ---");
    try {
        const query = `
            SELECT 
                cl.nombre AS club_local,
                cv.nombre AS club_visitante,
                e.nombre AS estadio,
                e.ciudad
            FROM partidos p
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
            LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
        `;
        const matches = await client.execute(query);
        const missingMatches = new Set<string>();

        for (const row of matches.rows) {
            // Check Stadium
            if (row.estadio) {
                if (!getCoordinates(row.estadio as string, 'stadium')) missingMatches.add(`Stadium: ${row.estadio}`);
            }
            // Check City
            if (row.ciudad) {
                if (!getCoordinates(row.ciudad as string, 'city')) missingMatches.add(`City: ${row.ciudad}`);
            }
            // Check Club Local (as proxy for location if others missing)
            if (row.club_local && !row.estadio && !row.ciudad) {
                if (row.club_local !== 'Real Madrid' && row.club_local !== 'CD Tacón') {
                    if (!getCoordinates(row.club_local as string, 'stadium')) missingMatches.add(`Club: ${row.club_local}`);
                }
            }
        }

        if (missingMatches.size > 0) {
            console.log("MISSING_MATCHES_START");
            missingMatches.forEach(m => console.log(m));
            console.log("MISSING_MATCHES_END");
        } else {
            console.log("No missing match locations.");
        }
    } catch (e) {
        console.error("Error checking matches:", e);
    }
}

main();
