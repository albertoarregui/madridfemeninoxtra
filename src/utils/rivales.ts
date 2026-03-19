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
    const name = rival.nombre;
    const localUrl = getAssetUrl('escudos', name);
    if (localUrl && !localUrl.includes('media.madridfemeninoxtra.com')) {
        return localUrl;
    }

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

        const clubsQuery = `
            SELECT 
                c.id_club,
                c.nombre,
                c.ciudad,
                c.pais,
                c.iso,
                c.slug,
                c.foto_url as club_foto_url,
                e.nombre as estadio,
                e.capacidad,
                e.lat as estadio_lat,
                e.lng as estadio_lng,
                e.foto_url as estadio_foto_url
            FROM clubes c
            LEFT JOIN estadios e ON c.estadio = e.id_estadio
            WHERE UPPER(c.nombre) NOT LIKE '%REAL MADRID%'
            ORDER BY c.nombre ASC
        `;

        const matchesQuery = `
            SELECT 
                p.id_partido,
                p.id_club_local,
                p.id_club_visitante,
                p.goles_rm,
                p.goles_rival,
                p.penaltis,
                comp.competicion
            FROM partidos p
            LEFT JOIN competiciones comp ON p.id_competicion = comp.id_competicion
            WHERE p.goles_rm IS NOT NULL
        `;

        const [clubsResult, matchesResult] = await Promise.all([
            client.execute(clubsQuery),
            client.execute(matchesQuery)
        ]);

        const statsMap = new Map<any, {
            played: number; wins: number; draws: number; losses: number;
            gf: number; ga: number; cleanSheets: number;
        }>();

        matchesResult.rows.forEach((m: any) => {
            const comp = (m.competicion || '').toLowerCase();
            const isAmistoso = comp.includes('amistoso') || comp.includes('friendly');
            if (isAmistoso) return;

            const localId = String(m.id_club_local);
            const visitanteId = String(m.id_club_visitante);
            const gRM = Number(m.goles_rm) || 0;
            const gRiv = Number(m.goles_rival) || 0;
            const pen = String(m.penaltis || '').trim();

            let result: 'W' | 'D' | 'L';
            if (gRM > gRiv) result = 'W';
            else if (gRM < gRiv) result = 'L';
            else if (pen === '1') result = 'W';
            else if (pen === '0') result = 'L';
            else result = 'D';




            for (const clubId of [localId, visitanteId]) {
                if (!clubId) continue;
                if (!statsMap.has(clubId)) {
                    statsMap.set(clubId, { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, cleanSheets: 0 });
                }
                const s = statsMap.get(clubId)!;
                s.played += 1;

                if (result === 'W') s.wins += 1;
                else if (result === 'L') s.losses += 1;
                else s.draws += 1;

                s.gf += gRM;
                s.ga += gRiv;
                if (gRiv === 0) s.cleanSheets += 1;
            }
        });

        const rivals = clubsResult.rows
            .map((rival: any) => {
                const s = statsMap.get(String(rival.id_club));
                if (!s || s.played === 0) return null;

                const played = s.played;
                const wins = s.wins;
                const draws = s.draws;
                const losses = s.losses;

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
                    foto_url: cleanApiValue(rival.club_foto_url),
                    estadio_foto_url: cleanApiValue(rival.estadio_foto_url),
                    stats: {
                        played,
                        wins,
                        draws,
                        losses,
                        gf: s.gf,
                        ga: s.ga,
                        gd: s.gf - s.ga,
                        cleanSheets: s.cleanSheets,
                        winPct: played > 0 ? ((wins / played) * 100).toFixed(1) : '0.0',
                        drawPct: played > 0 ? ((draws / played) * 100).toFixed(1) : '0.0',
                        lossPct: played > 0 ? ((losses / played) * 100).toFixed(1) : '0.0'
                    }
                };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => b.stats.played - a.stats.played || a.nombre.localeCompare(b.nombre));

        return rivals;

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

        const result = await client.execute("SELECT nombre, foto_url FROM clubes");
        const map: Record<string, string> = {};

        result.rows.forEach((row: any) => {
            const shieldUrl = getRivalShieldUrl(row);
            if (!shieldUrl || !row.nombre) return;

            const nombre: string = row.nombre;

            map[nombre] = shieldUrl;

            const sinFemenino = nombre.replace(/\s*Femenino\s*/gi, '').trim();
            if (sinFemenino && sinFemenino !== nombre) map[sinFemenino] = shieldUrl;

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

        const result = await client.execute("SELECT COUNT(*) as count FROM clubes WHERE UPPER(nombre) NOT LIKE '%REAL MADRID%'");
        const count = Number(result.rows[0]?.count || 0);

        if (count === 0) {

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


