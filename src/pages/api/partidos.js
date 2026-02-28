import { createClient } from '@libsql/client';

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = import.meta.env;

const JSON_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
};

export const GET = async () => {

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
        const query = `
            SELECT
                p.id_partido, p.fecha, p.hora, p.jornada, p.id_temporada, p.id_arbitra, p.id_estadio,
                t.temporada AS temporada_nombre,
                c.competicion AS competicion_nombre,
                cl.nombre AS club_local,
                cl.foto_url AS local_foto_url,
                cv.nombre AS club_visitante,
                cv.foto_url AS visitante_foto_url,
                e.nombre AS estadio,
                e.foto_url AS stadium_foto_url,
                IFNULL(p.goles_rm, 0) AS goles_rm,
                IFNULL(p.goles_rival, 0) AS goles_rival,
                p.penaltis AS penaltis,
                (SELECT COUNT(*) FROM (
                    SELECT ga.id_gol FROM goles_y_asistencias ga WHERE ga.id_partido = p.id_partido AND (LOWER(ga.tipo) = 'penalti' OR LOWER(ga.tipo) = 'p')
                    UNION ALL
                    SELECT pf.id_penalti_fallado FROM penaltis_fallados pf WHERE pf.id_partido = p.id_partido AND pf.id_jugadora IS NOT NULL
                )) as penaltis_rm,
                (SELECT COUNT(*) FROM (
                    SELECT gr.id_gol_rival FROM goles_rival gr WHERE gr.id_partido = p.id_partido AND (LOWER(gr.tipo) = 'penalti' OR LOWER(gr.tipo) = 'p')
                    UNION ALL
                    SELECT pf.id_penalti_fallado FROM penaltis_fallados pf WHERE pf.id_partido = p.id_partido AND pf.id_jugadora IS NULL
                )) as penaltis_rival,
                a.nombre AS arbitra_nombre,
                en.nombre AS entrenador_nombre,
                
                CASE
                   WHEN IFNULL(p.goles_rm, 0) > IFNULL(p.goles_rival, 0) THEN 'V'
                   WHEN IFNULL(p.goles_rm, 0) < IFNULL(p.goles_rival, 0) THEN 'D'
                   WHEN IFNULL(p.goles_rm, 0) = IFNULL(p.goles_rival, 0) AND (p.penaltis = '1' OR p.penaltis = 1 OR TRIM(p.penaltis) = '1') THEN 'V'
                   WHEN IFNULL(p.goles_rm, 0) = IFNULL(p.goles_rival, 0) AND (p.penaltis = '0' OR p.penaltis = 0 OR TRIM(p.penaltis) = '0') THEN 'D'
                   ELSE 'E'
                END AS resultado

              FROM partidos p
              LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
              LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
              LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
              LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
              LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
              LEFT JOIN arbitras a ON p.id_arbitra = a.id_arbitra
              LEFT JOIN entrenadores en ON p.id_entrenador = en.id_entrenador
              ORDER BY p.id_partido ASC
        `;

        const result = await client.execute(query);
        const partidos = result.rows;

        return new Response(
            JSON.stringify(partidos),
            { status: 200, headers: JSON_HEADERS }
        );

    } catch (error) {
        console.error("Turso DB Error (Partidos):", error.message);

        return new Response(
            JSON.stringify({ error: 'Fallo en la consulta de la base de datos: ' + error.message }),
            { status: 500, headers: JSON_HEADERS }
        );
    }
};