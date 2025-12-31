export function slugify(text: string | null | undefined): string {
    if (!text) return 'desconocido';
    return text.toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

export function getRivalShieldUrl(rival: any): string {
    let fileName = rival.escudo_url;

    if (!fileName && rival.nombre) {
        let nameSlug = slugify(rival.nombre).replace(/-/g, '_');
        fileName = `${nameSlug}.png`;
    } else if (fileName && !fileName.includes('.')) {
        fileName += '.png';
    }

    return `/assets/escudos/${encodeURI(fileName || 'placeholder.png')}`;
}

export const cleanApiValue = (value: any): any => {
    if (typeof value === 'string' && value.toLowerCase().trim() === 'null') {
        return null;
    }
    return value;
};

import { dbMain } from "../lib/turso";

export async function getRivalInfo(rivalId: string | number): Promise<any> {
    try {
        const query = `
            SELECT 
                id_club,
                nombre,
                logo_url,
                estadio
            FROM 
                clubes
            WHERE 
                id_club = ?
        `;

        const result = await dbMain.execute({
            sql: query,
            args: [rivalId],
        });

        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error(`Error al obtener información del rival con ID ${rivalId}:`, error);
        return null;
    }
}

export async function fetchRivalsDirectly(): Promise<any[]> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('Credenciales de Turso no configuradas');
            return [];
        }

        const client = createClient({
            url: url,
            authToken: authToken,
        });

        const query = `
            SELECT 
                c.id_club,
                c.nombre,
                c.ciudad,
                c.pais,
                c.slug,
                e.nombre as estadio
            FROM 
                clubes c
            LEFT JOIN
                estadios e ON c.estadio = e.id_estadio
            WHERE
                c.nombre != 'Real Madrid Femenino'
            ORDER BY 
                c.nombre ASC
        `;

        const result = await client.execute(query);

        return result.rows.map((rival: any) => {
            return {
                id_club: rival.id_club,
                nombre: cleanApiValue(rival.nombre) || '',
                ciudad: cleanApiValue(rival.ciudad) || '',
                pais: cleanApiValue(rival.pais) || '',
                slug: rival.slug || slugify(rival.nombre),
                estadio: cleanApiValue(rival.estadio) || '',
                shieldUrl: getRivalShieldUrl(rival),
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
