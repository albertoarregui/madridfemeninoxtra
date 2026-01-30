
import { cleanApiValue } from "./partidos";
import { generateSlug } from "./url-helper";

export async function fetchRefereesDirectly(): Promise<any[]> {
    try {
        const { getDbClient } = await import('../db/client');
        const client = await getDbClient();

        if (!client) {
            return [];
        }

        const query = `
            SELECT 
                a.id_arbitra,
                a.nombre,
                COUNT(p.id_partido) as played,
                SUM(CASE 
                    WHEN CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 1 
                    WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND CAST(p.penaltis AS INTEGER) = 1 THEN 1
                    ELSE 0 
                END) as wins,
                SUM(CASE 
                    WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND (p.penaltis IS NULL OR p.penaltis = '') THEN 1 
                    ELSE 0 
                END) as draws,
                SUM(CASE 
                    WHEN CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 1 
                    WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) AND CAST(p.penaltis AS INTEGER) = 0 THEN 1
                    ELSE 0 
                END) as losses,
                
                (
                    SELECT COUNT(*) 
                    FROM tarjetas t 
                    JOIN partidos p2 ON t.id_partido = p2.id_partido 
                    WHERE p2.id_arbitra = a.id_arbitra 
                      AND (UPPER(t.tipo_tarjeta) LIKE '%AMARILLA%' OR UPPER(t.tipo_tarjeta) LIKE '%YELLOW%')
                      AND UPPER(t.tipo_tarjeta) NOT LIKE '%DOBLE%'
                      AND UPPER(t.tipo_tarjeta) NOT LIKE '%DOUBLE%'
                ) as yellow_cards,
                
                (
                    SELECT COUNT(*) 
                    FROM tarjetas t 
                    JOIN partidos p2 ON t.id_partido = p2.id_partido 
                    WHERE p2.id_arbitra = a.id_arbitra 
                      AND (
                          UPPER(t.tipo_tarjeta) LIKE '%ROJA%' 
                          OR UPPER(t.tipo_tarjeta) LIKE '%RED%'
                          OR UPPER(t.tipo_tarjeta) LIKE '%DOBLE%'
                          OR UPPER(t.tipo_tarjeta) LIKE '%DOUBLE%'
                      )
                ) as red_cards,
                (
                    SELECT COUNT(*)
                    FROM penaltis pen
                    JOIN partidos p2 ON pen.id_partido = p2.id_partido
                    WHERE p2.id_arbitra = a.id_arbitra
                    AND pen.id_jugadora IS NOT NULL
                ) as penalties_for,
                (
                    SELECT COUNT(*)
                    FROM penaltis pen
                    JOIN partidos p2 ON pen.id_partido = p2.id_partido
                    WHERE p2.id_arbitra = a.id_arbitra
                    AND pen.lanzadora_rival IS NOT NULL
                ) as penalties_against

            FROM 
                arbitras a
            JOIN
                partidos p ON p.id_arbitra = a.id_arbitra
            WHERE
                p.goles_rm IS NOT NULL
            GROUP BY
                a.id_arbitra
            ORDER BY 
                played DESC, wins DESC
        `;

        const result = await client.execute(query);

        return result.rows.map((ref: any) => {
            const played = Number(ref.played || 0);
            const wins = Number(ref.wins || 0);
            const draws = Number(ref.draws || 0);
            const losses = Number(ref.losses || 0);

            return {
                id_arbitra: ref.id_arbitra,
                nombre: cleanApiValue(ref.nombre) || 'Desconocida',
                stats: {
                    played,
                    wins,
                    draws,
                    losses,
                    yellowCards: Number(ref.yellow_cards || 0),
                    redCards: Number(ref.red_cards || 0),
                    penaltiesFor: Number(ref.penalties_for || 0),
                    penaltiesAgainst: Number(ref.penalties_against || 0),
                    winPct: played > 0 ? ((wins / played) * 100).toFixed(1) : '0.0',
                    drawPct: played > 0 ? ((draws / played) * 100).toFixed(1) : '0.0',
                    lossPct: played > 0 ? ((losses / played) * 100).toFixed(1) : '0.0'
                }
            };
        });
    } catch (error) {
        console.error("Error fetching referees directly:", error);
        return [];
    }
}


export async function fetchMatchesByReferee(refereeName: string): Promise<any[]> {
    try {
        const { getDbClient } = await import('../db/client');
        const client = await getDbClient();

        if (!client) return [];

        const query = `
            SELECT 
                p.id_partido, p.fecha, p.hora, p.jornada, p.goles_rm, p.goles_rival, p.penaltis,
                c.competicion,
                cl.nombre as club_local,
                cv.nombre as club_visitante,
                t.temporada,
                e.nombre as estadio,
                e.ciudad,
                (
                    SELECT COUNT(*) 
                    FROM tarjetas tr 
                    WHERE tr.id_partido = p.id_partido 
                      AND (UPPER(tr.tipo_tarjeta) LIKE '%AMARILLA%' OR UPPER(tr.tipo_tarjeta) LIKE '%YELLOW%')
                      AND UPPER(tr.tipo_tarjeta) NOT LIKE '%DOBLE%'
                      AND UPPER(tr.tipo_tarjeta) NOT LIKE '%DOUBLE%'
                ) as amarillas,
                (
                    SELECT COUNT(*) 
                    FROM tarjetas tr 
                    WHERE tr.id_partido = p.id_partido 
                      AND (
                          UPPER(tr.tipo_tarjeta) LIKE '%ROJA%' 
                          OR UPPER(tr.tipo_tarjeta) LIKE '%RED%'
                          OR UPPER(tr.tipo_tarjeta) LIKE '%DOBLE%'
                          OR UPPER(tr.tipo_tarjeta) LIKE '%DOUBLE%'
                      )
                ) as rojas,
                (
                    SELECT COUNT(*)
                    FROM penaltis pen
                    WHERE pen.id_partido = p.id_partido
                    AND pen.id_jugadora IS NOT NULL
                ) as penalties_for,
                (
                    SELECT COUNT(*)
                    FROM penaltis pen
                    WHERE pen.id_partido = p.id_partido
                    AND pen.lanzadora_rival IS NOT NULL
                ) as penalties_against
            FROM partidos p
            LEFT JOIN arbitras a ON p.id_arbitra = a.id_arbitra
            LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
            LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
            LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
            WHERE a.nombre = ?
            ORDER BY p.fecha DESC
        `;

        const result = await client.execute({
            sql: query,
            args: [refereeName]
        });

        return result.rows.map((row: any) => ({
            ...row,
            fecha_formateada: row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            slug: `${generateSlug(row.club_local)}-vs-${generateSlug(row.club_visitante)}-${row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : 'fecha'}`
        }));

    } catch (error) {
        console.error("Error fetching matches by referee:", error);
        return [];
    }
}
