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
    foto_goleadora?: string | null;
    foto_asistente?: string | null;
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
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) {
            return [];
        }

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
                COALESCE(jg.nombre, g.goleadora) AS goleadora, 
                COALESCE(ja.nombre, g.asistente) AS asistente, 
                COALESCE(d_g1.foto_url, d_g2.foto_url) AS foto_goleadora,
                COALESCE(d_a1.foto_url, d_a2.foto_url) AS foto_asistente,
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
            JOIN 
                partidos p ON g.id_partido = p.id_partido
            JOIN 
                competiciones c ON p.id_competicion = c.id_competicion
            JOIN 
                temporadas t ON p.id_temporada = t.id_temporada
            
            -- Goleadora
            LEFT JOIN jugadoras jg ON g.goleadora = jg.id_jugadora
            LEFT JOIN dorsales d_g1 ON (g.goleadora = d_g1.id_jugadora AND p.id_temporada = d_g1.id_temporada)
            LEFT JOIN dorsales d_g2 ON (g.goleadora = d_g2.id_jugadora AND d_g2.id_temporada = (SELECT MAX(id_temporada) FROM dorsales WHERE id_jugadora = g.goleadora))
            LEFT JOIN jugadoras jg2 ON (g.goleadora = jg2.nombre AND jg.id_jugadora IS NULL)
            
            -- Asistente
            LEFT JOIN jugadoras ja ON g.asistente = ja.id_jugadora
            LEFT JOIN dorsales d_a1 ON (g.asistente = d_a1.id_jugadora AND p.id_temporada = d_a1.id_temporada)
            LEFT JOIN dorsales d_a2 ON (g.asistente = d_a2.id_jugadora AND d_a2.id_temporada = (SELECT MAX(id_temporada) FROM dorsales WHERE id_jugadora = g.asistente))
            LEFT JOIN jugadoras ja2 ON (g.asistente = ja2.nombre AND ja.id_jugadora IS NULL)
            
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
            foto_goleadora: row.foto_goleadora,
            foto_asistente: row.foto_asistente,
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


