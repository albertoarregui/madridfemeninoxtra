export const cleanApiValue = (value: any): any => {
    if (typeof value === 'string' && value.toLowerCase().trim() === 'null') {
        return null;
    }
    return value;
};

export interface GoalAssist {
    id_gol: number;
    goleadora: string | null;
    asistente: string | null;
    id_partido: number;
    goles_a_favor: number;
    goles_en_contra: number;
    minuto: number | null;
    parte_cuerpo: string | null;
    tipo: string | null;
    competicion?: string;
    temporada?: string;
}

export interface GoalAssistFilters {
    competicion?: string;
    temporada?: string;
}

export async function fetchGoalsAssistsDirectly(filters?: GoalAssistFilters): Promise<GoalAssist[]> {
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

        let whereClauses: string[] = [];
        let params: any[] = [];

        if (filters?.competicion) {
            whereClauses.push('c.competicion = ?');
            params.push(filters.competicion);
        }

        if (filters?.temporada) {
            whereClauses.push('t.temporada = ?');
            params.push(filters.temporada);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            SELECT 
                g.id_gol, 
                jg.nombre AS goleadora, 
                ja.nombre AS asistente, 
                g.id_partido, 
                g.goles_a_favor, 
                g.goles_en_contra, 
                g.minuto, 
                g.parte_cuerpo, 
                g.tipo,
                c.competicion AS competicion,
                t.temporada AS temporada
            FROM 
                goles_y_asistencias g
            LEFT JOIN 
                jugadoras jg ON g.goleadora = jg.id_jugadora
            LEFT JOIN 
                jugadoras ja ON g.asistente = ja.id_jugadora
            JOIN 
                partidos p ON g.id_partido = p.id_partido
            JOIN 
                competiciones c ON p.id_competicion = c.id_competicion
            JOIN 
                temporadas t ON p.id_temporada = t.id_temporada
            ${whereString}
            ORDER BY 
                g.id_partido ASC, g.minuto ASC
        `;

        const result = params.length > 0
            ? await client.execute({ sql: query, args: params })
            : await client.execute(query);

        return result.rows.map((row: any) => ({
            id_gol: row.id_gol,
            goleadora: cleanApiValue(row.goleadora),
            asistente: cleanApiValue(row.asistente),
            id_partido: row.id_partido,
            goles_a_favor: row.goles_a_favor || 0,
            goles_en_contra: row.goles_en_contra || 0,
            minuto: cleanApiValue(row.minuto),
            parte_cuerpo: cleanApiValue(row.parte_cuerpo),
            tipo: cleanApiValue(row.tipo),
            competicion: row.competicion,
            temporada: row.temporada
        }));

    } catch (error) {
        console.error("Error al obtener goles y asistencias directamente de la DB:", error);
        return [];
    }
}

export async function fetchGoalsAssists(filters?: GoalAssistFilters): Promise<GoalAssist[]> {
    let API_URL = '/api/goles_y_asistencias';

    const params = new URLSearchParams();
    if (filters?.competicion) params.append('competicion', filters.competicion);
    if (filters?.temporada) params.append('temporada', filters.temporada);

    if (params.toString()) {
        API_URL += `?${params.toString()}`;
    }

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            console.error(`Error fetching goals/assists from API: ${response.status}`);
            return [];
        }

        const data = await response.json();

        if (!Array.isArray(data)) return [];

        return data.map((item: any) => ({
            id_gol: item.id_gol,
            goleadora: cleanApiValue(item.goleadora),
            asistente: cleanApiValue(item.asistente),
            id_partido: item.id_partido,
            goles_a_favor: item.goles_a_favor || 0,
            goles_en_contra: item.goles_en_contra || 0,
            minuto: cleanApiValue(item.minuto),
            parte_cuerpo: cleanApiValue(item.parte_cuerpo),
            tipo: cleanApiValue(item.tipo),
            competicion: item.competicion,
            temporada: item.temporada
        }));

    } catch (error) {
        console.error("Fallo al obtener goles y asistencias de la API:", error);
        return [];
    }
}

