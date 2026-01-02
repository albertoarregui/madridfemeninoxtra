
import type { APIRoute } from 'astro';
import { turso } from '../../../lib/turso';
import { getCoordinates } from '../../../consts/location-data';

export const GET: APIRoute = async () => {
    try {
        // Players
        const playersResult = await turso.execute("SELECT DISTINCT pais_origin FROM jugadoras");
        const missingPlayers = [];
        for (const row of playersResult.rows) {
            const loc = row.pais_origin as string;
            if (loc && !getCoordinates(loc, 'city')) {
                missingPlayers.push(loc);
            }
        }

        // Matches
        const matchesResult = await turso.execute("SELECT DISTINCT club_local, estadio, ciudad FROM partidos");
        const missingMatches = new Set<string>();

        for (const row of matchesResult.rows) {
            if (row.estadio) {
                if (!getCoordinates(row.estadio as string, 'stadium')) missingMatches.add(`Stadium: ${row.estadio}`);
            }
            if (row.ciudad) {
                if (!getCoordinates(row.ciudad as string, 'city')) missingMatches.add(`City: ${row.ciudad}`);
            }
            if (row.club_local && !row.estadio && !row.ciudad) {
                if (row.club_local !== 'Real Madrid') {
                    if (!getCoordinates(row.club_local as string, 'stadium')) missingMatches.add(`Club/Location: ${row.club_local}`);
                }
            }
        }

        return new Response(JSON.stringify({
            missingPlayers,
            missingMatches: Array.from(missingMatches)
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
};
