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

    return `/assets/entrenadores/${encodeURI(fileName || 'placeholder.png')}`;
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

export async function fetchCoachStats(coachId: string | number): Promise<any> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('Credenciales de Turso no configuradas');
            return null;
        }

        const client = createClient({
            url: url,
            authToken: authToken,
        });

        const statsQuery = `
            SELECT
                t.temporada,
                c.competicion,
                COUNT(DISTINCT p.id_partido) as partidos,
                SUM(CASE WHEN p.goles_rm > p.goles_rival THEN 1 ELSE 0 END) as victorias,
                SUM(CASE WHEN p.goles_rm = p.goles_rival THEN 1 ELSE 0 END) as empates,
                SUM(CASE WHEN p.goles_rm < p.goles_rival THEN 1 ELSE 0 END) as derrotas,
                SUM(p.goles_rm) as goles_favor,
                SUM(p.goles_rival) as goles_contra
            FROM partidos p
            INNER JOIN temporadas t ON p.id_temporada = t.id_temporada
            INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
            WHERE p.id_entrenador = ?
            GROUP BY t.temporada, c.competicion
            ORDER BY t.temporada DESC, 
                CASE c.competicion
                    WHEN 'Liga F' THEN 1
                    WHEN 'UWCL' THEN 2
                    WHEN 'Copa de la Reina' THEN 3
                    WHEN 'Supercopa de España' THEN 4
                    WHEN 'Amistoso' THEN 5
                    ELSE 99
                END ASC
        `;

        const statsResult = await client.execute({
            sql: statsQuery,
            args: [coachId],
        });

        // Process and structure the results
        const estadisticas: any = {};
        const temporadasSet = new Set();

        statsResult.rows.forEach((row: any) => {
            const temporada = row.temporada;
            const competicion = row.competicion;

            temporadasSet.add(temporada);

            if (!estadisticas[temporada]) {
                estadisticas[temporada] = {
                    temporada: temporada,
                    competiciones: [],
                    total: {
                        partidos: 0,
                        victorias: 0,
                        empates: 0,
                        derrotas: 0,
                        goles_favor: 0,
                        goles_contra: 0,
                    },
                };
            }

            estadisticas[temporada].competiciones.push({
                competicion: competicion,
                partidos: Number(row.partidos) || 0,
                victorias: Number(row.victorias) || 0,
                empates: Number(row.empates) || 0,
                derrotas: Number(row.derrotas) || 0,
                goles_favor: Number(row.goles_favor) || 0,
                goles_contra: Number(row.goles_contra) || 0,
            });

            // Update season totals
            estadisticas[temporada].total.partidos += Number(row.partidos) || 0;
            estadisticas[temporada].total.victorias += Number(row.victorias) || 0;
            estadisticas[temporada].total.empates += Number(row.empates) || 0;
            estadisticas[temporada].total.derrotas += Number(row.derrotas) || 0;
            estadisticas[temporada].total.goles_favor += Number(row.goles_favor) || 0;
            estadisticas[temporada].total.goles_contra += Number(row.goles_contra) || 0;
        });

        // Convert to array
        const estadisticasArray = Object.values(estadisticas);

        // Calculate career totals
        const total_carrera = {
            partidos: 0,
            victorias: 0,
            empates: 0,
            derrotas: 0,
            goles_favor: 0,
            goles_contra: 0,
        };

        estadisticasArray.forEach((season: any) => {
            total_carrera.partidos += season.total.partidos;
            total_carrera.victorias += season.total.victorias;
            total_carrera.empates += season.total.empates;
            total_carrera.derrotas += season.total.derrotas;
            total_carrera.goles_favor += season.total.goles_favor;
            total_carrera.goles_contra += season.total.goles_contra;
        });

        return {
            estadisticas: estadisticasArray,
            total_carrera: total_carrera,
        };
    } catch (error) {
        console.error("Error fetching coach stats:", error);
        return null;
    }
}