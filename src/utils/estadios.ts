
import { generateSlug } from './url-helper';
import { getAssetUrl } from './assets';

export interface StadiumSummary {
    name: string;
    city?: string;
    imageUrl?: string;
    slug: string;
    coordinates?: { lat: number, lng: number };
    capacity?: string | number;
}
export async function getAllStadiums(): Promise<StadiumSummary[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return [];

        const result = await client.execute(`
            SELECT DISTINCT e.nombre, e.ciudad, e.capacidad, e.lat, e.lng, e.foto_url
            FROM estadios e
            JOIN partidos p ON e.id_estadio = p.id_estadio
            WHERE e.foto_url IS NOT NULL
            ORDER BY e.nombre ASC
        `);

        return result.rows.map((row: any) => ({
            name: row.nombre,
            city: row.ciudad || '',
            imageUrl: row.foto_url?.startsWith('http') ? row.foto_url : getAssetUrl('estadios', row.nombre),
            slug: generateSlug(row.nombre),
            coordinates: (row.lat != null && row.lng != null)
                ? { lat: Number(row.lat), lng: Number(row.lng) }
                : undefined,
            capacity: row.capacidad
        }));
    } catch (e) {
        console.error('[getAllStadiums] Error:', e);
        return [];
    }
}

export async function fetchMatchesByStadium(stadiumName: string): Promise<any[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) return [];

        const query = `
            SELECT 
                p.id_partido, p.fecha, p.hora, p.jornada, p.goles_rm, p.goles_rival, p.penaltis,
                c.competicion,
                cl.nombre as club_local,
                cv.nombre as club_visitante,
                t.temporada,
                a.nombre as arbitra_nombre
            FROM partidos p
            LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
            LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
            LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
            LEFT JOIN arbitras a ON p.id_arbitra = a.id_arbitra
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

export async function fetchAllStadiumsWithStats(): Promise<any[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) return [];

        const query = `
            SELECT 
                e.nombre,
                e.ciudad,
                e.capacidad,
                e.lat,
                e.lng,
                COUNT(p.id_partido) as played,
                SUM(CASE 
                    WHEN CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 1 
                    WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND CAST(p.penaltis AS INTEGER) = 1 THEN 1
                    ELSE 0 
                END) as wins,
                SUM(CASE 
                    WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND (p.penaltis IS NULL OR p.penaltis = '') THEN 1 
                    ELSE 0 
                END) as draws,
                SUM(CASE 
                    WHEN CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 1 
                    WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND CAST(p.penaltis AS INTEGER) = 0 THEN 1
                    ELSE 0 
                END) as losses,
                SUM(CAST(p.goles_rm AS INTEGER)) as gf,
                SUM(CAST(p.goles_rival AS INTEGER)) as ga,
                e.foto_url
            FROM estadios e
            JOIN partidos p ON e.id_estadio = p.id_estadio
            WHERE p.goles_rm IS NOT NULL AND p.goles_rm != ''
            GROUP BY e.id_estadio, e.nombre, e.ciudad, e.capacidad, e.foto_url
            ORDER BY played DESC
        `;

        const result = await client.execute(query);
        const dbStadiums = result.rows;

        return dbStadiums.map((stadium: any) => {
            const slug = generateSlug(stadium.nombre);

            const played = Number(stadium.played);
            const wins = Number(stadium.wins);
            const draws = Number(stadium.draws);
            const losses = Number(stadium.losses);

            const winPct = played > 0 ? ((wins / played) * 100).toFixed(1) : '0.0';
            const drawPct = played > 0 ? ((draws / played) * 100).toFixed(1) : '0.0';
            const lossPct = played > 0 ? ((losses / played) * 100).toFixed(1) : '0.0';

            const photoUrl = stadium.foto_url;
            const finalImageUrl = (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')))
                ? photoUrl
                : getAssetUrl('estadios', photoUrl);

            return {
                name: stadium.nombre,
                city: stadium.ciudad || '',
                capacity: stadium.capacidad,
                imageUrl: finalImageUrl,
                foto_url: photoUrl,
                coordinates: (stadium.lat != null && stadium.lng != null)
                    ? { lat: Number(stadium.lat), lng: Number(stadium.lng) }
                    : undefined,
                slug: slug,
                stats: {
                    played,
                    wins,
                    draws,
                    losses,
                    gf: Number(stadium.gf),
                    ga: Number(stadium.ga),
                    gd: Number(stadium.gf) - Number(stadium.ga),
                    winPct,
                    drawPct,
                    lossPct
                }
            };
        });

    } catch (error) {
        console.error("Error fetching all stadiums stats:", error);
        return [];
    }
}


