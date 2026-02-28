import { createClient } from '@libsql/client';

const dbUrl = import.meta.env.TURSO_DATABASE_URL;
const dbToken = import.meta.env.TURSO_AUTH_TOKEN;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
};
export const GET = async ({ url }) => {
    if (!dbUrl || !dbToken) {
        return new Response(
            JSON.stringify({ error: "Fallo de conexión: Credenciales de Turso (URL o Token) no configuradas en el entorno." }),
            { status: 500, headers: CORS_HEADERS }
        );
    }

    const competicion = url.searchParams.get('competicion');
    const temporada = url.searchParams.get('temporada');

    let whereClauses = [];
    let params = [];

    if (competicion) {
        whereClauses.push(`c.competicion = ?`);
        params.push(competicion);
    }
    if (temporada) {
        whereClauses.push(`t.temporada = ?`);
        params.push(temporada);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sqlQuery = `
        SELECT 
            g.id_gol, 
            g.goleadora, 
            g.asistente, 
            g.id_partido, 
            g.goles_a_favor, 
            g.goles_en_contra, 
            g.minuto, 
            g.parte_cuerpo, 
            g.tipo 
        FROM 
            goles_y_asistencias g
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

    try {
        const client = createClient({ url: dbUrl, authToken: dbToken });

        const result = await client.execute({
            sql: sqlQuery,
            args: params
        });

        const columns = result.columns;
        const golesYAsistencias = result.rows.map(row => {
            let record = {};
            columns.forEach((col, index) => {
                record[col] = row[index];
            });
            return record;
        });

        return new Response(
            JSON.stringify(golesYAsistencias),
            { status: 200, headers: CORS_HEADERS }
        );

    } catch (error) {
        console.error("Turso DB Error (Goles y Asistencias, filtrado):", error.message);

        return new Response(
            JSON.stringify({ error: 'Fallo en la conexión o consulta de la base de datos: ' + error.message }),
            { status: 500, headers: CORS_HEADERS }
        );
    }
};