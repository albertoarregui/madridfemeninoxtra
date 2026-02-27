
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

        // 1. Obtener clubes para mapear nombres y fotos
        const clubsResult = await client.execute("SELECT id_club, nombre, foto_url FROM clubes");
        const clubMap: Record<string, { nombre: string, foto_url: string }> = {};
        clubsResult.rows.forEach((r: any) => {
            if (r.id_club !== null && r.id_club !== undefined) {
                clubMap[String(r.id_club)] = {
                    nombre: String(r.nombre || ''),
                    foto_url: String(r.foto_url || '')
                };
            }
        });

        // 2. Obtener competiciones
        const compsResult = await client.execute("SELECT id_competicion, competicion FROM competiciones");
        const compMap: Record<string, string> = {};
        compsResult.rows.forEach((r: any) => {
            if (r.id_competicion !== null && r.id_competicion !== undefined) {
                compMap[String(r.id_competicion)] = String(r.competicion || '');
            }
        });

        // 3. Obtener estadios
        const estResult = await client.execute("SELECT id_estadio, nombre FROM estadios");
        const estMap: Record<string, string> = {};
        estResult.rows.forEach((r: any) => {
            if (r.id_estadio !== null && r.id_estadio !== undefined) {
                estMap[String(r.id_estadio)] = String(r.nombre || '');
            }
        });

        // 4. Obtener calendario (SELECT * para ser tolerantes a nombres de columnas)
        const result = await client.execute("SELECT * FROM calendario ORDER BY fecha ASC, hora ASC");

        if (!result.rows || result.rows.length === 0) {
            console.log("[fetchCalendarFromDb] No se encontraron filas en calendario");
            return [];
        }

        return result.rows.map((row: any) => {
            // Detección dinámica de nombres de columna (id_club_visitante o id-club_visitante)
            const idLocal = String(row.id_club_local || '');
            const idVisitante = String(row.id_club_visitante || row['id-club_visitante'] || '');
            const idComp = String(row.id_competicion || '');
            const idEstadio = String(row.id_estadi || row.id_estadio || '');

            const clubLocalData = clubMap[idLocal];
            const clubVisitanteData = clubMap[idVisitante];

            const clubLocal = clubLocalData?.nombre || idLocal || 'Real Madrid';
            const clubVisitante = clubVisitanteData?.nombre || idVisitante || 'Rival';
            const local_foto_url = clubLocalData?.foto_url || '';
            const visitante_foto_url = clubVisitanteData?.foto_url || '';
            const competicion = compMap[idComp] || idComp || 'Competición';
            const estadio = estMap[idEstadio] || null;

            const rmIsLocal = isRealMadrid(clubLocal);
            const homeaway: 'home' | 'away' | 'neutral' = rmIsLocal ? 'home' : 'away';

            const fecha = String(row.fecha || '');
            const hora = String(row.hora || '');

            return {
                id: Number(row.id_proximopartido || row.id || 0),
                club_local: clubLocal,
                local_foto_url: local_foto_url,
                club_visitante: clubVisitante,
                visitante_foto_url: visitante_foto_url,
                estadio: estadio,
                competicion: competicion,
                fecha: fecha,
                hora: hora,
                jornada: String(row.jornada || ''),
                tv: String(row.tv || ''),
                // Campos alias
                team1: clubLocal,
                team2: clubVisitante,
                date: fecha,
                time: hora,
                competition: competicion,
                stadium: estadio || '',
                homeaway,
            };
        });
    } catch (error) {
        console.error('[fetchCalendarFromDb] Error:', error);
        return [];
    }
}
