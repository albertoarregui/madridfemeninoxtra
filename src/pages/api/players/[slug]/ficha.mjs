import { createClient } from '@libsql/client';

function slugToProperName(slug) {
    if (!slug) return '';

    let name = slug.replace(/-/g, ' ');

    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    name = name.replace(/ Del /g, ' del ').replace(/ De La /g, ' de la ');

    return name;
}


function rowToObject(row, columns) {
    if (!row) return null;
    const obj = {};
    columns.forEach((col, index) => {
        obj[col] = row[index];
    });
    return obj;
}

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = import.meta.env;

const JSON_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

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
        let jugadora;

        const fichaQuery = `
            SELECT 
                id_jugadora, 
                nombre, 
                fecha_nacimiento, 
                pais_origen, 
                altura, 
                peso, 
                posicion
            FROM jugadoras 
            WHERE nombre = ?
        `;

        const fichaResult = await client.execute({ sql: fichaQuery, args: [nombreJugadora], parse: true });

        if (fichaResult.rows.length === 0) {
            return new Response(
                JSON.stringify({ error: `Jugadora con nombre '${nombreJugadora}' no encontrada.` }),
                { status: 404, headers: JSON_HEADERS }
            );
        }

        jugadora = rowToObject(fichaResult.rows[0], fichaResult.columns);
        const id_jugadora = jugadora.id_jugadora;

        const debutQuery = `
            SELECT 
                T_DEBUT.dorsal, T_DEBUT.goles_club, T_DEBUT.asistencias_club, T_DEBUT.partidos_club,
                T_DEBUT.fecha_debut, T_DEBUT.id_partido_debut, T_DEBUT.minuto_debut,
                T_CLUB.nombre AS club_rival
            FROM dorsales T_DEBUT
            LEFT JOIN clubes T_CLUB
                ON T_DEBUT.id_club = T_CLUB.id_club
            WHERE T_DEBUT.id_jugadora = ?
                -- Esta subconsulta filtra para encontrar el registro con la fecha más antigua (debut)
                AND T_DEBUT.fecha_debut = (
                    SELECT MIN(fecha_debut) 
                    FROM dorsales 
                    WHERE id_jugadora = ? 
                    AND fecha_debut IS NOT NULL
                )
            LIMIT 1
        `;

        const debutResult = await client.execute({
            sql: debutQuery,
            args: [id_jugadora, id_jugadora],
            parse: true
        });

        const dorsalActual = debutResult.rows.length > 0
            ? rowToObject(debutResult.rows[0], debutResult.columns)
            : null;


        const trayectoria = [];


        return new Response(
            JSON.stringify({
                ficha: jugadora,
                dorsal_actual: dorsalActual,
                trayectoria: trayectoria
            }),
            { status: 200, headers: JSON_HEADERS }
        );

    } catch (error) {

        console.error("Error en base de datos (Ficha Jugadora):", error.message);

        return new Response(
            JSON.stringify({ error: 'Fallo en la conexión o consulta de la base de datos: ' + error.message }),
            { status: 500, headers: JSON_HEADERS }
        );
    }
};