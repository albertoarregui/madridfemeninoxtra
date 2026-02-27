import { CALENDAR } from '../consts/calendar';

export interface CalendarMatch {
    id: number;
    club_local: string;
    local_foto_url: string;
    club_visitante: string;
    visitante_foto_url: string;
    estadio: string | null;
    competicion: string;
    fecha: string;         // YYYY-MM-DD
    hora: string;
    jornada: string;
    tv: string;
    // Campos derivados útiles
    team1: string;
    team2: string;
    date: string;
    time: string;
    competition: string;
    stadium: string;
    homeaway: 'home' | 'away' | 'neutral';
}

const REAL_MADRID_ID_NAMES = ['real madrid', 'real madrid femenino'];

function isRealMadrid(name: string): boolean {
    return REAL_MADRID_ID_NAMES.includes(name.toLowerCase().trim());
}

export async function fetchCalendarFromDb(): Promise<CalendarMatch[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return getStaticCalendar();

        const query = `
            SELECT
                cal.id_proximopartido AS id,
                cl.nombre  AS club_local,
                cl.foto_url AS local_foto_url,
                cv.nombre  AS club_visitante,
                cv.foto_url AS visitante_foto_url,
                e.nombre   AS estadio,
                comp.competicion,
                cal.fecha,
                cal.hora,
                cal.jornada,
                cal.tv
            FROM calendario cal
            JOIN clubes cl          ON cal.id_club_local     = cl.id_club
            JOIN clubes cv          ON cal.id_club_visitante = cv.id_club
            JOIN competiciones comp ON cal.id_competicion    = comp.id_competicion
            LEFT JOIN estadios e    ON cal.id_estadio        = e.id_estadio
            ORDER BY cal.fecha ASC, cal.hora ASC
        `;

        const result = await client.execute(query);

        if (!result.rows || result.rows.length === 0) return getStaticCalendar();

        return result.rows.map((row: any) => {
            const clubLocal = row.club_local || '';
            const clubVisitante = row.club_visitante || '';
            const rmIsLocal = isRealMadrid(clubLocal);
            const homeaway: 'home' | 'away' | 'neutral' = rmIsLocal ? 'home' : 'away';

            return {
                id: Number(row.id),
                club_local: clubLocal,
                local_foto_url: row.local_foto_url || '',
                club_visitante: clubVisitante,
                visitante_foto_url: row.visitante_foto_url || '',
                estadio: row.estadio || null,
                competicion: row.competicion || '',
                fecha: row.fecha || '',
                hora: row.hora || '',
                jornada: row.jornada || '',
                tv: row.tv || '',
                // Campos alias para compatibilidad con componentes existentes
                team1: clubLocal,
                team2: clubVisitante,
                date: row.fecha || '',
                time: row.hora || '',
                competition: row.competicion || '',
                stadium: row.estadio || '',
                homeaway,
            };
        });
    } catch (error) {
        console.error('[fetchCalendarFromDb] Error:', error);
        return getStaticCalendar();
    }
}

/** Fallback al calendario estático si la BD no está disponible */
function getStaticCalendar(): CalendarMatch[] {
    return CALENDAR.map((m, i) => {
        const rmIsLocal = isRealMadrid(m.team1);
        return {
            id: i,
            club_local: m.team1,
            local_foto_url: '',
            club_visitante: m.team2,
            visitante_foto_url: '',
            estadio: m.stadium || null,
            competicion: m.competition,
            fecha: m.date,
            hora: m.time,
            jornada: (m as any).matchday || '',
            tv: m.tv || '',
            team1: m.team1,
            team2: m.team2,
            date: m.date,
            time: m.time,
            competition: m.competition,
            stadium: m.stadium || '',
            homeaway: rmIsLocal ? 'home' : 'away',
        };
    });
}
