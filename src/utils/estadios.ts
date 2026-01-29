
import { KNOWN_LOCATIONS } from '../consts/location-data';
import { generateSlug } from './url-helper';

export interface StadiumSummary {
    name: string;
    city?: string;
    imageUrl?: string;
    slug: string;
    coordinates?: { lat: number, lng: number };
}

export function getAllStadiums(): StadiumSummary[] {
    // Filter only entries that look like stadiums (have imageUrl generally, or we filter explicitly)
    // Actually KNOWN_LOCATIONS mixes cities and stadiums.
    // We can filter by those having 'imageUrl' as a heuristic for "interesting place/stadium".

    return Object.entries(KNOWN_LOCATIONS)
        .filter(([key, loc]) => {
            // We want to list stadiums primarily. 
            // Cities usually don't have imageUrl in our data unless it represents a stadium in a generic way.
            // We can also filter by excluding known country entries if needed.
            return !!loc.imageUrl;
        })
        .map(([key, loc]) => {
            return {
                name: loc.label,
                // Extract city from label if possible (Text after comma usually)
                city: loc.label.includes(',') ? loc.label.split(',').pop()?.trim() : '',
                imageUrl: loc.imageUrl,
                slug: generateSlug(loc.label), // Use the label (Official Name) for the slug
                coordinates: { lat: loc.lat, lng: loc.lng }
            };
        })
        // Remove duplicates based on slug/name
        .filter((v, i, a) => a.findIndex(t => t.slug === v.slug) === i)
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchMatchesByStadium(stadiumName: string): Promise<any[]> {
    try {
        const { getDbClient } = await import('../db/client');
        const client = await getDbClient();

        if (!client) return [];

        const query = `
            SELECT 
                p.id_partido, p.fecha, p.hora, p.jornada, p.goles_rm, p.goles_rival, p.penaltis,
                c.competicion,
                cl.nombre as club_local,
                cv.nombre as club_visitante,
                t.temporada
            FROM partidos p
            LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
            LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
            LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
            WHERE e.nombre = ?
            ORDER BY p.fecha DESC
        `;

        const result = await client.execute({
            sql: query,
            args: [stadiumName]
        });

        return result.rows.map((row: any) => ({
            ...row,
            fecha_formateada: row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            slug: `${generateSlug(row.club_local)}-vs-${generateSlug(row.club_visitante)}-${row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : 'fecha'}`
        }));

    } catch (error) {
        console.error("Error fetching matches by stadium:", error);
        return [];
    }
}
