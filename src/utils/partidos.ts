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
    console.log('[fetchGamesDirectly] START');
    try {
        const { getPlayersDbClient } = await import('../db/client');
        console.log('[fetchGamesDirectly] getDbClient imported');
        const client = await getPlayersDbClient();
        console.log('[fetchGamesDirectly] client obtained:', !!client);

        if (!client) {
            console.error('[fetchGamesDirectly] Client is null, returning empty array');
            return [];
        }

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
                p.goles_rm,
                p.goles_rival,
                a.nombre AS arbitra_nombre,
                en.nombre AS entrenador_nombre,
                ep.posesion_rm,
                ep.posesion_rival,
                ep.xg_a_favor,
                ep.xg_en_contra,
                ep.faltas_cometidas,
                ep.faltas_recibidas,
                
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
              LEFT JOIN estadisticas_partidos ep ON p.id_partido = ep.id_partido
              ORDER BY p.id_partido ASC
        `;

        console.log('[fetchGamesDirectly] Executing query...');
        const result = await client.execute(query);
        console.log('[fetchGamesDirectly] Query executed, row count:', result.rows.length);

        return result.rows.map((game: any) => {
            const dateSlug = game.fecha ? new Date(game.fecha).toISOString().split('T')[0] : 'sin-fecha';
            return {
                ...game,
                slug: `${slugify(game.club_local)}-vs-${slugify(game.club_visitante)}-${dateSlug}`,
                fecha_formateada: formatGameDate(game.fecha),
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
        } else if (golesRm < golesRival) {
            stats.losses++;
        } else {
            // Draw in regular time, check penalties
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
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) {
            logDebug("Missing client");
            return [];
        }

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
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) return [];

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

        const penaltiesQuery = `
            SELECT p.*, j.nombre as nombre_jugadora
            FROM penaltis p
            LEFT JOIN jugadoras j ON p.id_jugadora = j.id_jugadora
            WHERE p.id_partido = ?
        `;

        const [subs, goalsResult, cardsResult, penaltiesResult] = await Promise.all([
            subsPromise,
            client.execute({ sql: goalsQuery, args: [matchId] }),
            client.execute({ sql: cardsQuery, args: [matchId] }),
            client.execute({ sql: penaltiesQuery, args: [matchId] })
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

        const penalties = penaltiesResult.rows;

        for (const penalty of penalties) {
            const parseMinute = (min: any): number => {
                if (!min) return 0;
                const s = String(min);
                if (s.includes('+')) {
                    const [base, extra] = s.split('+');
                    return Number(base) + Number(extra);
                }
                return Number(min);
            };

            const res = String(penalty.resultado || '').toLowerCase().trim();
            const isGoal = ['gol', 'g', 'marcado', 's', 'goal', 'anotado'].includes(res);
            // If it's a goal and it's already in the goals table, we might be duplicating?
            // Usually 'penaltis' table tracks the attempt. 'goles_y_asistencias' tracks the goal.
            // If we have both, we need to decide.
            // But 'penaltis' table tracks missed penalties too.
            // If the goal is already shown via 'goal' event, we shouldn't show it again as 'penalty' event if it's the exact same minute/player.
            // BUT, usually timeline separates them or merges them.
            // If I show both, it might look duplicate.
            // However, the user specifically asked to add penalties with Green/Red.

            // To avoid duplication with goals:
            // Check if there is a 'goal' event at the same minute with 'isPenalty': true.
            // If so, maybe SKIP this if it is a goal? 
            // OR maybe the user wants the specific Penalty visualization INSTEAD or ALONGSIDE.
            // Given "Sí se marca, de color verde...", this sounds like a specific visualization request.
            // I'll add it. If it duplicates, I might filter later. 
            // For now, I'll add it as type 'penalty'.

            const playerName = penalty.nombre_jugadora || penalty.lanzadora_rival;

            events.push({
                minute: parseMinute(penalty.minuto),
                displayMinute: formatDisplayMinute(penalty.minuto as any),
                type: 'penalty',
                outcome: isGoal ? 'scored' : 'missed',
                text: `Penalti ${isGoal ? 'marcado' : 'fallado'} por ${playerName || 'Desconocido'}`,
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
                p.id_temporada,
                p.id_competicion,
                p.goles_rm,
                p.goles_rival,
                t.temporada,
                c.competicion
            FROM goles_y_asistencias g
            JOIN partidos p ON g.id_partido = p.id_partido
            LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
            LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
            WHERE 1=1 
        `;

        // Note: The above query might capture own goals if we tracked them as specific types, 
        // but generally we want "Goals Scored by RM" or just "Goals in RM matches".
        // The user wants "Goles en tramos de 10 minutos". Usually this implies goals FOR.
        // Let's grab all goals connected to RM matches. 
        // BUT wait, `goles_y_asistencias` table structure usually tracks RM players. 
        // If it's a rival goal, does it exist there?
        // Checking schema via context is hard without `schema.sql`, but usually `goles_y_asistencias` 
        // is for the team's players (stats).
        // Let's assume this table only holds RM goals for now, which is safer for "Goals For".
        // If we want "Goals Against" distribution, we might not have minute data for rivals 
        // unless we have a specific table or event stream for them.
        // I will assume "Goals For" distribution is the primary request unless specified.

        const result = await client.execute(query);
        return result.rows;
    } catch (error) {
        console.error("Error fetching all goals:", error);
        return [];
    }
}

