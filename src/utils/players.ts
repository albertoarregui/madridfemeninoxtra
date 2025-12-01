export function slugify(text: string | null | undefined): string {
    if (!text) return 'desconocida';
    return text.toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

export const cleanApiValue = (value: any): any => {
    if (typeof value === 'string' && value.toLowerCase().trim() === 'null') {
        return null;
    }
    return value;
};

export function getPlayerImageUrl(player: any): string {
    let fileName = player.foto_url;

    if (!fileName && player.nombre) {
        let nameSlug = slugify(player.nombre).replace(/-/g, '_');
        const parts = nameSlug.split('_').filter(p => p.length > 0);
        let nameForFile = parts.slice(0, 4).join('_');
        fileName = `${nameForFile}.png`;
    } else if (fileName && !fileName.includes('.')) {
        fileName += '.png';
    }

    return `/images/jugadoras/${encodeURI(fileName || 'placeholder.png')}`;
}

export function getCleanCountryName(country: string | null | undefined): string {
    return country
        ? country.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, '_')
        : 'default';
}

export async function fetchPlayersDirectly(): Promise<any[]> {
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
                id_jugadora, 
                nombre, 
                fecha_nacimiento, 
                pais_origen, 
                altura, 
                peso, 
                posicion
            FROM 
                jugadoras
            ORDER BY 
                nombre ASC
        `;

        const result = await client.execute(query);

        return result.rows.map((player: any) => {
            const cleanPaisOrigin = cleanApiValue(player.pais_origen);

            return {
                ...player,
                slug: slugify(player.nombre),
                imageUrl: getPlayerImageUrl(player),
                cleanCountryName: getCleanCountryName(cleanPaisOrigin),
                pais_origin: cleanPaisOrigin || '',
                altura: cleanApiValue(player.altura) || null,
                peso: cleanApiValue(player.peso) || null,
                fecha_nacimiento: cleanApiValue(player.fecha_nacimiento) || '',
            };
        });
    } catch (error) {
        console.error("Error al obtener jugadoras directamente de la DB:", error);
        return [];
    }
}

export async function fetchAndCleanPlayers(): Promise<any[]> {

    const API_URL = '/api/players';

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            console.error(`Error fetching players from internal API: ${response.status}`);
            return [];
        }

        const players = await response.json();

        if (!Array.isArray(players)) return [];


        return players.map(player => {
            const cleanPaisOrigin = cleanApiValue(player.pais_origen) || cleanApiValue(player.pais_origin);

            return {
                ...player,

                slug: slugify(player.nombre),
                imageUrl: getPlayerImageUrl(player),
                cleanCountryName: getCleanCountryName(cleanPaisOrigin),


                pais_origin: cleanPaisOrigin || '',
                altura: cleanApiValue(player.altura) || null,
                peso: cleanApiValue(player.peso) || null,
                fecha_nacimiento: cleanApiValue(player.fecha_nacimiento) || '',
            };
        });
    } catch (error) {
        console.error("Fallo al obtener jugadoras de la API en el servidor:", error);
        return [];
    }
}