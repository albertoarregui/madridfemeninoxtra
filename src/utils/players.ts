export function slugify(text: string | null | undefined): string {
    if (!text) return 'desconocida';
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

    return `/assets/jugadoras/${encodeURI(fileName || 'placeholder.png')}`;
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
                lugar_nacimiento, 
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
                lugar_nacimiento: cleanApiValue(player.lugar_nacimiento) || null,
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

export async function fetchPlayerStats(playerId: string | number, isGoalkeeper: boolean): Promise<any> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('Credenciales de Turso no configuradas para stats');
            return null;
        }

        const client = createClient({
            url: url,
            authToken: authToken,
        });

        const statsQuery = `
            WITH base_matches AS (
                -- Get all unique matches relevant to the player (played, benched, scored, etc)
                -- Actually, we can just aggregate per table and join on season/comp
                SELECT 
                    p.id_temporada, 
                    p.id_competicion,
                    t.temporada,
                    c.competicion
                FROM partidos p
                JOIN temporadas t ON p.id_temporada = t.id_temporada
                JOIN competiciones c ON p.id_competicion = c.id_competicion
                GROUP BY p.id_temporada, p.id_competicion
            ),
            
            lineup_stats AS (
                SELECT 
                    p.id_temporada,
                    p.id_competicion,
                    SUM(CASE WHEN al.convocada = 1 THEN 1 ELSE 0 END) as convocatorias,
                    SUM(CASE WHEN al.minutos_jugados > 0 THEN 1 ELSE 0 END) as partidos,
                    SUM(CASE WHEN al.titular = 1 THEN 1 ELSE 0 END) as titularidades,
                    SUM(CASE WHEN al.minutos_jugados > 0 AND al.titular = 0 THEN 1 ELSE 0 END) as suplencias,
                    SUM(al.minutos_jugados) as minutes,
                    SUM(CASE WHEN al.minuto_entrada IS NOT NULL THEN 1 ELSE 0 END) as cambio_entrada,
                    SUM(CASE WHEN al.minuto_salida IS NOT NULL THEN 1 ELSE 0 END) as cambio_salida,
                    SUM(CASE WHEN p.goles_rival = 0 AND al.minutos_jugados > 0 THEN 1 ELSE 0 END) as porterias_cero,
                    SUM(CASE WHEN al.minutos_jugados > 0 AND p.goles_rm > p.goles_rival THEN 1 ELSE 0 END) as victorias
                FROM alineaciones al
                JOIN partidos p ON al.id_partido = p.id_partido
                WHERE al.id_jugadora = ?
                GROUP BY p.id_temporada, p.id_competicion
            ),
            
            goal_stats AS (
                SELECT 
                    p.id_temporada,
                    p.id_competicion,
                    COUNT(g.id_gol) as goles
                FROM goles_y_asistencias g
                JOIN partidos p ON g.id_partido = p.id_partido
                WHERE g.goleadora = ?
                GROUP BY p.id_temporada, p.id_competicion
            ),
            
            assist_stats AS (
                SELECT 
                    p.id_temporada,
                    p.id_competicion,
                    COUNT(a.id_gol) as asistencias
                FROM goles_y_asistencias a
                JOIN partidos p ON a.id_partido = p.id_partido
                WHERE a.asistente = ?
                GROUP BY p.id_temporada, p.id_competicion
            ),
            
            card_stats AS (
                SELECT 
                    p.id_temporada,
                    p.id_competicion,
                    SUM(CASE WHEN UPPER(t.tipo_tarjeta) = 'AMARILLA' THEN 1 ELSE 0 END) as tarjetas_amarillas,
                    SUM(CASE WHEN UPPER(t.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(t.tipo_tarjeta) LIKE '%DOBLE%' OR UPPER(t.tipo_tarjeta) = 'RED' THEN 1 ELSE 0 END) as tarjetas_rojas
                FROM tarjetas t
                JOIN partidos p ON t.id_partido = p.id_partido
                WHERE t.id_jugadora = ?
                GROUP BY p.id_temporada, p.id_competicion
            ),
            
            captain_stats AS (
                SELECT 
                    p.id_temporada,
                    p.id_competicion,
                    COUNT(cp.id_capitania) as capitanias
                FROM capitanias cp
                JOIN partidos p ON cp.id_partido = p.id_partido
                WHERE cp.id_jugadora = ?
                GROUP BY p.id_temporada, p.id_competicion
            )

            SELECT 
                b.temporada,
                b.competicion,
                COALESCE(l.convocatorias, 0) as convocatorias,
                COALESCE(l.partidos, 0) as partidos,
                COALESCE(l.titularidades, 0) as titularidades,
                COALESCE(l.minutes, 0) as minutos,
                COALESCE(l.suplencias, 0) as suplencias,
                COALESCE(l.cambio_entrada, 0) as cambio_entrada,
                COALESCE(l.cambio_salida, 0) as cambio_salida,
                COALESCE(l.victorias, 0) as victorias,
                COALESCE(g.goles, 0) as goles,
                COALESCE(a.asistencias, 0) as asistencias,
                COALESCE(l.porterias_cero, 0) as porterias_cero,
                COALESCE(c.tarjetas_amarillas, 0) as tarjetas_amarillas,
                COALESCE(c.tarjetas_rojas, 0) as tarjetas_rojas,
                COALESCE(cp.capitanias, 0) as capitanias
            FROM base_matches b
            LEFT JOIN lineup_stats l ON b.id_temporada = l.id_temporada AND b.id_competicion = l.id_competicion
            LEFT JOIN goal_stats g ON b.id_temporada = g.id_temporada AND b.id_competicion = g.id_competicion
            LEFT JOIN assist_stats a ON b.id_temporada = a.id_temporada AND b.id_competicion = a.id_competicion
            LEFT JOIN card_stats c ON b.id_temporada = c.id_temporada AND b.id_competicion = c.id_competicion
            LEFT JOIN captain_stats cp ON b.id_temporada = cp.id_temporada AND b.id_competicion = cp.id_competicion
            WHERE 
                l.convocatorias > 0 OR g.goles > 0 OR a.asistencias > 0 OR c.tarjetas_amarillas > 0 OR c.tarjetas_rojas > 0 OR cp.capitanias > 0
            ORDER BY b.temporada DESC, 
                CASE b.competicion
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
            args: [playerId, playerId, playerId, playerId, playerId],
        });

        const estadisticas: any = {};

        statsResult.rows.forEach((row: any) => {
            const temporada = row.temporada;
            if (!estadisticas[temporada]) {
                estadisticas[temporada] = {
                    temporada: temporada,
                    competiciones: [],
                    total: {
                        convocatorias: 0,
                        partidos: 0,
                        titularidades: 0,
                        minutos: 0,
                        suplencias: 0,
                        cambio_entrada: 0,
                        cambio_salida: 0,
                        victorias: 0,
                        goles: 0,
                        asistencias: 0,
                        goles_asistencias: 0,
                        porterias_cero: 0,
                        tarjetas_amarillas: 0,
                        tarjetas_rojas: 0,
                        capitanias: 0,
                    },
                };
            }

            const stats = {
                competicion: row.competicion,
                convocatorias: Number(row.convocatorias) || 0,
                partidos: Number(row.partidos) || 0,
                titularidades: Number(row.titularidades) || 0,
                minutos: Number(row.minutos) || 0,
                suplencias: Number(row.suplencias) || 0,
                cambio_entrada: Number(row.cambio_entrada) || 0,
                cambio_salida: Number(row.cambio_salida) || 0,
                victorias: Number(row.victorias) || 0,
                goles: Number(row.goles) || 0,
                asistencias: Number(row.asistencias) || 0,
                goles_asistencias:
                    (Number(row.goles) || 0) + (Number(row.asistencias) || 0),
                porterias_cero: isGoalkeeper ? Number(row.porterias_cero) || 0 : 0,
                tarjetas_amarillas: Number(row.tarjetas_amarillas) || 0,
                tarjetas_rojas: Number(row.tarjetas_rojas) || 0,
                capitanias: Number(row.capitanias) || 0,
            };

            estadisticas[temporada].competiciones.push(stats);

            const total = estadisticas[temporada].total;
            total.convocatorias += stats.convocatorias;
            total.partidos += stats.partidos;
            total.titularidades += stats.titularidades;
            total.minutos += stats.minutos;
            total.suplencias += stats.suplencias;
            total.cambio_entrada += stats.cambio_entrada;
            total.cambio_salida += stats.cambio_salida;
            total.victorias += stats.victorias;
            total.goles += stats.goles;
            total.asistencias += stats.asistencias;
            total.goles_asistencias += stats.goles_asistencias;
            total.porterias_cero += stats.porterias_cero;
            total.tarjetas_amarillas += stats.tarjetas_amarillas;
            total.tarjetas_rojas += stats.tarjetas_rojas;
            total.capitanias += stats.capitanias;
        });

        const estadisticasArray = Object.values(estadisticas);

        const careerTotal: any = {
            convocatorias: 0,
            partidos: 0,
            titularidades: 0,
            minutos: 0,
            suplencias: 0,
            cambio_entrada: 0,
            cambio_salida: 0,
            victorias: 0,
            goles: 0,
            asistencias: 0,
            goles_asistencias: 0,
            porterias_cero: 0,
            tarjetas_amarillas: 0,
            tarjetas_rojas: 0,
            capitanias: 0,
        };

        estadisticasArray.forEach((season: any) => {
            const total = season.total;
            Object.keys(careerTotal).forEach((key) => {
                careerTotal[key] += total[key];
            });
        });

        return {
            estadisticas: estadisticasArray,
            total_carrera: careerTotal,
        };

    } catch (error) {
        console.error("Error fetching player stats:", error);
        return null;
    }
}

export async function fetchPlayerDebut(playerId: string | number): Promise<{ fecha_debut: string | null; rival: string | null } | null> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('Credenciales de Turso no configuradas para debut');
            return null;
        }

        const client = createClient({
            url: url,
            authToken: authToken,
        });

        const debutQuery = `
            SELECT 
                d.fecha_debut,
                c.nombre as rival
            FROM 
                dorsales d
            LEFT JOIN 
                clubes c ON d.id_club = c.id_club
            WHERE 
                d.id_jugadora = ?
                AND d.fecha_debut IS NOT NULL
            ORDER BY 
                d.fecha_debut ASC
            LIMIT 1
        `;

        const result = await client.execute({
            sql: debutQuery,
            args: [playerId],
        });

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            fecha_debut: cleanApiValue(row.fecha_debut) || null,
            rival: cleanApiValue(row.rival) || null,
        };

    } catch (error) {
        console.error("Error fetching player debut:", error);
        return null;
    }
}

export async function fetchPlayerTrajectory(playerId: string | number): Promise<any[]> {
    try {
        const { createClient } = await import('@libsql/client');

        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('Credenciales de Turso no configuradas para trayectoria');
            return [];
        }

        const client = createClient({
            url: url,
            authToken: authToken,
        });

        const query = `
            SELECT 
                club,
                año_inicio,
                año_fin
            FROM 
                trayectoria_jugadoras
            WHERE 
                id_jugadora = ?
            ORDER BY 
                año_inicio DESC
        `;

        const result = await client.execute({
            sql: query,
            args: [playerId],
        });

        if (result.rows.length === 0) {
            return [];
        }

        return result.rows.map((row: any) => ({
            club: cleanApiValue(row.club),
            anio_inicio: cleanApiValue(row.año_inicio),
            anio_fin: cleanApiValue(row.año_fin),
        }));

    } catch (error) {
        console.error("Error fetching player trajectory:", error);
        return [];
    }
}