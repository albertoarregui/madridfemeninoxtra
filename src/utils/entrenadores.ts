export function slugify(text: string | null | undefined): string {
    if (!text) return 'desconocido';
    return text.toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

export function getCoachImageUrl(coach: any): string {
    let fileName = coach.foto_url;

    if (!fileName && coach.nombre) {
        let nameSlug = slugify(coach.nombre).replace(/-/g, '_');
        const parts = nameSlug.split('_').filter(p => p.length > 0);
        let nameForFile = parts.slice(0, 4).join('_');
        fileName = `${nameForFile}.png`;
    } else if (fileName && !fileName.includes('.')) {
        fileName += '.png';
    }

    return `/images/entrenadores/${encodeURI(fileName || 'placeholder.png')}`;
}

export const cleanApiValue = (value: any): any => {
    if (typeof value === 'string' && value.toLowerCase().trim() === 'null') {
        return null;
    }
    return value;
};

export async function fetchCoachesDirectly(): Promise<any[]> {
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
                id_entrenador, 
                nombre, 
                ciudad, 
                pais, 
                fecha_nacimiento 
            FROM 
                entrenadores 
            WHERE 
                nombre != 'José Manuel Lara'
            ORDER BY 
                id_entrenador ASC
        `;

        const result = await client.execute(query);

        return result.rows.map((coach: any) => {
            return {
                id_entrenador: coach.id_entrenador,
                nombre: cleanApiValue(coach.nombre) || '',
                ciudad: cleanApiValue(coach.ciudad) || '',
                pais: cleanApiValue(coach.pais) || '',
                fecha_nacimiento: cleanApiValue(coach.fecha_nacimiento) || '',
                slug: slugify(coach.nombre),
                imageUrl: getCoachImageUrl(coach),
            };
        });
    } catch (error) {
        console.error("Error al obtener entrenadores directamente de la DB:", error);
        return [];
    }
}

export async function fetchCoaches(): Promise<any[]> {
    const API_URL = '/api/coaches';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            console.error(`Error fetching coaches from API: ${response.status}`);
            return [];
        }

        const coaches = await response.json();

        if (!Array.isArray(coaches)) return [];

        return coaches.map(coach => {
            return {
                ...coach,
                slug: slugify(coach.nombre),
                imageUrl: getCoachImageUrl(coach),
                ciudad: cleanApiValue(coach.ciudad) || '',
                pais: cleanApiValue(coach.pais) || '',
                fecha_nacimiento: cleanApiValue(coach.fecha_nacimiento) || '',
            };
        });
    } catch (error) {
        console.error("Fallo al obtener entrenadores de la API:", error);
        return [];
    }
}