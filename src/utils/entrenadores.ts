export function slugify(text: string | null | undefined): string {
    if (!text) return 'desconocido';
    return text.toString().toLowerCase()
        .trim()
        .trim()
        .replace(/ø/g, 'o').replace(/Ø/g, 'O')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
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
        const { getDbClient } = await import('../db/client');
        const client = await getDbClient();

        if (!client) {
            return [];
        }

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
        const { getDbClient } = await import('../db/client');
        const client = await getDbClient();

        if (!client) {
            return null;
        }

        const statsQuery = `
            SELECT
                t.temporada,
                c.competicion,
                COUNT(DISTINCT p.id_partido) as partidos,
                SUM(CASE WHEN p.goles_rm > p.goles_rival THEN 1 ELSE 0 END) as victorias,
                SUM(CASE WHEN p.goles_rm = p.goles_rival THEN 1 ELSE 0 END) as empates,
                SUM(CASE WHEN p.goles_rm < p.goles_rival THEN 1 ELSE 0 END) as derrotas,
                SUM(p.goles_rm) as goles_favor,
                SUM(p.goles_rival) as goles_contra,
                SUM(CASE WHEN p.goles_rival = 0 THEN 1 ELSE 0 END) as porterias_cero
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
                        porterias_cero: 0,
                    },
                };
            }

            const partidos = Number(row.partidos) || 0;
            const victorias = Number(row.victorias) || 0;
            const empates = Number(row.empates) || 0;
            const derrotas = Number(row.derrotas) || 0;

            estadisticas[temporada].competiciones.push({
                competicion: competicion,
                partidos: partidos,
                victorias: victorias,
                empates: empates,
                derrotas: derrotas,
                goles_favor: Number(row.goles_favor) || 0,
                goles_contra: Number(row.goles_contra) || 0,
                porterias_cero: Number(row.porterias_cero) || 0,
                porcentaje_victorias: partidos > 0 ? ((victorias / partidos) * 100).toFixed(1) : '0.0',
                porcentaje_empates: partidos > 0 ? ((empates / partidos) * 100).toFixed(1) : '0.0',
                porcentaje_derrotas: partidos > 0 ? ((derrotas / partidos) * 100).toFixed(1) : '0.0',
            });

            estadisticas[temporada].total.partidos += Number(row.partidos) || 0;
            estadisticas[temporada].total.victorias += Number(row.victorias) || 0;
            estadisticas[temporada].total.empates += Number(row.empates) || 0;
            estadisticas[temporada].total.derrotas += Number(row.derrotas) || 0;
            estadisticas[temporada].total.goles_favor += Number(row.goles_favor) || 0;
            estadisticas[temporada].total.goles_contra += Number(row.goles_contra) || 0;
            estadisticas[temporada].total.porterias_cero += Number(row.porterias_cero) || 0;
        });

        const estadisticasArray = Object.values(estadisticas).map((season: any) => {
            const partidos = season.total.partidos;
            return {
                ...season,
                total: {
                    ...season.total,
                    porcentaje_victorias: partidos > 0 ? ((season.total.victorias / partidos) * 100).toFixed(1) : '0.0',
                    porcentaje_empates: partidos > 0 ? ((season.total.empates / partidos) * 100).toFixed(1) : '0.0',
                    porcentaje_derrotas: partidos > 0 ? ((season.total.derrotas / partidos) * 100).toFixed(1) : '0.0',
                }
            };
        });

        const total_carrera = {
            partidos: 0,
            victorias: 0,
            empates: 0,
            derrotas: 0,
            goles_favor: 0,
            goles_contra: 0,
            porterias_cero: 0,
        };

        estadisticasArray.forEach((season: any) => {
            total_carrera.partidos += season.total.partidos;
            total_carrera.victorias += season.total.victorias;
            total_carrera.empates += season.total.empates;
            total_carrera.derrotas += season.total.derrotas;
            total_carrera.goles_favor += season.total.goles_favor;
            total_carrera.goles_contra += season.total.goles_contra;
            total_carrera.porterias_cero += season.total.porterias_cero;
        });

        const total_carrera_con_porcentajes = {
            ...total_carrera,
            porcentaje_victorias: total_carrera.partidos > 0 ? ((total_carrera.victorias / total_carrera.partidos) * 100).toFixed(1) : '0.0',
            porcentaje_empates: total_carrera.partidos > 0 ? ((total_carrera.empates / total_carrera.partidos) * 100).toFixed(1) : '0.0',
            porcentaje_derrotas: total_carrera.partidos > 0 ? ((total_carrera.derrotas / total_carrera.partidos) * 100).toFixed(1) : '0.0',
        };

        return {
            estadisticas: estadisticasArray,
            total_carrera: total_carrera_con_porcentajes,
        };
    } catch (error) {
        console.error("Error fetching coach stats:", error);
        return null;
    }
}

export async function fetchCoachTrajectory(coachId: string | number): Promise<any[]> {
    try {
        const { getDbClient } = await import('../db/client');
        const client = await getDbClient();

        if (!client) {
            return [];
        }

        const query = `
            SELECT 
                club,
                año_inicio,
                año_fin
            FROM 
                trayectoria_entrenadores
            WHERE 
                id_entrenador = ?
            ORDER BY 
                año_inicio DESC
        `;

        const result = await client.execute({
            sql: query,
            args: [coachId],
        });

        return result.rows.map((row: any) => ({
            club: cleanApiValue(row.club),
            anio_inicio: cleanApiValue(row.año_inicio),
            anio_fin: cleanApiValue(row.año_fin),
        }));

    } catch (error) {
        console.error("Error fetching coach trajectory:", error);
        return [];
    }
}