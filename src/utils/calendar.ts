
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
        if (!client) return [];

        const query = `
            SELECT
                cal.*,
                cl.nombre AS club_local_nombre,
                cl.foto_url AS local_foto_url,
                cv.nombre AS club_visitante_nombre,
                cv.foto_url AS visitante_foto_url,
                e.nombre AS estadio_nombre,
                comp.competicion AS competicion_nombre
            FROM calendario cal
            LEFT JOIN clubes cl          ON cal.id_club_local = cl.id_club
            LEFT JOIN clubes cv          ON cal.id_club_visitante = cv.id_club
            LEFT JOIN competiciones comp ON cal.id_competicion = comp.id_competicion
            LEFT JOIN estadios e         ON cal.id_estadio = e.id_estadio
            ORDER BY cal.fecha ASC, cal.hora ASC
        `;

        const result = await client.execute(query);

        if (!result.rows || result.rows.length === 0) return [];

        return result.rows.map((row: any) => {
            const clubLocal = row.club_local_nombre || row.id_club_local || '';
            // Intentar detectar el ID del visitante dinámicamente por si falla el JOIN
            const visitorId = row.id_club_visitante || row['id-club_visitante'] || '';
            const clubVisitante = row.club_visitante_nombre || visitorId || '';

            const rmIsLocal = isRealMadrid(clubLocal);
            const homeaway: 'home' | 'away' | 'neutral' = rmIsLocal ? 'home' : 'away';

            const fecha = String(row.fecha || '');
            const hora = String(row.hora || '');

            return {
                id: Number(row.id_proximopartido || row.id || 0),
                club_local: clubLocal,
                local_foto_url: row.local_foto_url || '',
                club_visitante: clubVisitante,
                visitante_foto_url: row.visitante_foto_url || '',
                estadio: row.estadio_nombre || null,
                competicion: row.competicion_nombre || row.id_competicion || '',
                fecha: fecha,
                hora: hora,
                jornada: row.jornada || '',
                tv: row.tv || '',
                // Campos alias para compatibilidad
                team1: clubLocal,
                team2: clubVisitante,
                date: fecha,
                time: hora,
                competition: row.competicion_nombre || row.id_competicion || '',
                stadium: row.estadio_nombre || '',
                homeaway,
            };
        });
    } catch (error) {
        console.error('[fetchCalendarFromDb] Error:', error);
        return [];
    }
}

