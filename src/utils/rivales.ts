export function slugify(text: string | null | undefined): string {
    if (!text) return 'desconocido';
    return text.toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

import { getAssetUrl } from './assets';
import { getFlagSrc } from './flags';

function normalizeFileName(name: string): string {
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_.-]/g, '');
}

export function getRivalShieldUrl(rival: any): string {
    const fotoUrl = rival.foto_url || rival.club_foto_url;
    if (fotoUrl && (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://'))) {
        return fotoUrl;
    }
    const name = rival.escudo_url || rival.nombre;
    const localUrl = getAssetUrl('escudos', name);
    if (localUrl && !localUrl.includes('media.madridfemeninoxtra.com')) {
        return localUrl;
    }
    // Fallback al CDN con nombre normalizado
    const cleanName = normalizeFileName(name || '');
    if (cleanName) {
        return `https://media.madridfemeninoxtra.com/escudos/${cleanName}.png`;
    }
    return localUrl;
}

export const cleanApiValue = (value: any): any => {
    if (typeof value === 'string' && value.toLowerCase().trim() === 'null') {
        return null;
    }
    return value;
};

export async function fetchRivalsDirectly(): Promise<any[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) {
            return [];
        }

        const query = `
            SELECT 
                c.id_club,
                c.nombre,
                c.ciudad,
                c.pais,
                c.iso,
                c.slug,
                c.escudo_url,
                e.nombre as estadio,
                e.capacidad,
                e.lat as estadio_lat,
                e.lng as estadio_lng,
                c.foto_url as club_foto_url,
                e.foto_url as estadio_foto_url,
                COUNT(DISTINCT CASE 
                    WHEN p.goles_rm IS NOT NULL 
                    AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%')
                    THEN p.id_partido 
                END) as played,
                SUM(CASE 
                    WHEN p.goles_rm IS NOT NULL 
                    AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%')
                    AND CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 1 
                    WHEN p.goles_rm IS NOT NULL 
                    AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%')
                    AND CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND CAST(p.penaltis AS INTEGER) = 1 THEN 1
                    ELSE 0 
                END) as wins,
                SUM(CASE 
                    WHEN p.goles_rm IS NOT NULL 
                    AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%')
                    AND CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND (p.penaltis IS NULL OR p.penaltis = '') THEN 1 
                    ELSE 0 
                END) as draws,
                SUM(CASE 
                    WHEN p.goles_rm IS NOT NULL 
                    AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%')
                    AND CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 1 
                    WHEN p.goles_rm IS NOT NULL 
                    AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%')
                    AND CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND CAST(p.penaltis AS INTEGER) = 0 THEN 1
                    ELSE 0 
                END) as losses,
                SUM(CASE WHEN p.goles_rm IS NOT NULL AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%') THEN CAST(p.goles_rm AS INTEGER) ELSE 0 END) as gf,
                SUM(CASE WHEN p.goles_rm IS NOT NULL AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%') THEN CAST(p.goles_rival AS INTEGER) ELSE 0 END) as ga,
                SUM(CASE WHEN p.goles_rm IS NOT NULL AND (comp.competicion IS NULL OR comp.competicion NOT LIKE '%Amistoso%') AND CAST(p.goles_rival AS INTEGER) = 0 THEN 1 ELSE 0 END) as clean_sheets
            FROM 
                clubes c
            LEFT JOIN
                estadios e ON c.estadio = e.id_estadio
            LEFT JOIN
                partidos p ON (p.id_club_local = c.id_club OR p.id_club_visitante = c.id_club)
            LEFT JOIN
                competiciones comp ON p.id_competicion = comp.id_competicion
            WHERE
                UPPER(c.nombre) NOT LIKE '%REAL MADRID%'
            GROUP BY
                c.id_club
            HAVING
                played > 0
            ORDER BY 
                played DESC, wins DESC, c.nombre ASC
        `;

        const result = await client.execute(query);

        return result.rows.map((rival: any) => {
            const played = Number(rival.played || 0);
            const wins = Number(rival.wins || 0);
            const draws = Number(rival.draws || 0);
            const losses = Number(rival.losses || 0);

            return {
                id_club: rival.id_club,
                nombre: cleanApiValue(rival.nombre) || '',
                ciudad: cleanApiValue(rival.ciudad) || '',
                pais: cleanApiValue(rival.pais) || '',
                iso: cleanApiValue(rival.iso) || '',
                flagUrl: getFlagSrc(cleanApiValue(rival.iso) || cleanApiValue(rival.pais) || undefined),
                slug: rival.slug || slugify(rival.nombre),
                estadio: cleanApiValue(rival.estadio) || '',
                capacidad: cleanApiValue(rival.capacidad) || '-',
                lat: rival.estadio_lat != null ? Number(rival.estadio_lat) : null,
                lng: rival.estadio_lng != null ? Number(rival.estadio_lng) : null,
                shieldUrl: getRivalShieldUrl(rival),
                escudo_url: cleanApiValue(rival.escudo_url),
                foto_url: cleanApiValue(rival.club_foto_url),
                estadio_foto_url: cleanApiValue(rival.estadio_foto_url),
                stats: {
                    played,
                    wins,
                    draws,
                    losses,
                    gf: Number(rival.gf || 0),
                    ga: Number(rival.ga || 0),
                    gd: Number(rival.gf || 0) - Number(rival.ga || 0),
                    cleanSheets: Number(rival.clean_sheets || 0),
                    winPct: played > 0 ? ((wins / played) * 100).toFixed(1) : '0.0',
                    drawPct: played > 0 ? ((draws / played) * 100).toFixed(1) : '0.0',
                    lossPct: played > 0 ? ((losses / played) * 100).toFixed(1) : '0.0'
                }
            };
        });
    } catch (error) {
        console.error("Error al obtener rivales directamente de la DB:", error);
        return [];
    }
}

export async function fetchRivals(): Promise<any[]> {
    const API_URL = '/api/rivals';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            console.error(`Error fetching rivals from API: ${response.status}`);
            return [];
        }

        const rivals = await response.json();

        if (!Array.isArray(rivals)) return [];

        return rivals.map(rival => {
            return {
                ...rival,
                slug: slugify(rival.nombre),
                shieldUrl: getRivalShieldUrl(rival),
                ciudad: cleanApiValue(rival.ciudad) || '',
                pais: cleanApiValue(rival.pais) || '',
            };
        });
    } catch (error) {
        console.error("Fallo al obtener rivales de la API:", error);
        return [];
    }
}
export async function fetchAllClubShields(): Promise<Record<string, string>> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return {};

        const result = await client.execute("SELECT nombre, foto_url, escudo_url FROM clubes");
        const map: Record<string, string> = {};

        result.rows.forEach((row: any) => {
            const shieldUrl = getRivalShieldUrl(row);
            if (!shieldUrl || !row.nombre) return;

            const nombre: string = row.nombre;
            // Key exacto
            map[nombre] = shieldUrl;
            // Sin "Femenino"
            const sinFemenino = nombre.replace(/\s*Femenino\s*/gi, '').trim();
            if (sinFemenino && sinFemenino !== nombre) map[sinFemenino] = shieldUrl;
            // Normalizado sin tildes
            const normalizado = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            if (normalizado !== nombre) map[normalizado] = shieldUrl;
        });

        return map;
    } catch (error) {
        console.error("Error fetching all club shields:", error);
        return {};
    }
}

export async function fetchClubCountDirectly(): Promise<number> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return 0;

        // Intentar contar clubes excluyendo Real Madrid con búsqueda insensible a mayúsculas
        const result = await client.execute("SELECT COUNT(*) as count FROM clubes WHERE UPPER(nombre) NOT LIKE '%REAL MADRID%'");
        const count = Number(result.rows[0]?.count || 0);

        if (count === 0) {
            // Fallback: contar todos y restar 1 (asumiendo que al menos está el RM)
            const fallback = await client.execute("SELECT COUNT(*) as count FROM clubes");
            const total = Number(fallback.rows[0]?.count || 0);
            return Math.max(0, total - 1);
        }

        return count;
    } catch (error) {
        console.error("Error fetching club count:", error);
        return 0;
    }
}
