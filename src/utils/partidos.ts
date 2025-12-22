export function slugify(text: string | null | undefined): string {
    if (!text) return 'desconocido';
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
                p.id_partido, p.fecha, p.hora, p.jornada, p.id_temporada, p.id_arbitra, p.id_estadio,
                t.temporada AS temporada_nombre,
                c.competicion AS competicion_nombre,
                cl.nombre AS club_local,
                cv.nombre AS club_visitante,
                e.nombre AS estadio,
                e.ciudad,
                e.pais,
                e.capacidad,
                IFNULL(p.goles_rm, 0) AS goles_rm,
                IFNULL(p.goles_rival, 0) AS goles_rival,
                a.nombre AS arbitra_nombre,
                en.nombre AS entrenador_nombre,
                
                CASE 
                   WHEN IFNULL(p.goles_rm, 0) > IFNULL(p.goles_rival, 0) THEN 'V'
                   WHEN IFNULL(p.goles_rm, 0) < IFNULL(p.goles_rival, 0) THEN 'D'
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

        return result.rows.map((game: any) => {
            const dateSlug = game.fecha ? new Date(game.fecha).toISOString().split('T')[0] : 'sin-fecha';
            return {
                ...game,
                slug: `${slugify(game.club_local)}-vs-${slugify(game.club_visitante)}-${dateSlug}`,
                fecha_formateada: formatGameDate(game.fecha),
            };
        });
    } catch (error) {
        console.error("Error al obtener partidos directamente de la DB:", error);
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
}

export function calculateRivalStats(matches: any[], rivalName: string): RivalStats {
    const stats: RivalStats = {
        wins: 0,
        draws: 0,
        losses: 0
    };

    if (!matches || !Array.isArray(matches)) return stats;

    const normalizedRivalName = rivalName.toLowerCase().trim();

    matches.forEach((match) => {
        const clubLocal = (match.club_local || '').toLowerCase().trim();
        const clubVisitante = (match.club_visitante || '').toLowerCase().trim();

        const isRivalMatch = clubLocal === normalizedRivalName || clubVisitante === normalizedRivalName;

        if (!isRivalMatch) return;

        const golesRm = parseInt(match.goles_rm) || 0;
        const golesRival = parseInt(match.goles_rival) || 0;

        if (golesRm > golesRival) {
            stats.wins++;
        } else if (golesRm === golesRival) {
            stats.draws++;
        } else {
            stats.losses++;
        }
    });

    return stats;
}

// Helper to log to file
function logDebug(message: string) {
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.resolve(process.cwd(), 'debug_ssr_log.txt');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        // ignore
    }
}

export async function fetchMatchLineups(matchId: string | number): Promise<any[]> {
    logDebug(`Fetching lineups for matchId: ${matchId}`);
    try {
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            logDebug("Missing credentials");
            return [];
        }

        const client = createClient({ url, authToken });

        // We try to select dorsal if it exists in alineaciones, otherwise just player info
        const query = `
            SELECT 
                a.id_alineacion,
                a.id_jugadora,
                a.minutos_jugados,
                a.minuto_salida,
                j.nombre,
                j.posicion,
                d.dorsal,
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

        logDebug(`Lineups found: ${result.rows.length}`);

        return result.rows.map((row: any) => {
            // Helper for image 
            let fileName: string | null = null;
            if (row.nombre) {
                const slug = slugify(row.nombre).replace(/-/g, '_');
                const parts = slug.split('_').filter((p: string) => p.length > 0);
                const nameForFile = parts.slice(0, 4).join('_');
                fileName = `${nameForFile}.png`;
            }

            // Fallback if player not found in join
            const displayName = row.nombre || `Jugadora ID: ${row.id_jugadora}`;
            const displayPos = row.posicion || '-';

            return {
                id: row.id_alineacion,
                name: displayName,
                pos: displayPos,
                number: row.dorsal || '-',
                imageUrl: `/assets/jugadoras/${encodeURI(fileName || 'placeholder.png')}`,
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
        logDebug(`Error fetching lineups: ${error}`);
        console.error("Error fetching lineups:", error);
        return [];
    }
}

export async function fetchMatchSubstitutions(matchId: string | number): Promise<any[]> {
    try {
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) return [];

        const client = createClient({ url, authToken });

        // Fetch players with entry or exit minutes from ALINEACIONES
        const query = `
            SELECT 
                a.id_alineacion,
                a.id_jugadora,
                a.minuto_entrada,
                a.minuto_salida,
                j.nombre,
                j.nombre,
                j.posicion,
                (SELECT COUNT(*) FROM goles_y_asistencias g WHERE g.id_partido = a.id_partido AND (g.goleadora = a.id_jugadora OR g.goleadora = j.nombre)) as goles,
                (SELECT COUNT(*) FROM goles_y_asistencias g WHERE g.id_partido = a.id_partido AND (g.asistente = a.id_jugadora OR g.asistente = j.nombre)) as asistencias,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND UPPER(t.tipo_tarjeta) = 'AMARILLA') as tarjetas_amarillas,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND (UPPER(t.tipo_tarjeta) LIKE '%ROJA%' OR UPPER(t.tipo_tarjeta) = 'RED')) as tarjetas_rojas,
                (SELECT COUNT(*) FROM tarjetas t WHERE t.id_partido = a.id_partido AND t.id_jugadora = a.id_jugadora AND (UPPER(t.tipo_tarjeta) LIKE '%DOBLE%' OR UPPER(t.tipo_tarjeta) LIKE '%DOUBLE%')) as tarjetas_doble_amarillas
            FROM alineaciones a
            LEFT JOIN jugadoras j ON a.id_jugadora = j.id_jugadora
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
                    imageUrl: `/assets/jugadoras/${encodeURI(fileName || 'placeholder.png')}`,
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
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) return [];

        const client = createClient({ url, authToken });

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
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) return { wins: 0, draws: 0, losses: 0, total: 0 };

        const client = createClient({ url, authToken });



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
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) return { wins: 0, draws: 0, losses: 0, total: 0, yellowCards: 0, redCards: 0 };

        const client = createClient({ url, authToken });

        // Query to get match results
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

        // Query to get card stats
        // We join with the 'tarjetas' table if it exists. Based on grep, it seems to exist.
        // We filter by match ID where referee matches.
        const cardQuery = `
            SELECT 
                SUM(CASE WHEN t.tipo_tarjeta = 'Amarilla' THEN 1 ELSE 0 END) as yellowCards,
                SUM(CASE WHEN t.tipo_tarjeta = 'Roja' THEN 1 ELSE 0 END) as redCards
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

        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;
        const client = createClient({ url, authToken });

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

        const [subs, goalsResult, cardsResult] = await Promise.all([
            subsPromise,
            client.execute({ sql: goalsQuery, args: [matchId] }),
            client.execute({ sql: cardsQuery, args: [matchId] })
        ]);

        const events: any[] = [];

        const validGoals = (matchScore === 0) ? [] : goalsResult.rows;

        const formatDisplayMinute = (min: any): string => {
            const s = String(min);
            if (s.includes('+')) return s;
            const val = Number(min);
            if (!isNaN(val) && val > 90) {
                return `90+${val - 90}`;
            }
            return s;
        };

        for (const goal of validGoals) {
            let playerName = goal.nombre_jugadora;

            if (!playerName) {
                playerName = goal.goleadora;
            }

            let goalText = "";
            if (!playerName && !goal.goleadora) {
                goalText = "En propia puerta";
            } else {

                if (!playerName) playerName = "En propia puerta";
                goalText = `Gol de ${playerName}`;
            }

            let assistantName = goal.nombre_asistente;
            if (!assistantName && goal.asistente) {
                assistantName = goal.asistente;
            }

            if (assistantName) {
                goalText += ` (Asis. ${assistantName})`;
            }

            if (goal.tipo === 'penalti') {
                goalText += ' (P)';
            }

            const parseMinute = (min: any): number => {
                if (!min) return 0;
                const s = String(min);
                if (s.includes('+')) {
                    const [base, extra] = s.split('+');
                    return Number(base) + Number(extra);
                }
                return Number(min);
            };

            events.push({
                minute: parseMinute(goal.minuto),
                displayMinute: formatDisplayMinute(goal.minuto),
                type: 'goal',
                text: goalText,
                scorer: playerName,
                assistant: assistantName,
                isPenalty: goal.tipo === 'penalti',
                isOwnGoal: (!goal.nombre_jugadora && !goal.goleadora),
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

        return events.sort((a, b) => a.minute - b.minute);

    } catch (e) {
        console.error("Error fetching match events:", e);
        return [];
    }
}
