

import { createClient } from '@libsql/client';

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = import.meta.env;

const JSON_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

function slugToProperName(slug) {
    if (!slug) return '';

    let name = slug.replace(/-/g, ' ');

    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    name = name.replace(/ Del /g, ' del ').replace(/ De La /g, ' de la ');

    return name;
}

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: JSON_HEADERS
    });
};

/**
 * @param {object} context 
 */
export const GET = async ({ params }) => {

    const slug = params.slug;
    const nombreJugadora = slugToProperName(slug);

    if (!nombreJugadora) {
        return new Response(
            JSON.stringify({ error: "Slug de jugadora no válido o vacío." }),
            { status: 400, headers: JSON_HEADERS }
        );
    }

    if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
        return new Response(
            JSON.stringify({ error: "Fallo de conexión: Credenciales de Turso no configuradas." }),
            { status: 500, headers: JSON_HEADERS }
        );
    }

    const client = createClient({
        url: TURSO_DATABASE_URL,
        authToken: TURSO_AUTH_TOKEN,
    });

    try {
        // First get player ID and position
        const playerQuery = `
            SELECT id_jugadora, nombre, posicion
            FROM jugadoras 
            WHERE LOWER(nombre) LIKE LOWER(?)
        `;

        const playerResult = await client.execute({
            sql: playerQuery,
            args: [`%${nombreJugadora}%`],
            parse: true
        });

        if (playerResult.rows.length === 0) {
            return new Response(
                JSON.stringify({ error: `Jugadora con nombre '${nombreJugadora}' no encontrada.` }),
                { status: 404, headers: JSON_HEADERS }
            );
        }

        const jugadora = playerResult.rows[0];
        const id_jugadora = jugadora.id_jugadora;
        const isGoalkeeper = jugadora.posicion === 'Portera';

        // Main statistics query - aggregated by season and competition
        const statsQuery = `
            SELECT
                t.temporada,
                t.id_temporada,
                c.competicion,
                c.id_competicion,
                
                -- Convocatorias (appearances in lineup/squad)
                COUNT(DISTINCT a.id_alineacion) as convocatorias,
                
                -- Partidos (matches played - same as convocatorias for now)
                COUNT(DISTINCT a.id_partido) as partidos,
                
                -- Titularidades (starts - assuming alineaciones means starting lineup)
                COUNT(DISTINCT CASE 
                    WHEN NOT EXISTS (
                        SELECT 1 FROM cambios cb 
                        WHERE cb.id_partido = a.id_partido 
                        AND cb.id_jugadora_entra = a.id_jugadora
                    ) 
                    THEN a.id_alineacion 
                END) as titularidades,
                
                -- Suplencias (times on bench/substitute)
                COUNT(DISTINCT CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM cambios cb 
                        WHERE cb.id_partido = a.id_partido 
                        AND cb.id_jugadora_entra = a.id_jugadora
                    ) 
                    THEN a.id_alineacion 
                END) as suplencias,
                
                -- Cambio entrada (substituted in)
                COUNT(DISTINCT cm_in.id_cambio) as cambio_entrada,
                
                -- Cambio salida (substituted out)
                COUNT(DISTINCT cm_out.id_cambio) as cambio_salida,
                
                -- Goles (goals)
                COUNT(DISTINCT g.id_gol) as goles,
                
                -- Asistencias (assists)
                COUNT(DISTINCT ast.id_gol) as asistencias,
                
                -- Porterías a cero (clean sheets - only for goalkeepers)
                COUNT(DISTINCT CASE 
                    WHEN p.goles_rival = 0 THEN p.id_partido 
                END) as porterias_cero,
                
                -- Tarjetas amarillas (yellow cards)
                COUNT(DISTINCT CASE 
                    WHEN tj.tipo_tarjeta = 'Amarilla' THEN tj.id_tarjeta 
                END) as tarjetas_amarillas,
                
                -- Tarjetas rojas (red cards)
                COUNT(DISTINCT CASE 
                    WHEN tj.tipo_tarjeta = 'Roja' THEN tj.id_tarjeta 
                END) as tarjetas_rojas,
                
                -- Capitanías (times as captain)
                COUNT(DISTINCT cap.id_capitania) as capitanias
                
            FROM alineaciones a
            INNER JOIN partidos p ON a.id_partido = p.id_partido
            INNER JOIN temporadas t ON p.id_temporada = t.id_temporada
            INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
            
            -- Cambios entrada (substituted in)
            LEFT JOIN cambios cm_in ON cm_in.id_partido = a.id_partido 
                AND cm_in.id_jugadora_entra = a.id_jugadora
            
            -- Cambios salida (substituted out)
            LEFT JOIN cambios cm_out ON cm_out.id_partido = a.id_partido 
                AND cm_out.id_jugadora_sale = a.id_jugadora
            
            -- Goles
            LEFT JOIN goles_y_asistencias g ON g.id_partido = a.id_partido 
                AND g.goleadora = a.id_jugadora
            
            -- Asistencias
            LEFT JOIN goles_y_asistencias ast ON ast.id_partido = a.id_partido 
                AND ast.asistente = a.id_jugadora
            
            -- Tarjetas
            LEFT JOIN tarjetas tj ON tj.id_partido = a.id_partido 
                AND tj.id_jugadora = a.id_jugadora
            
            -- Capitanías
            LEFT JOIN capitanias cap ON cap.id_partido = a.id_partido 
                AND cap.id_jugadora = a.id_jugadora
            
            WHERE a.id_jugadora = ?
            
            GROUP BY t.temporada, t.id_temporada, c.competicion, c.id_competicion
            ORDER BY t.id_temporada DESC, c.competicion ASC
        `;

        const statsResult = await client.execute({
            sql: statsQuery,
            args: [id_jugadora],
            parse: true
        });

        // Process and structure the results
        const estadisticas = {};
        const temporadasSet = new Set();

        statsResult.rows.forEach(row => {
            const temporada = row.temporada;
            const competicion = row.competicion;

            temporadasSet.add(temporada);

            if (!estadisticas[temporada]) {
                estadisticas[temporada] = {
                    temporada: temporada,
                    competiciones: [],
                    total: {
                        convocatorias: 0,
                        partidos: 0,
                        titularidades: 0,
                        suplencias: 0,
                        cambio_entrada: 0,
                        cambio_salida: 0,
                        goles: 0,
                        asistencias: 0,
                        goles_asistencias: 0,
                        porterias_cero: 0,
                        tarjetas_amarillas: 0,
                        tarjetas_rojas: 0,
                        capitanias: 0
                    }
                };
            }

            const stats = {
                competicion: competicion,
                convocatorias: Number(row.convocatorias) || 0,
                partidos: Number(row.partidos) || 0,
                titularidades: Number(row.titularidades) || 0,
                suplencias: Number(row.suplencias) || 0,
                cambio_entrada: Number(row.cambio_entrada) || 0,
                cambio_salida: Number(row.cambio_salida) || 0,
                goles: Number(row.goles) || 0,
                asistencias: Number(row.asistencias) || 0,
                goles_asistencias: (Number(row.goles) || 0) + (Number(row.asistencias) || 0),
                porterias_cero: isGoalkeeper ? (Number(row.porterias_cero) || 0) : 0,
                tarjetas_amarillas: Number(row.tarjetas_amarillas) || 0,
                tarjetas_rojas: Number(row.tarjetas_rojas) || 0,
                capitanias: Number(row.capitanias) || 0
            };

            estadisticas[temporada].competiciones.push(stats);

            // Add to season total
            const total = estadisticas[temporada].total;
            total.convocatorias += stats.convocatorias;
            total.partidos += stats.partidos;
            total.titularidades += stats.titularidades;
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

        // Convert to array and sort by season
        const estadisticasArray = Object.values(estadisticas);

        // Calculate career totals
        const careerTotal = {
            convocatorias: 0,
            partidos: 0,
            titularidades: 0,
            suplencias: 0,
            cambio_entrada: 0,
            cambio_salida: 0,
            goles: 0,
            asistencias: 0,
            goles_asistencias: 0,
            porterias_cero: 0,
            tarjetas_amarillas: 0,
            tarjetas_rojas: 0,
            capitanias: 0
        };

        estadisticasArray.forEach(season => {
            const total = season.total;
            careerTotal.convocatorias += total.convocatorias;
            careerTotal.partidos += total.partidos;
            careerTotal.titularidades += total.titularidades;
            careerTotal.suplencias += total.suplencias;
            careerTotal.cambio_entrada += total.cambio_entrada;
            careerTotal.cambio_salida += total.cambio_salida;
            careerTotal.goles += total.goles;
            careerTotal.asistencias += total.asistencias;
            careerTotal.goles_asistencias += total.goles_asistencias;
            careerTotal.porterias_cero += total.porterias_cero;
            careerTotal.tarjetas_amarillas += total.tarjetas_amarillas;
            careerTotal.tarjetas_rojas += total.tarjetas_rojas;
            careerTotal.capitanias += total.capitanias;
        });

        return new Response(
            JSON.stringify({
                jugadora: {
                    id: jugadora.id_jugadora,
                    nombre: jugadora.nombre,
                    posicion: jugadora.posicion,
                    es_portera: isGoalkeeper
                },
                estadisticas: estadisticasArray,
                total_carrera: careerTotal
            }),
            { status: 200, headers: JSON_HEADERS }
        );

    } catch (error) {
        console.error("Error en base de datos (Stats Jugadora):", error.message);

        return new Response(
            JSON.stringify({ error: 'Fallo en la conexión o consulta de la base de datos: ' + error.message }),
            { status: 500, headers: JSON_HEADERS }
        );
    }
};
