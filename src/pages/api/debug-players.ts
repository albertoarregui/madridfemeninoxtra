
import { type APIRoute } from 'astro';
import { createClient } from '@libsql/client';
import { normalizeLocationName, getCoordinates } from '../../consts/location-data';

export const GET: APIRoute = async () => {
    const url = import.meta.env.TURSO_DATABASE_URL;
    const authToken = import.meta.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error("DEBUG: Missing env vars in API route. URL:", url, "Token:", authToken ? "Set" : "Missing");
        return new Response(JSON.stringify({ error: 'Missing credentials', details: { hasUrl: !!url, hasToken: !!authToken } }), { status: 500 });
    }

    const client = createClient({ url, authToken });

    // Players reported as missing
    const targets = [
        "Linda", "Caicedo",
        "Sara", "Holmgaard",
        "Kenti", "Robles",
        "Oihane",
        "Andrea", "Alonso",
        "Amaya", "García",
        "Antonia", "Silva",
        "Lotte", "Keukelaar",
        "Irune", "Dorado"
    ];

    try {
        const result = await client.execute("SELECT nombre, lugar_nacimiento FROM jugadoras");

        const matchingPlayers = result.rows.filter((p: any) => {
            const name = String(p.nombre).toLowerCase();
            return targets.some(t => name.includes(t.toLowerCase()));
        });

        const debugData = matchingPlayers.map((p: any) => {
            const raw = p.lugar_nacimiento;
            const norm = normalizeLocationName(raw);
            const coords = getCoordinates(raw, 'city');
            return {
                name: p.nombre,
                raw_birthplace: raw,
                normalized: norm,
                has_coords: !!coords,
                coords_label: coords?.label
            };
        });

        return new Response(JSON.stringify(debugData, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
