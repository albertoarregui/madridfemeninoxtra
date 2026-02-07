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

export function getRivalShieldUrl(rival: any): string {
    const name = rival.escudo_url || rival.nombre;
    return getAssetUrl('escudos', name);
}

export const cleanApiValue = (value: any): any => {
    if (typeof value === 'string' && value.toLowerCase().trim() === 'null') {
        return null;
    }
    return value;
};

export async function fetchRivalsDirectly(): Promise<any[]> {
    try {
        const { getDbClient } = await import('../db/client');
        const client = await getDbClient();

        if (!client) {
            return [];
        }

        const query = `
            SELECT 
                c.id_club,
                c.nombre,
                c.ciudad,
                c.pais,
                c.slug,
                e.nombre as estadio,
                e.capacidad,
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
                SUM(CASE WHEN CAST(p.goles_rival AS INTEGER) = 0 THEN 1 ELSE 0 END) as clean_sheets
            FROM 
                clubes c
            LEFT JOIN
                estadios e ON c.estadio = e.id_estadio
            LEFT JOIN
                partidos p ON (p.id_club_local = c.id_club OR p.id_club_visitante = c.id_club)
            LEFT JOIN
                competiciones comp ON p.id_competicion = comp.id_competicion
            WHERE
                c.nombre != 'Real Madrid Femenino'
                AND c.nombre != 'Real Madrid'
                AND p.goles_rm IS NOT NULL
                AND comp.competicion NOT LIKE '%Amistoso%'
            GROUP BY
                c.id_club
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
                slug: rival.slug || slugify(rival.nombre),
                estadio: cleanApiValue(rival.estadio) || '',
                capacidad: cleanApiValue(rival.capacidad) || '-',
                shieldUrl: getRivalShieldUrl(rival),
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
