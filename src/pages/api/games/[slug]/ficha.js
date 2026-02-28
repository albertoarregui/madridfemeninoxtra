import { createClient } from '@libsql/client';

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = import.meta.env;

const JSON_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};
function parseSlugPartido(slug) {
    if (!slug) return null;

    const parts = slug.split('-');

    const dateIndex = parts.findIndex(p =>
        p.match(/^\d{4}$/) &&
        parts[parts.indexOf(p) + 1] && parts[parts.indexOf(p) + 1].match(/^\d{2}$/) &&
        parts[parts.indexOf(p) + 2] && parts[parts.indexOf(p) + 2].match(/^\d{2}$/)
    );

    if (dateIndex === -1) {
        return null;
    }

    const fecha = parts.slice(dateIndex, dateIndex + 3).join('-');

    return { fecha };
}

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: JSON_HEADERS
    });
};
export const GET = async ({ params }) => {

    const slug = params.slug;
    const slugData = parseSlugPartido(slug);

    if (!slugData) {
        return new Response(
            JSON.stringify({ error: "Slug de partido no válido o mal formado." }),
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
        const partidoQuery = `
            SELECT 
                p.club_local, p.club_visitante, p.goles_rm, p.goles_rival,
                p.fecha, p.hora, p.estadio, p.arbitra, p.entrenador,
                c.competicion AS competicion_nombre, t.temporada AS temporada_nombre
            FROM partidos p
            LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
            WHERE p.fecha = ?
        `;

        const partidoResult = await client.execute({
            sql: partidoQuery,
            args: [slugData.fecha],
            parse: true
        });

        const partido = partidoResult.rows[0] || null;

        if (!partido) {
            return new Response(
                JSON.stringify({ error: `Partido no encontrado para la fecha: ${slugData.fecha}.` }),
                { status: 404, headers: JSON_HEADERS }
            );
        }

        return new Response(
            JSON.stringify(partido),
            { status: 200, headers: JSON_HEADERS }
        );

    } catch (error) {
        console.error("Turso DB Error (Ficha Partido):", error.message);
        return new Response(
            JSON.stringify({ error: 'Fallo en la conexión o consulta de la base de datos: ' + error.message }),
            { status: 500, headers: JSON_HEADERS }
        );
    }
};