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

export async function fetchMatchLineups(matchId: string | number): Promise<any[]> {
    try {
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) return [];

        const client = createClient({ url, authToken });

        // We try to select dorsal if it exists in alineaciones, otherwise just player info
        const query = `
            SELECT 
                a.id_alineacion,
                j.nombre,
                j.posicion,
                j.foto_url
            FROM alineaciones a
            INNER JOIN jugadoras j ON a.id_jugadora = j.id_jugadora
            WHERE a.id_partido = ?
            ORDER BY 
                CASE j.posicion 
                    WHEN 'Portera' THEN 1
                    WHEN 'Defensa' THEN 2
                    WHEN 'Lateral' THEN 3
                    WHEN 'Centrocampista' THEN 4
                    WHEN 'Delantera' THEN 5
                    WHEN 'Extremo' THEN 6
                    ELSE 99
                END ASC
        `;

        const result = await client.execute({
            sql: query,
            args: [matchId]
        });

        // Need to import getPlayerImageUrl from players utils or duplicate it. 
        // To avoid circular dependency if players.ts imports partidos.ts, we'll duplicate or handle it.
        // matches.ts doesn't import players.ts content currently. 
        // Let's implement basic logic or import helper if moved to shared.
        // For now, simple slugify/image logic here or just pass raw data and let component handle?
        // Component expects imageUrl.

        return result.rows.map((row: any) => {
            // Helper for image (duplicated from players.ts to avoid circular deps if any)
            let fileName = row.foto_url;
            if (!fileName && row.nombre) {
                const slug = slugify(row.nombre).replace(/-/g, '_');
                const parts = slug.split('_').filter((p: string) => p.length > 0);
                const nameForFile = parts.slice(0, 4).join('_');
                fileName = `${nameForFile}.png`;
            } else if (fileName && !fileName.includes('.')) {
                fileName += '.png';
            }

            return {
                id: row.id_alineacion,
                name: row.nombre,
                pos: row.posicion, // Shorten if needed in component
                number: row.dorsal || '-',
                imageUrl: `/assets/jugadoras/${encodeURI(fileName || 'placeholder.png')}`,
                slug: slugify(row.nombre)
            };
        });

    } catch (error) {
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

        const query = `
            SELECT 
                c.minuto,
                jin.nombre as nombre_entra,
                jin.posicion as pos_entra,
                jin.foto_url as foto_entra,
                jout.nombre as nombre_sale,
                jout.posicion as pos_sale,
                jout.foto_url as foto_sale
            FROM cambios c
            INNER JOIN jugadoras jin ON c.id_jugadora_entra = jin.id_jugadora
            INNER JOIN jugadoras jout ON c.id_jugadora_sale = jout.id_jugadora
            WHERE c.id_partido = ?
            ORDER BY c.minuto ASC
        `;

        const result = await client.execute({
            sql: query,
            args: [matchId]
        });

        return result.rows.map((row: any) => {
            const processImage = (name: string, foto: string) => {
                let fileName = foto;
                if (!fileName && name) {
                    const slug = slugify(name).replace(/-/g, '_');
                    const parts = slug.split('_').filter((p: string) => p.length > 0);
                    const nameForFile = parts.slice(0, 4).join('_');
                    fileName = `${nameForFile}.png`;
                } else if (fileName && !fileName.includes('.')) {
                    fileName += '.png';
                }
                return `/assets/jugadoras/${encodeURI(fileName || 'placeholder.png')}`;
            };

            return {
                minute: row.minuto,
                playerIn: {
                    name: row.nombre_entra,
                    pos: row.pos_entra,
                    imageUrl: processImage(row.nombre_entra, row.foto_entra),
                    slug: slugify(row.nombre_entra)
                },
                playerOut: {
                    name: row.nombre_sale,
                    pos: row.pos_sale,
                    imageUrl: processImage(row.nombre_sale, row.foto_sale),
                    slug: slugify(row.nombre_sale)
                }
            };
        });

    } catch (error) {
        console.error("Error fetching substitutions:", error);
        return [];
    }
}
