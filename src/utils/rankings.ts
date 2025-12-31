import { slugify } from "./players";

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
    posicion: string;
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
    goles_victoria: number;
    goles_empate: number;
    goles_abrelatas: number;
}

export interface StreakData {
    id_jugadora: number;
    nombre: string;
    slug: string;
    posicion: string;
    temporada: string;
    competicion: string;
    streak_scoring: number;
    streak_assisting: number;
    streak_ga: number; // Goals + Assists
    streak_clean_sheet: number;
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
            advanced_goal_data AS (
                WITH goal_details AS (
                    SELECT 
                        ga.goleadora,
                        ga.id_partido,
                        p.id_temporada,
                        p.id_competicion,
                        p.goles_rm,
                        p.goles_rival,
                        ROW_NUMBER() OVER (PARTITION BY ga.id_partido ORDER BY ga.minuto ASC) as goal_rank
                    FROM goles_y_asistencias ga
                    JOIN partidos p ON ga.id_partido = p.id_partido
                    WHERE ga.goleadora IS NOT NULL
                )
                SELECT
                    goleadora as id_jugadora,
                    id_temporada,
                    id_competicion,
                    SUM(CASE WHEN goal_rank = 1 THEN 1 ELSE 0 END) as goles_abrelatas,
                    SUM(CASE 
                        WHEN goles_rm > goles_rival AND goal_rank = (goles_rival + 1) THEN 1 
                        ELSE 0 
                    END) as goles_victoria,
                    SUM(CASE 
                        WHEN goles_rm = goles_rival AND goal_rank = goles_rm THEN 1 
                        ELSE 0 
                    END) as goles_empate
                FROM goal_details
                GROUP BY goleadora, id_temporada, id_competicion
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
                    SUM(CASE WHEN UPPER(t.tipo_tarjeta) = 'AMARILLA' THEN 1 ELSE 0 END) as tarjetas_amarillas,
                    SUM(CASE WHEN UPPER(t.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(t.tipo_tarjeta) LIKE '%DOBLE%' OR UPPER(t.tipo_tarjeta) = 'RED' THEN 1 ELSE 0 END) as tarjetas_rojas
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
                j.posicion,
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
                COALESCE(agd.goles_victoria, 0) as goles_victoria,
                COALESCE(agd.goles_empate, 0) as goles_empate,
                COALESCE(agd.goles_abrelatas, 0) as goles_abrelatas,
                COALESCE(a.asistencias, 0) as asistencias,
                COALESCE(cd.tarjetas_amarillas, 0) as tarjetas_amarillas,
                COALESCE(cd.tarjetas_rojas, 0) as tarjetas_rojas,
                COALESCE(cp.capitanias, 0) as capitanias
            FROM jugadoras j
            CROSS JOIN temporadas t
            CROSS JOIN competiciones c
            LEFT JOIN lineup_data l ON j.id_jugadora = l.id_jugadora AND t.id_temporada = l.id_temporada AND c.id_competicion = l.id_competicion
            LEFT JOIN goal_data g ON j.id_jugadora = g.id_jugadora AND t.id_temporada = g.id_temporada AND c.id_competicion = g.id_competicion
            LEFT JOIN advanced_goal_data agd ON j.id_jugadora = agd.id_jugadora AND t.id_temporada = agd.id_temporada AND c.id_competicion = agd.id_competicion
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
            slug: slugify(row.nombre),
            posicion: row.posicion,
            temporada: row.temporada,
            competicion: row.competicion,
            goles: Number(row.goles),
            goles_victoria: Number(row.goles_victoria),
            goles_empate: Number(row.goles_empate),
            goles_abrelatas: Number(row.goles_abrelatas),
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

export async function fetchPlayerStreaks(): Promise<StreakData[]> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) return [];

        const client = createClient({ url, authToken });

        // Fetch granular match data for calculation
        // We need: player, match date, season, competition, minutes_played, goals, assists
        // Ordered by date ASC
        const query = `
            SELECT 
                j.id_jugadora,
                j.nombre,
                j.posicion,
                p.fecha,
                t.temporada,
                c.competicion,
                a.minutos_jugados,
                p.goles_rival,
                (SELECT COUNT(*) FROM goles_y_asistencias ga WHERE ga.id_partido = p.id_partido AND ga.goleadora = j.id_jugadora) as goals,
                (SELECT COUNT(*) FROM goles_y_asistencias ga WHERE ga.id_partido = p.id_partido AND ga.asistente = j.id_jugadora) as assists
            FROM alineaciones a
            JOIN jugadoras j ON a.id_jugadora = j.id_jugadora
            JOIN partidos p ON a.id_partido = p.id_partido
            JOIN temporadas t ON p.id_temporada = t.id_temporada
            JOIN competiciones c ON p.id_competicion = c.id_competicion
            WHERE 
                a.minutos_jugados > 0
            ORDER BY j.id_jugadora, p.fecha ASC
        `;

        const result = await client.execute(query);
        const rows = result.rows;

        // Group by player
        const playersMap: Record<number, any[]> = {};
        rows.forEach((r: any) => {
            if (!playersMap[r.id_jugadora]) playersMap[r.id_jugadora] = [];
            playersMap[r.id_jugadora].push(r);
        });

        const streaks: StreakData[] = [];

        for (const playerIdStr in playersMap) {
            const playerId = Number(playerIdStr);
            const matches = playersMap[playerId];
            if (!matches.length) continue;

            const basePlayer = {
                id_jugadora: playerId,
                nombre: matches[0].nombre,
                slug: slugify(matches[0].nombre),
                posicion: matches[0].posicion || ''
            };

            // State trackers
            const currentStreaks: any = {
                // Keyed by context key (e.g. 'all', 'temporada:X', 'competicion:Y')
                // Value: { scoring: 0, assisting: 0, ga: 0, clean_sheet: 0 }
            };

            const maxStreaksMap: Record<string, any> = {};

            // Initialize contexts for the player generally (though we create on fly)

            for (const m of matches) {
                const season = m.temporada;
                const competition = m.competicion;

                // Contexts: Global, Season, Comp
                const contexts = [`season:\${season}`, `comp:\${competition}`];

                // Only add to global streaks if it's NOT a friendly
                if (competition !== 'Amistoso') {
                    contexts.push('global');
                }

                const hasGoal = Number(m.goals) > 0;
                const hasAssist = Number(m.assists) > 0;
                const hasGA = hasGoal || hasAssist;

                // Detailed position check
                const isDefensive = basePlayer.posicion && (
                    basePlayer.posicion.includes('Portera') ||
                    basePlayer.posicion.includes('Defensa') ||
                    basePlayer.posicion.includes('Central') ||
                    basePlayer.posicion.includes('Lateral')
                );
                const isCleanSheet = isDefensive && Number(m.goles_rival) === 0;

                contexts.forEach(ctx => {
                    if (!currentStreaks[ctx]) currentStreaks[ctx] = { scoring: 0, assisting: 0, ga: 0, clean_sheet: 0 };

                    // Scoring
                    if (hasGoal) currentStreaks[ctx].scoring++;
                    else currentStreaks[ctx].scoring = 0;

                    // Assisting
                    if (hasAssist) currentStreaks[ctx].assisting++;
                    else currentStreaks[ctx].assisting = 0;

                    // G+A
                    if (hasGA) currentStreaks[ctx].ga++;
                    else currentStreaks[ctx].ga = 0;

                    // Clean Sheet
                    if (isCleanSheet) currentStreaks[ctx].clean_sheet++;
                    else currentStreaks[ctx].clean_sheet = 0;

                    // Update Max
                    if (!maxStreaksMap[ctx]) {
                        maxStreaksMap[ctx] = {
                            ...basePlayer,
                            temporada: ctx.startsWith('season:') ? season : (ctx === 'global' ? 'all' : 'all'),
                            competicion: ctx.startsWith('comp:') ? competition : (ctx === 'global' ? 'all' : 'all'),
                            streak_scoring: 0,
                            streak_assisting: 0,
                            streak_ga: 0,
                            streak_clean_sheet: 0
                        };
                        // Fix metadata for specific contexts to ensure filtered views work
                        if (ctx.startsWith('season:')) {
                            maxStreaksMap[ctx].competicion = 'all';
                        }
                        if (ctx.startsWith('comp:')) {
                            maxStreaksMap[ctx].temporada = 'all';
                        }
                        if (ctx === 'global') {
                            maxStreaksMap[ctx].temporada = 'all';
                            maxStreaksMap[ctx].competicion = 'all';
                        }
                    }

                    if (currentStreaks[ctx].scoring > maxStreaksMap[ctx].streak_scoring) maxStreaksMap[ctx].streak_scoring = currentStreaks[ctx].scoring;
                    if (currentStreaks[ctx].assisting > maxStreaksMap[ctx].streak_assisting) maxStreaksMap[ctx].streak_assisting = currentStreaks[ctx].assisting;
                    if (currentStreaks[ctx].ga > maxStreaksMap[ctx].streak_ga) maxStreaksMap[ctx].streak_ga = currentStreaks[ctx].ga;
                    if (currentStreaks[ctx].clean_sheet > maxStreaksMap[ctx].streak_clean_sheet) maxStreaksMap[ctx].streak_clean_sheet = currentStreaks[ctx].clean_sheet;
                });
            }

            // Push all contexts to result
            Object.values(maxStreaksMap).forEach(val => streaks.push(val as StreakData));
        }

        return streaks;

    } catch (error) {
        console.error("Error fetching player streaks:", error);
        return [];
    }
}
