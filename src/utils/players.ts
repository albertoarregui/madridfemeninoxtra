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

        // Query that works even when alineaciones is empty
        // Uses goles_y_asistencias as fallback source
        const statsQuery = `
            SELECT
                t.temporada,
                c.competicion,
                COALESCE(COUNT(DISTINCT a.id_alineacion), 0) as convocatorias,
                COALESCE(COUNT(DISTINCT a.id_partido), 0) as partidos,
                COALESCE(COUNT(DISTINCT CASE 
                    WHEN NOT EXISTS (
                        SELECT 1 FROM cambios cb 
                        WHERE cb.id_partido = a.id_partido 
                        AND cb.id_jugadora_entra = a.id_jugadora
                    ) 
                    THEN a.id_alineacion 
                END), 0) as titularidades,
                COALESCE(COUNT(DISTINCT CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM cambios cb 
                        WHERE cb.id_partido = a.id_partido 
                        AND cb.id_jugadora_entra = a.id_jugadora
                    ) 
                    THEN a.id_alineacion 
                END), 0) as suplencias,
                COALESCE(COUNT(DISTINCT cm_in.id_cambio), 0) as cambio_entrada,
                COALESCE(COUNT(DISTINCT cm_out.id_cambio), 0) as cambio_salida,
                COUNT(DISTINCT g.id_gol) as goles,
                COUNT(DISTINCT ast.id_gol) as asistencias,
                COALESCE(COUNT(DISTINCT CASE 
                    WHEN p.goles_rival = 0 THEN p.id_partido 
                END), 0) as porterias_cero,
                COALESCE(COUNT(DISTINCT CASE 
                    WHEN tj.tipo_tarjeta = 'Amarilla' THEN tj.id_tarjeta 
                END), 0) as tarjetas_amarillas,
                COALESCE(COUNT(DISTINCT CASE 
                    WHEN tj.tipo_tarjeta = 'Roja' THEN tj.id_tarjeta 
                END), 0) as tarjetas_rojas,
                COALESCE(COUNT(DISTINCT cap.id_capitania), 0) as capitanias,
                COALESCE(SUM(
                    CASE
                        -- Titular que es sustituida
                        WHEN a.id_alineacion IS NOT NULL 
                             AND cm_out.id_cambio IS NOT NULL 
                             AND NOT EXISTS (
                                 SELECT 1 FROM cambios cb 
                                 WHERE cb.id_partido = a.id_partido 
                                 AND cb.id_jugadora_entra = a.id_jugadora
                             )
                        THEN cm_out.minuto

                        -- Titular que juega todo el partido
                        WHEN a.id_alineacion IS NOT NULL 
                             AND cm_out.id_cambio IS NULL 
                             AND NOT EXISTS (
                                 SELECT 1 FROM cambios cb 
                                 WHERE cb.id_partido = a.id_partido 
                                 AND cb.id_jugadora_entra = a.id_jugadora
                             )
                        THEN 90

                        -- Suplente que entra y es sustituida (raro)
                        WHEN cm_in.id_cambio IS NOT NULL 
                             AND cm_out.id_cambio IS NOT NULL 
                        THEN (cm_out.minuto - cm_in.minuto)

                        -- Suplente que entra y termina el partido
                        WHEN cm_in.id_cambio IS NOT NULL 
                             AND cm_out.id_cambio IS NULL 
                        THEN (90 - cm_in.minuto)

                        ELSE 0
                    END
                ), 0) as minutos
            FROM (
                -- Get all partidos where player scored or assisted
                SELECT DISTINCT ga.id_partido, ? as id_jugadora
                FROM goles_y_asistencias ga
                WHERE ga.goleadora = ? OR ga.asistente = ?
            ) player_partidos
            INNER JOIN partidos p ON player_partidos.id_partido = p.id_partido
            INNER JOIN temporadas t ON p.id_temporada = t.id_temporada
            INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN alineaciones a ON a.id_partido = player_partidos.id_partido 
                AND a.id_jugadora = player_partidos.id_jugadora
            LEFT JOIN cambios cm_in ON cm_in.id_partido = player_partidos.id_partido 
                AND cm_in.id_jugadora_entra = player_partidos.id_jugadora
            LEFT JOIN cambios cm_out ON cm_out.id_partido = player_partidos.id_partido 
                AND cm_out.id_jugadora_sale = player_partidos.id_jugadora
            LEFT JOIN goles_y_asistencias g ON g.id_partido = player_partidos.id_partido 
                AND g.goleadora = player_partidos.id_jugadora
            LEFT JOIN goles_y_asistencias ast ON ast.id_partido = player_partidos.id_partido 
                AND ast.asistente = player_partidos.id_jugadora
            LEFT JOIN tarjetas tj ON tj.id_partido = player_partidos.id_partido 
                AND tj.id_jugadora = player_partidos.id_jugadora
            LEFT JOIN capitanias cap ON cap.id_partido = player_partidos.id_partido 
                AND cap.id_jugadora = player_partidos.id_jugadora
            GROUP BY t.temporada, c.competicion
            ORDER BY t.temporada DESC, c.competicion ASC
        `;

        const statsResult = await client.execute({
            sql: statsQuery,
            args: [playerId, playerId, playerId],
        });

        // Process results
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

            // Add to season total
            const total = estadisticas[temporada].total;
            total.convocatorias += stats.convocatorias;
            total.partidos += stats.partidos;
            total.titularidades += stats.titularidades;
            total.minutos += stats.minutos;
            total.suplencias += stats.suplencias;
            total.cambio_entrada += stats.cambio_entrada;
            total.cambio_salida += stats.cambio_salida;
            total.goles += stats.goles;
            total.asistencias += stats.asistencias;
            total.goles_asistencias += stats.goles_asistencias;
            total.porterias_cero += stats.porterias_cero;
            total.tarjetas_amarillas += stats.tarjetas_amarillas;
            total.tarjetas_rojas += stats.tarjetas_rojas;
            total.capitanias += stats.capitanias;
        });

        const estadisticasArray = Object.values(estadisticas);

        // Calculate career totals
        const careerTotal: any = {
            convocatorias: 0,
            partidos: 0,
            titularidades: 0,
            minutos: 0,
            suplencias: 0,
            cambio_entrada: 0,
            cambio_salida: 0,
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