
export const cleanApiValue = (value: any): any => {
    if (typeof value === 'string' && value.toLowerCase().trim() === 'null') {
        return null;
    }
    return value;
};

export interface RankingStat {
    id_jugadora: number;
    nombre: string;
    slug: string;
    temporada: string;
    competicion: string;
    goles: number;
    asistencias: number;
    goles_generados: number;
    convocatorias: number;
    partidos: number;
    titularidades: number;
    minutos: number;
    cambio_entrada: number;
    cambio_salida: number;
    victorias: number;
    porterias_cero: number;
    tarjetas_amarillas: number;
    tarjetas_rojas: number;
    capitanias: number;
}

export async function fetchRankingsDirectly(): Promise<RankingStat[]> {
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
            WITH 
            lineup_data AS (
                SELECT 
                    a.id_jugadora,
                    p.id_temporada,
                    p.id_competicion,
                    SUM(CASE WHEN a.convocada = 1 THEN 1 ELSE 0 END) as convocatorias,
                    SUM(CASE WHEN a.minutos_jugados > 0 THEN 1 ELSE 0 END) as partidos,
                    SUM(CASE WHEN a.titular = 1 THEN 1 ELSE 0 END) as titularidades,
                    SUM(a.minutos_jugados) as minutos,
                    SUM(CASE WHEN a.minuto_entrada IS NOT NULL THEN 1 ELSE 0 END) as cambio_entrada,
                    SUM(CASE WHEN a.minuto_salida IS NOT NULL THEN 1 ELSE 0 END) as cambio_salida,
                    SUM(CASE WHEN a.minutos_jugados > 0 AND p.goles_rm > p.goles_rival THEN 1 ELSE 0 END) as victorias,
                    SUM(CASE WHEN a.minutos_jugados > 0 AND p.goles_rival = 0 THEN 1 ELSE 0 END) as porterias_cero
                FROM alineaciones a
                JOIN partidos p ON a.id_partido = p.id_partido
                GROUP BY a.id_jugadora, p.id_temporada, p.id_competicion
            ),
            goal_data AS (
                SELECT 
                    goleadora as id_jugadora,
                    p.id_temporada,
                    p.id_competicion,
                    COUNT(*) as goles
                FROM goles_y_asistencias ga
                JOIN partidos p ON ga.id_partido = p.id_partido
                WHERE goleadora IS NOT NULL
                GROUP BY goleadora, p.id_temporada, p.id_competicion
            ),
            assist_data AS (
                SELECT 
                    asistente as id_jugadora,
                    p.id_temporada,
                    p.id_competicion,
                    COUNT(*) as asistencias
                FROM goles_y_asistencias ga
                JOIN partidos p ON ga.id_partido = p.id_partido
                WHERE asistente IS NOT NULL
                GROUP BY asistente, p.id_temporada, p.id_competicion
            ),
            card_data AS (
                SELECT 
                    t.id_jugadora,
                    p.id_temporada,
                    p.id_competicion,
                    SUM(CASE WHEN t.tipo_tarjeta = 'Amarilla' THEN 1 ELSE 0 END) as tarjetas_amarillas,
                    SUM(CASE WHEN t.tipo_tarjeta = 'Roja' THEN 1 ELSE 0 END) as tarjetas_rojas
                FROM tarjetas t
                JOIN partidos p ON t.id_partido = p.id_partido
                GROUP BY t.id_jugadora, p.id_temporada, p.id_competicion
            ),
            u_captain_data AS (
                SELECT 
                    c.id_jugadora,
                    p.id_temporada,
                    p.id_competicion,
                    COUNT(*) as capitanias
                FROM capitanias c
                JOIN partidos p ON c.id_partido = p.id_partido
                GROUP BY c.id_jugadora, p.id_temporada, p.id_competicion
            )

            SELECT 
                j.id_jugadora,
                j.nombre,
                j.slug,
                t.temporada,
                c.competicion,
                COALESCE(l.convocatorias, 0) as convocatorias,
                COALESCE(l.partidos, 0) as partidos,
                COALESCE(l.titularidades, 0) as titularidades,
                COALESCE(l.minutos, 0) as minutos,
                COALESCE(l.cambio_entrada, 0) as cambio_entrada,
                COALESCE(l.cambio_salida, 0) as cambio_salida,
                COALESCE(l.victorias, 0) as victorias,
                COALESCE(l.porterias_cero, 0) as porterias_cero,
                COALESCE(g.goles, 0) as goles,
                COALESCE(a.asistencias, 0) as asistencias,
                COALESCE(cd.tarjetas_amarillas, 0) as tarjetas_amarillas,
                COALESCE(cd.tarjetas_rojas, 0) as tarjetas_rojas,
                COALESCE(cp.capitanias, 0) as capitanias
            FROM jugadoras j
            CROSS JOIN temporadas t
            CROSS JOIN competiciones c
            LEFT JOIN lineup_data l ON j.id_jugadora = l.id_jugadora AND t.id_temporada = l.id_temporada AND c.id_competicion = l.id_competicion
            LEFT JOIN goal_data g ON j.id_jugadora = g.id_jugadora AND t.id_temporada = g.id_temporada AND c.id_competicion = g.id_competicion
            LEFT JOIN assist_data a ON j.id_jugadora = a.id_jugadora AND t.id_temporada = a.id_temporada AND c.id_competicion = a.id_competicion
            LEFT JOIN card_data cd ON j.id_jugadora = cd.id_jugadora AND t.id_temporada = cd.id_temporada AND c.id_competicion = cd.id_competicion
            LEFT JOIN u_captain_data cp ON j.id_jugadora = cp.id_jugadora AND t.id_temporada = cp.id_temporada AND c.id_competicion = cp.id_competicion
            WHERE 
                l.convocatorias > 0 OR g.goles > 0 OR a.asistencias > 0 OR cd.tarjetas_amarillas > 0 OR cd.tarjetas_rojas > 0
            ORDER BY j.nombre
        `;

        const result = await client.execute(query);

        return result.rows.map((row: any) => ({
            id_jugadora: row.id_jugadora,
            nombre: row.nombre,
            slug: row.slug,
            temporada: row.temporada,
            competicion: row.competicion,
            goles: Number(row.goles),
            asistencias: Number(row.asistencias),
            goles_generados: Number(row.goles) + Number(row.asistencias),
            convocatorias: Number(row.convocatorias),
            partidos: Number(row.partidos),
            titularidades: Number(row.titularidades),
            minutos: Number(row.minutos),
            cambio_entrada: Number(row.cambio_entrada),
            cambio_salida: Number(row.cambio_salida),
            victorias: Number(row.victorias),
            porterias_cero: Number(row.porterias_cero),
            tarjetas_amarillas: Number(row.tarjetas_amarillas),
            tarjetas_rojas: Number(row.tarjetas_rojas),
            capitanias: Number(row.capitanias)
        }));

    } catch (error) {
        console.error("Error fetching rankings directly:", error);
        return [];
    }
}
