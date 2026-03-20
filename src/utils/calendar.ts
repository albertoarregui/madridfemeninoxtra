
export interface CalendarMatch {
    id: number;
    club_local: string;
    local_foto_url: string;
    club_visitante: string;
    visitante_foto_url: string;
    estadio: string | null;
    competicion: string;
    fecha: string;
    hora: string;
    jornada: string;
    tv: string;
    team1: string;
    team2: string;
    date: string;
    time: string;
    competition: string;
    stadium: string;
    homeaway: 'home' | 'away' | 'neutral';
    estadio_foto_url: string | null;
    competicion_foto_url: string | null;
    ciudad: string | null;
    pais: string | null;
    capacidad: number | null;
    id_arbitra: number | null;
    arbitra_nombre: string | null;
}

const REAL_MADRID_ID_NAMES = ['real madrid', 'real madrid femenino'];

function isRealMadrid(name: string): boolean {
    return REAL_MADRID_ID_NAMES.includes(name.toLowerCase().trim());
}

export async function fetchCalendarFromDb(): Promise<CalendarMatch[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return [];

        const query = `
            SELECT
                p.id_partido as id, p.fecha, p.hora, p.jornada, p.tv, p.id_temporada, p.id_arbitra, p.id_estadio,
                p.goles_rm, p.goles_rival,
                t.temporada AS temporada_nombre,
                c.competicion AS competicion_nombre,
                c.foto_url AS competicion_foto_url,
                cl.nombre AS club_local,
                cl.foto_url AS local_foto_url,
                cv.nombre AS club_visitante,
                cv.foto_url AS visitante_foto_url,
                e.nombre AS estadio,
                e.ciudad,
                e.pais,
                e.capacidad,
                e.foto_url as estadio_foto_url,
                a.nombre AS arbitra_nombre
            FROM partidos p
            LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
            LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
            LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
            LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
            LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
            LEFT JOIN arbitras a ON p.id_arbitra = a.id_arbitra
            ORDER BY p.fecha ASC, p.hora ASC
        `;

        const result = await client.execute(query);

        if (!result.rows || result.rows.length === 0) {
            console.log("[fetchCalendarFromDb] No se encontraron partidos futuros en la tabla partidos");
            return [];
        }

        return result.rows.map((row: any) => {
            const clubLocal = String(row.club_local || 'Real Madrid Femenino');
            const clubVisitante = String(row.club_visitante || 'Rival');

            const rmIsLocal = isRealMadrid(clubLocal);
            const homeaway: 'home' | 'away' | 'neutral' = rmIsLocal ? 'home' : 'away';

            const fecha = String(row.fecha || '');
            const hora = String(row.hora || '');

            return {
                id: Number(row.id || 0),
                club_local: clubLocal,
                local_foto_url: String(row.local_foto_url || ''),
                club_visitante: clubVisitante,
                visitante_foto_url: String(row.visitante_foto_url || ''),
                estadio: row.estadio || null,
                competicion: row.competicion_nombre || 'Competición',
                fecha: fecha,
                hora: hora,
                jornada: String(row.jornada || ''),
                tv: String(row.tv || ''),

                team1: clubLocal,
                team2: clubVisitante,
                date: fecha,
                time: hora,
                competition: row.competicion_nombre || 'Competición',
                stadium: row.estadio || '',
                homeaway,
                estadio_foto_url: String(row.estadio_foto_url || ''),
                competicion_foto_url: String(row.competicion_foto_url || ''),
                ciudad: row.ciudad || null,
                pais: row.pais || null,
                capacidad: row.capacidad ? Number(row.capacidad) : null,
                id_arbitra: row.id_arbitra ? Number(row.id_arbitra) : null,
                arbitra_nombre: row.arbitra_nombre || null,
            };
        });
    } catch (error) {
        console.error('[fetchCalendarFromDb] Error fetching from partidos:', error);
        return [];
    }
}
