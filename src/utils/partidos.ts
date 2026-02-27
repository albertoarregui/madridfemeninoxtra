import { getAssetUrl } from './assets';
import { getRivalShieldUrl } from './rivales';

export function slugify(text: string | null | undefined): string {
    if (!text) return 'desconocido';
    return text.toString().toLowerCase()
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

export function formatGameDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

export async function fetchGamesDirectly(): Promise<any[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) {
            return [];
        }

        const query = `
            SELECT
                p.id_partido, p.fecha, p.hora, p.jornada, p.id_temporada, p.id_arbitra, p.id_estadio, p.mvp, p.asistencia, p.penaltis,
                t.temporada AS temporada_nombre,
                c.competicion AS competicion_nombre,
                cl.nombre AS club_local,
                cl.foto_url AS local_foto_url,
                cv.nombre AS club_visitante,
                cv.foto_url AS visitante_foto_url,
                e.nombre AS estadio,
                e.ciudad,
                e.pais,
                e.capacidad,
                e.lat AS estadio_lat,
                e.lng AS estadio_lng,
                e.foto_url as estadio_foto_url,
                p.goles_rm,
                p.goles_rival,
                a.nombre AS arbitra_nombre,
                jm.nombre AS mvp_nombre,
                en.nombre AS entrenador_nombre,
                ep.posesion_rm,
                ep.posesion_rival,
                ep.xg_a_favor,
                ep.xg_en_contra,
                ep.faltas_cometidas,
                ep.faltas_recibidas,
                (SELECT COUNT(*) FROM tarjetas tr WHERE tr.id_partido = p.id_partido AND tr.id_jugadora IS NOT NULL AND (UPPER(tr.tipo_tarjeta) LIKE '%AMARILLA%' OR UPPER(tr.tipo_tarjeta) LIKE '%YELLOW%') AND UPPER(tr.tipo_tarjeta) NOT LIKE '%DOBLE%') as amarillas_rm,
                (SELECT COUNT(*) FROM tarjetas tr WHERE tr.id_partido = p.id_partido AND tr.id_jugadora IS NULL AND (UPPER(tr.tipo_tarjeta) LIKE '%AMARILLA%' OR UPPER(tr.tipo_tarjeta) LIKE '%YELLOW%') AND UPPER(tr.tipo_tarjeta) NOT LIKE '%DOBLE%') as amarillas_rival,
                (SELECT COUNT(*) FROM tarjetas tr WHERE tr.id_partido = p.id_partido AND tr.id_jugadora IS NOT NULL AND (UPPER(tr.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(tr.tipo_tarjeta) LIKE '%RED%' OR UPPER(tr.tipo_tarjeta) LIKE '%DOBLE%')) as rojas_rm,
                (SELECT COUNT(*) FROM tarjetas tr WHERE tr.id_partido = p.id_partido AND tr.id_jugadora IS NULL AND (UPPER(tr.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(tr.tipo_tarjeta) LIKE '%RED%' OR UPPER(tr.tipo_tarjeta) LIKE '%DOBLE%')) as rojas_rival,
                (SELECT COUNT(*) FROM goles_y_asistencias ga WHERE ga.id_partido = p.id_partido AND (LOWER(ga.tipo) = 'penalti' OR LOWER(ga.tipo) = 'p')) as penaltis_rm,
                0 as penaltis_rival,
                
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
              LEFT JOIN jugadoras jm ON p.mvp = jm.id_jugadora
              LEFT JOIN entrenadores en ON p.id_entrenador = en.id_entrenador
              LEFT JOIN estadisticas_partidos ep ON p.id_partido = ep.id_partido
              ORDER BY p.id_partido ASC
        `;

        const result = await client.execute(query);

        return result.rows.map((game: any) => {
            const dateSlug = game.fecha ? new Date(game.fecha).toISOString().split('T')[0] : 'sin-fecha';
            return {
                ...game,
                mvp: cleanApiValue(game.mvp),
                local_foto_url: cleanApiValue(game.local_foto_url),
                visitante_foto_url: cleanApiValue(game.visitante_foto_url),
                local_shield_url: getRivalShieldUrl({ nombre: game.club_local, foto_url: game.local_foto_url }),
                visitante_shield_url: getRivalShieldUrl({ nombre: game.club_visitante, foto_url: game.visitante_foto_url }),
                slug: `${slugify(game.club_local)}-vs-${slugify(game.club_visitante)}-${dateSlug}`,
                fecha_formateada: formatGameDate(game.fecha),
                estadio_lat: game.estadio_lat != null ? Number(game.estadio_lat) : null,
                estadio_lng: game.estadio_lng != null ? Number(game.estadio_lng) : null,
            };
        });
    } catch (error) {
        console.error("[fetchGamesDirectly] ERROR:", error);
        return [];
    }
}

export async function fetchGames(): Promise<any[]> {
    const API_URL = '/api/partidos';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            console.error(`Error fetching games from API: ${response.status}`);
            return [];
        }

        const games = await response.json();

        if (!Array.isArray(games)) return [];

        return games.map(game => {
            const dateSlug = game.fecha ? new Date(game.fecha).toISOString().split('T')[0] : 'sin-fecha';
            return {
                ...game,
                slug: `${slugify(game.club_local)}-vs-${slugify(game.club_visitante)}-${dateSlug}`,
                fecha_formateada: formatGameDate(game.fecha),
            };
        });
    } catch (error) {
        console.error("Fallo al obtener partidos de la API:", error);
        return [];
    }
}

export interface RivalStats {
    wins: number;
    draws: number;
    losses: number;
    total: number;
}

export function calculateRivalStats(matches: any[], rivalName: string): RivalStats {
    const stats: RivalStats = {
        wins: 0,
        draws: 0,
        losses: 0,
        total: 0
    };

    if (!matches || !Array.isArray(matches)) return stats;

    const normalizeForComparison = (name: string) => {
        return (name || '').toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+de\s+/gi, '')
            .replace(/\s+la\s+/gi, '')
            .replace(/\s*femenino\s*/gi, '')
            .replace(/\s*femeni\s*/gi, '')
            .replace(/\s*f\.\s*f\.\s*/gi, '')
            .replace(/\s*c\.\s*f\.\s*/gi, '')
            .replace(/[^a-z0-9]/g, '') // Elimina todo lo que no sea letra o número
            .replace(/^real/i, '')     // Quita "Real" al principio (común en muchos equipos)
            .replace(/^cd/i, '')       // Quita "CD" al principio
            .replace(/^club/i, '')     // Quita "Club" al principio
            .trim();
    };

    const normalizedRivalName = normalizeForComparison(rivalName);

    const isRivalMatch = (name: string) => {
        const n = normalizeForComparison(name);
        if (!n || !normalizedRivalName) return false;
        return n === normalizedRivalName || n.includes(normalizedRivalName) || normalizedRivalName.includes(n);
    };

    matches.forEach((match) => {
        const clubLocal = (match.club_local || '').toLowerCase().trim();
        const clubVisitante = (match.club_visitante || '').toLowerCase().trim();

        const rivalInMatch = isRivalMatch(clubLocal) || isRivalMatch(clubVisitante);

        if (!rivalInMatch) return;

        stats.total++;

        const golesRm = parseInt(match.goles_rm) || 0;
        const golesRival = parseInt(match.goles_rival) || 0;

        if (golesRm > golesRival) {
            stats.wins++;
        } else if (golesRm < golesRival) {
            stats.losses++;
        } else {
            const penalties = match.penaltis;
            if (penalties === 1 || penalties === '1') {
                stats.wins++;
            } else if (penalties === 0 || penalties === '0') {
                stats.losses++;
            } else {
                stats.draws++;
            }
        }
    });

    return stats;
}



export async function fetchMatchLineups(matchId: string | number): Promise<any[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) {
            return [];
        }

        const query = `
            SELECT 
                a.id_alineacion,
                a.id_jugadora,
                a.minutos_jugados,
                a.minuto_salida,
                j.nombre,
                j.posicion,
                d.dorsal,
                d.foto_url,
                (SELECT COUNT(*) FROM goles_y_asistencias g WHERE g.id_partido = a.id_partido AND (g.goleadora = a.id_jugadora OR g.goleadora = j.nombre)) as goles,
                (SELECT COUNT(*) FROM goles_y_asistencias g WHERE g.id_partido = a.id_partido AND (g.asistente = a.id_jugadora OR g.asistente = j.nombre)) as asistencias,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND UPPER(t.tipo_tarjeta) = 'AMARILLA') as tarjetas_amarillas,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND (UPPER(t.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(t.tipo_tarjeta) = 'RED')) as tarjetas_rojas,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND (UPPER(t.tipo_tarjeta) LIKE '%DOBLE%' OR UPPER(t.tipo_tarjeta) LIKE '%DOUBLE%')) as tarjetas_doble_amarillas
            FROM alineaciones a
            LEFT JOIN jugadoras j ON a.id_jugadora = j.id_jugadora
            LEFT JOIN partidos p ON a.id_partido = p.id_partido
            LEFT JOIN dorsales d ON a.id_jugadora = d.id_jugadora AND p.id_temporada = d.id_temporada
            WHERE a.id_partido = ? AND a.titular = 1
            ORDER BY 
                CASE j.posicion 
                    WHEN 'Portera' THEN 1
                    WHEN 'Lateral izquierda' THEN 2
                    WHEN 'Lateral Izquierda' THEN 2
                    WHEN 'Defensa' THEN 3
                    WHEN 'Central' THEN 3
                    WHEN 'Lateral derecha' THEN 4
                    WHEN 'Lateral Derecha' THEN 4
                    WHEN 'Centrocampista' THEN 5
                    WHEN 'Pivote' THEN 5
                    WHEN 'Interior' THEN 5
                    WHEN 'Extremo' THEN 6
                    WHEN 'Extremo izquierdo' THEN 6
                    WHEN 'Extremo derecho' THEN 6
                    WHEN 'Delantera' THEN 7
                    ELSE 99
                END ASC
        `;

        const result = await client.execute({
            sql: query,
            args: [matchId]
        });

        return result.rows.map((row: any) => {

            let fileName: string | null = null;
            if (row.nombre) {
                const slug = slugify(row.nombre).replace(/-/g, '_');
                const parts = slug.split('_').filter((p: string) => p.length > 0);
                const nameForFile = parts.slice(0, 4).join('_');
                fileName = `${nameForFile}.png`;
            }

            const displayName = row.nombre || `Jugadora ID: ${row.id_jugadora}`;
            const displayPos = row.posicion || '-';

            return {
                id: row.id_alineacion,
                name: displayName,
                pos: displayPos,
                number: row.dorsal || '-',
                imageUrl: (row.foto_url && (row.foto_url.startsWith('http://') || row.foto_url.startsWith('https://')))
                    ? row.foto_url
                    : getAssetUrl('jugadoras', fileName || 'placeholder.png'),
                slug: row.nombre ? slugify(row.nombre) : '#',
                minutes: row.minutos_jugados,
                substituted: row.minuto_salida !== null,
                goals: row.goles,
                assists: row.asistencias,
                yellowCards: row.tarjetas_amarillas,
                redCards: row.tarjetas_rojas,
                doubleYellows: row.tarjetas_doble_amarillas
            };
        });
    } catch (error) {
        console.error("Error fetching lineups:", error);
        return [];
    }
}

export async function fetchMatchSubstitutions(matchId: string | number): Promise<any[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) return [];

        const query = `
            SELECT 
                a.id_alineacion,
                a.id_jugadora,
                a.minuto_entrada,
                a.minuto_salida,
                j.nombre,
                j.posicion,
                d.foto_url,
                (SELECT COUNT(*) FROM goles_y_asistencias g WHERE g.id_partido = a.id_partido AND (g.goleadora = a.id_jugadora OR g.goleadora = j.nombre)) as goles,
                (SELECT COUNT(*) FROM goles_y_asistencias g WHERE g.id_partido = a.id_partido AND (g.asistente = a.id_jugadora OR g.asistente = j.nombre)) as asistencias,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND UPPER(t.tipo_tarjeta) = 'AMARILLA') as tarjetas_amarillas,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND (UPPER(t.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(t.tipo_tarjeta) = 'RED')) as tarjetas_rojas,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND (UPPER(t.tipo_tarjeta) LIKE '%DOBLE%' OR UPPER(t.tipo_tarjeta) LIKE '%DOUBLE%')) as tarjetas_doble_amarillas
            FROM alineaciones a
            LEFT JOIN jugadoras j ON a.id_jugadora = j.id_jugadora
            LEFT JOIN partidos p ON a.id_partido = p.id_partido
            LEFT JOIN dorsales d ON a.id_jugadora = d.id_jugadora AND p.id_temporada = d.id_temporada
            WHERE a.id_partido = ? AND (a.minuto_entrada IS NOT NULL OR a.minuto_salida IS NOT NULL)
            ORDER BY IFNULL(a.minuto_entrada, a.minuto_salida) ASC
        `;

        const result = await client.execute({
            sql: query,
            args: [matchId]
        });

        const rows = result.rows;
        const substitutions: any[] = [];
        const playersIn = rows.filter((r: any) => r.minuto_entrada !== null && r.minuto_entrada !== 0);

        const usedPlayersOut = new Set();

        playersIn.forEach((pIn: any) => {
            const minute = pIn.minuto_entrada;

            const pOut = rows.find((r: any) =>
                r.minuto_salida === minute &&
                r.id_alineacion !== pIn.id_alineacion &&
                !usedPlayersOut.has(r.id_alineacion)
            );

            if (pOut) {
                usedPlayersOut.add(pOut.id_alineacion);
            }

            const processPlayer = (row: any) => {
                let fileName: string | null = null;
                if (row.nombre) {
                    const slug = slugify(row.nombre).replace(/-/g, '_');
                    const parts = slug.split('_').filter((p: string) => p.length > 0);
                    const nameForFile = parts.slice(0, 4).join('_');
                    fileName = `${nameForFile}.png`;
                }
                return {
                    name: row.nombre || `Jugadora ID: ${row.id_jugadora}`,
                    pos: row.posicion || '-',
                    imageUrl: (row.foto_url && (row.foto_url.startsWith('http://') || row.foto_url.startsWith('https://')))
                        ? row.foto_url
                        : getAssetUrl('jugadoras', fileName || 'placeholder.png'),
                    slug: row.nombre ? slugify(row.nombre) : '#',
                    goals: row.goles,
                    assists: row.asistencias,
                    yellowCards: row.tarjetas_amarillas,
                    redCards: row.tarjetas_rojas,
                    doubleYellows: row.tarjetas_doble_amarillas
                };
            };

            substitutions.push({
                minute: minute,
                playerIn: processPlayer(pIn),
                playerOut: pOut ? processPlayer(pOut) : { name: '?', pos: '', imageUrl: '', slug: '#' }
            });
        });

        return substitutions.sort((a, b) => a.minute - b.minute);

    } catch (error) {
        console.error("Error fetching substitutions:", error);
        return [];
    }
}

export async function fetchMatchGoals(matchId: string | number): Promise<any[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) return [];

        const query = `
            SELECT * FROM goles_y_asistencias WHERE id_partido = ?
        `;

        const result = await client.execute({
            sql: query,
            args: [matchId]
        });

        return result.rows;
    } catch (error) {
        console.error("Error fetching match goals:", error);
        return [];
    }
}

export async function fetchStadiumStats(stadiumName: string | null): Promise<{ wins: number, draws: number, losses: number, total: number }> {
    if (!stadiumName) return { wins: 0, draws: 0, losses: 0, total: 0 };

    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) return { wins: 0, draws: 0, losses: 0, total: 0 };



        const safeQuery = `
             SELECT 
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
                COUNT(*) as total
            FROM partidos p
            LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
            WHERE e.nombre = ? AND p.goles_rm IS NOT NULL AND p.goles_rm != ''
        `;

        const result = await client.execute({
            sql: safeQuery,
            args: [stadiumName]
        });

        const row = result.rows[0];

        return {
            wins: Number(row.wins || 0),
            draws: Number(row.draws || 0),
            losses: Number(row.losses || 0),
            total: Number(row.total || 0)
        };

    } catch (error) {
        console.error("Error fetching stadium stats:", error);
        return { wins: 0, draws: 0, losses: 0, total: 0 };
    }
}

export async function fetchRefereeStats(refereeId: string | number | null): Promise<{ wins: number, draws: number, losses: number, total: number, yellowCards: number, redCards: number }> {
    if (!refereeId) return { wins: 0, draws: 0, losses: 0, total: 0, yellowCards: 0, redCards: 0 };

    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) return { wins: 0, draws: 0, losses: 0, total: 0, yellowCards: 0, redCards: 0 };

        const matchQuery = `
             SELECT 
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
                COUNT(*) as total
            FROM partidos p
            WHERE p.id_arbitra = ? AND p.goles_rm IS NOT NULL AND p.goles_rm != ''
        `;

        const cardQuery = `
            SELECT 
                SUM(CASE 
                    WHEN (UPPER(t.tipo_tarjeta) LIKE '%AMARILLA%' OR UPPER(t.tipo_tarjeta) LIKE '%YELLOW%') 
                         AND UPPER(t.tipo_tarjeta) NOT LIKE '%DOBLE%' 
                         AND UPPER(t.tipo_tarjeta) NOT LIKE '%DOUBLE%' 
                    THEN 1 ELSE 0 END) as yellowCards,
                SUM(CASE 
                    WHEN UPPER(t.tipo_tarjeta) LIKE '%ROJA%' 
                         OR UPPER(t.tipo_tarjeta) LIKE '%RED%' 
                         OR UPPER(t.tipo_tarjeta) LIKE '%DOBLE%' 
                         OR UPPER(t.tipo_tarjeta) LIKE '%DOUBLE%'
                    THEN 1 ELSE 0 END) as redCards
            FROM tarjetas t
            INNER JOIN partidos p ON t.id_partido = p.id_partido
            WHERE p.id_arbitra = ?
        `;

        const [matchResult, cardResult] = await Promise.all([
            client.execute({ sql: matchQuery, args: [refereeId] }),
            client.execute({ sql: cardQuery, args: [refereeId] })
        ]);

        const matchRow = matchResult.rows[0];
        const cardRow = cardResult.rows[0];

        return {
            wins: Number(matchRow.wins || 0),
            draws: Number(matchRow.draws || 0),
            losses: Number(matchRow.losses || 0),
            total: Number(matchRow.total || 0),
            yellowCards: Number(cardRow.yellowCards || 0),
            redCards: Number(cardRow.redCards || 0)
        };

    } catch (error) {
        console.error("Error fetching referee stats:", error);
        return { wins: 0, draws: 0, losses: 0, total: 0, yellowCards: 0, redCards: 0 };
    }
}

export async function fetchMatchEvents(matchId: string | number, matchScore?: number): Promise<any[]> {
    try {
        const subsPromise = fetchMatchSubstitutions(matchId);

        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return [];

        const goalsQuery = `
            SELECT g.*, j.nombre as nombre_jugadora, a.nombre as nombre_asistente
            FROM goles_y_asistencias g
            LEFT JOIN jugadoras j ON g.goleadora = j.id_jugadora
            LEFT JOIN jugadoras a ON g.asistente = a.id_jugadora
            WHERE g.id_partido = ?
        `;

        const cardsQuery = `
            SELECT t.*, j.nombre as nombre_jugadora
            FROM tarjetas t
            LEFT JOIN jugadoras j ON t.id_jugadora = j.id_jugadora
            WHERE t.id_partido = ?
        `;



        const penaltyShootoutQuery = `
            SELECT pt.*, j.nombre as nombre_jugadora
            FROM penaltis_tanda pt
            LEFT JOIN jugadoras j ON pt.id_jugadora = j.id_jugadora
            WHERE pt.id_partido = ?
            ORDER BY pt.orden ASC
        `;

        const ownGoalsQuery = `
            SELECT og.*, j.nombre as nombre_jugadora
            FROM goles_propia og
            LEFT JOIN jugadoras j ON og.id_jugadora = j.id_jugadora
            WHERE og.id_partido = ?
        `;

        const [subs, goalsResult, cardsResult, shootoutResult, ownGoalsResult] = await Promise.all([
            subsPromise,
            client.execute({ sql: goalsQuery, args: [matchId] }),
            client.execute({ sql: cardsQuery, args: [matchId] }),
            client.execute({ sql: penaltyShootoutQuery, args: [matchId] }),
            client.execute({ sql: ownGoalsQuery, args: [matchId] })
        ]);

        const events: any[] = [];

        const validGoals = (matchScore === 0) ? [] : goalsResult.rows;

        const formatDisplayMinute = (min: any): string => {
            return String(min);
        };

        for (const goal of validGoals) {
            const parseMinute = (min: any): number => {
                if (!min) return 0;
                const s = String(min);
                if (s.includes('+')) {
                    const [base, extra] = s.split('+');
                    return Number(base) + Number(extra);
                }
                return Number(min);
            };

            const tipoLower = String(goal.tipo || '').toLowerCase().trim();
            const isOwnGoalInGolesTable = (!goal.nombre_jugadora && goal.goleadora) || tipoLower === 'propia' || tipoLower === 'own_goal' || tipoLower === 'p.p.';

            if (isOwnGoalInGolesTable) continue;


            if (!goal.goleadora && !goal.nombre_jugadora) continue;

            let playerName = goal.nombre_jugadora || goal.goleadora || "Desconocida";
            let goalText = `Gol de ${playerName}`;

            let assistantName = goal.nombre_asistente || goal.asistente;
            if (assistantName) {
                goalText += ` (Asis. ${assistantName})`;
            }

            events.push({
                minute: parseMinute(goal.minuto),
                displayMinute: formatDisplayMinute(goal.minuto),
                type: 'goal',
                text: goalText,
                scorer: playerName,
                assistant: assistantName,
                isPenalty: tipoLower === 'penalti' || tipoLower === 'p',
                isOwnGoal: false,
                team: 'local'
            });
        }

        const cards = cardsResult.rows;

        for (const card of cards) {
            const parseMinute = (min: any): number => {
                if (!min) return 0;
                const s = String(min);
                if (s.includes('+')) {
                    const [base, extra] = s.split('+');
                    return Number(base) + Number(extra);
                }
                return Number(min);
            };

            const rawType = String(card.tipo_tarjeta).toUpperCase();
            let cardType = 'Yellow';
            let cardText = 'Tarjeta amarilla';

            if (rawType.includes('DOBLE') || rawType.includes('DOUBLE')) {
                cardType = 'DoubleYellow';
                cardText = 'Doble amarilla';
            } else if (rawType.includes('ROJA') || rawType === 'RED') {
                cardType = 'Red';
                cardText = 'Tarjeta roja';
            }

            events.push({
                minute: parseMinute(card.minuto),
                displayMinute: formatDisplayMinute(card.minuto),
                type: 'card',
                cardType: cardType,
                text: `${cardText} a ${card.nombre_jugadora || 'Jugadora'}`,
                player: card.nombre_jugadora,
                team: 'local'
            });
        }



        for (const og of ownGoalsResult.rows) {
            const parseMinute = (min: any): number => {
                if (!min) return 0;
                const s = String(min);
                if (s.includes('+')) {
                    const [base, extra] = s.split('+');
                    return Number(base) + Number(extra);
                }
                return Number(min);
            };

            const playerName = og.nombre_jugadora || og.rival_nombre;

            events.push({
                minute: parseMinute(og.minuto),
                displayMinute: formatDisplayMinute(og.minuto),
                type: 'own_goal',
                text: `${playerName} (P.P.)`,
                player: playerName,
                team: 'local'
            });
        }

        for (const sub of subs) {
            const parseMinute = (min: string | number): number => {
                const s = String(min);
                if (s.includes('+')) {
                    const [base, extra] = s.split('+');
                    return Number(base) + Number(extra);
                }
                return Number(min);
            };

            events.push({
                minute: parseMinute(sub.minute),
                displayMinute: formatDisplayMinute(sub.minute),
                type: 'sub',
                text: `Entra ${sub.playerIn.name} por ${sub.playerOut.name}`,
                playerIn: sub.playerIn.name,
                playerOut: sub.playerOut.name,
                team: 'local'
            });
        }

        for (const pt of shootoutResult.rows) {
            const res = String(pt.resultado || '').toLowerCase().trim();
            const isGoal = ['gol', 'g', 'marcado', 's', 'goal', 'anotado', '1'].includes(res);
            const playerName = pt.nombre_jugadora || pt.nombre_rival;

            events.push({
                minute: 200 + Number(pt.orden || 0),
                displayMinute: 'P',
                type: 'shootout',
                outcome: isGoal ? 'scored' : 'missed',
                text: `Tanda: ${isGoal ? 'Gol' : 'Fallo'} de ${playerName || 'Desconocido'}`,
                player: playerName,
                team: pt.id_jugadora ? 'local' : 'rival',
                order: pt.orden
            });
        }

        return events.sort((a, b) => a.minute - b.minute);

    } catch (e) {
        console.error("Error fetching match events:", e);
        return [];
    }
}

export async function fetchAllGoals(): Promise<any[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) return [];

        const query = `
            SELECT 
                g.id_gol,
                g.id_partido,
                g.minuto,
                g.tipo,
                g.goleadora,
                g.asistente,
                p.id_temporada,
                p.id_competicion,
                p.goles_rm,
                p.goles_rival,
                t.temporada,
                c.competicion,
                COALESCE(j.nombre, g.goleadora) as nombre_goleadora,
                -- Prioridad: 1. Foto dorsal temporada actual, 2. Foto jugadora, 3. Foto dorsal fallback, 4. Foto jugadora por nombre
                COALESCE(d1.foto_url, j.foto_url, d2.foto_url, j2.foto_url) as foto_goleadora,
                COALESCE(ast.nombre, g.asistente) as nombre_asistente,
                COALESCE(d_ast1.foto_url, ast.foto_url, d_ast2.foto_url, ast2.foto_url) as foto_asistente
            FROM goles_y_asistencias g
            JOIN partidos p ON g.id_partido = p.id_partido
            LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
            LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
            
            -- Goleadora: Relación por ID
            LEFT JOIN jugadoras j ON g.goleadora = j.id_jugadora
            -- Foto de la temporada actual del partido
            LEFT JOIN dorsales d1 ON (g.goleadora = d1.id_jugadora AND p.id_temporada = d1.id_temporada)
            -- Foto de la última temporada disponible (fallback general)
            LEFT JOIN dorsales d2 ON (g.goleadora = d2.id_jugadora AND d2.id_temporada = (SELECT MAX(id_temporada) FROM dorsales WHERE id_jugadora = g.goleadora))
            
            -- Goleadora: Relación por Nombre (fallback si id_jugadora es null)
            LEFT JOIN jugadoras j2 ON (g.goleadora = j2.nombre AND j.id_jugadora IS NULL)
            
            -- Asistente: Relación por ID
            LEFT JOIN jugadoras ast ON g.asistente = ast.id_jugadora
            -- Foto dorsal asistente temporada actual
            LEFT JOIN dorsales d_ast1 ON (g.asistente = d_ast1.id_jugadora AND p.id_temporada = d_ast1.id_temporada)
            -- Foto dorsal asistente última temporada
            LEFT JOIN dorsales d_ast2 ON (g.asistente = d_ast2.id_jugadora AND d_ast2.id_temporada = (SELECT MAX(id_temporada) FROM dorsales WHERE id_jugadora = g.asistente))
            
            -- Asistente: Relación por Nombre (fallback)
            LEFT JOIN jugadoras ast2 ON (g.asistente = ast2.nombre AND ast.id_jugadora IS NULL)
            
            WHERE 1=1 
        `;

        const result = await client.execute(query);
        return result.rows;
    } catch (error) {
        console.error("Error fetching all goals:", error);
        return [];
    }
}

