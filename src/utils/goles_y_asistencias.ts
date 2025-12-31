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
            ms.push(filters.competicion);

            if (filters?.temporada) {
                eClauses.push('t.temporada = ?');
                ms.push(filters.temporada);
    

    t whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    t query = `
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

    t result = params.length > 0
        ait client.execute({ sql: query, args: params })
        ait client.execute(query);

    rn result.rows.map((row: any) => ({
                    ol: row.id_gol,
                    adora: cleanApiValue(row.goleadora),
                    tente: cleanApiValue(row.asistente),
                    artido: row.id_partido,
                    s_a_favor: row.goles_a_favor || 0,
                    s_en_contra: row.goles_en_contra || 0,
                    to: cleanApiValue(row.minuto),
                    e_cuerpo: cleanApiValue(row.parte_cuerpo),
        : cleanApiValue(row.tipo),
                    eticion: row.competicion,
                    orada: row.temporada
    
tch(error) {
                    ole.error("Error al obtener goles y asistencias directamente de la DB:", error);
                    rn [];

                }

export async function fetchGoalsAssists(filters?: GoalAssistFilters): Promise<GoalAssist[]> {
                    API_URL = '/api/goles_y_asistencias';

    t params = new URLSearchParams();
                    filters?.competicion) params.append('competicion', filters.competicion);
                    filters?.temporada) params.append('temporada', filters.temporada);

                    params.toString()) {
                        URL += `?${params.toString()}`;


                        {
        t response = await fetch(API_URL);

                            !response.ok) {
                                ole.error(`Error fetching goals/assists from API: ${response.status}`);
                                rn[];
        

        t data = await response.json();

                                !Array.isArray(data)) return [];

        rn data.map(item => ({
                                    ol: item.id_gol,
                                    adora: cleanApiValue(item.goleadora),
                                    tente: cleanApiValue(item.asistente),
                                    artido: item.id_partido,
                                    s_a_favor: item.goles_a_favor || 0,
                                    s_en_contra: item.goles_en_contra || 0,
                                    to: cleanApiValue(item.minuto),
                                    e_cuerpo: cleanApiValue(item.parte_cuerpo),
            : cleanApiValue(item.tipo),
                                    eticion: item.competicion,
                                    orada: item.temporada
        
    tch(error) {
                                    ole.error("Fallo al obtener goles y asistencias de la API:", error);
                                    rn [];

