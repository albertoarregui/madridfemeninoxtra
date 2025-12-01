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

    return `/images/escudos/${encodeURI(fileName || 'placeholder.png')}`;
}

export const cleanApiValue = (value: any): any => {
    if (typeof value === 'string' && value.toLowerCase().trim() === 'null') {
        return null;
    }
    return value;
};

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
                c.fundacion,
                c.id_estadio,
                e.nombre AS estadio_nombre,
                e.ciudad AS estadio_ciudad,
                e.capacidad AS estadio_capacidad
            FROM 
                clubes c
            LEFT JOIN
                estadios e ON c.id_estadio = e.id_estadio
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
                fundacion: cleanApiValue(rival.fundacion) || null,
                id_estadio: rival.id_estadio,
                estadio_nombre: cleanApiValue(rival.estadio_nombre) || '',
                estadio_ciudad: cleanApiValue(rival.estadio_ciudad) || '',
                estadio_capacidad: rival.estadio_capacidad || null,
                slug: slugify(rival.nombre),
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
                fundacion: cleanApiValue(rival.fundacion) || null,
            };
        });
    } catch (error) {
        console.error("Fallo al obtener rivales de la API:", error);
        return [];
    }
}
