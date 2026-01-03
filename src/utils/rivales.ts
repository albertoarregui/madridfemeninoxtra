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
