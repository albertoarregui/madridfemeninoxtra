
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

        const compsResult = await client.execute("SELECT id_competicion, competicion, foto_url FROM competiciones");
        const compMap: Record<string, { nombre: string, foto_url: string }> = {};
        compsResult.rows.forEach((r: any) => {
            if (r.id_competicion !== null && r.id_competicion !== undefined) {
                compMap[String(r.id_competicion)] = {
                    nombre: String(r.competicion || ''),
                    foto_url: String(r.foto_url || '')
                };
            }
        });

        const estResult = await client.execute("SELECT id_estadio, nombre, foto_url, ciudad, pais, capacidad FROM estadios");
        const estMap: Record<string, { nombre: string, foto_url: string, ciudad: string, pais: string, capacidad: number }> = {};
        estResult.rows.forEach((r: any) => {
            if (r.id_estadio !== null && r.id_estadio !== undefined) {
                estMap[String(r.id_estadio)] = {
                    nombre: String(r.nombre || ''),
                    foto_url: String(r.foto_url || ''),
                    ciudad: String(r.ciudad || ''),
                    pais: String(r.pais || ''),
                    capacidad: Number(r.capacidad || 0)
                };
            }
        });

        const arbResult = await client.execute("SELECT id_arbitra, nombre FROM arbitras");
        const arbMap: Record<string, string> = {};
        arbResult.rows.forEach((r: any) => {
            if (r.id_arbitra !== null && r.id_arbitra !== undefined) {
                arbMap[String(r.id_arbitra)] = String(r.nombre || '');
            }
        });

        const result = await client.execute("SELECT * FROM calendario ORDER BY fecha ASC, hora ASC");

        if (!result.rows || result.rows.length === 0) {
            console.log("[fetchCalendarFromDb] No se encontraron filas en calendario");
            return [];
        }

        return result.rows.map((row: any) => {

            const idLocal = String(row.id_club_local || '');
            const idVisitante = String(row.id_club_visitante || row['id-club_visitante'] || '');
            const idComp = String(row.id_competicion || '');
            const idEstadio = String(row.id_estadi || row.id_estadio || '');
            const idArbitra = String(row.id_arbitra || row.id_arbitro || '');

            const clubLocalData = clubMap[idLocal];
            const clubVisitanteData = clubMap[idVisitante];
            const estadioData = estMap[idEstadio];

            const clubLocal = clubLocalData?.nombre || idLocal || 'Real Madrid';
            const clubVisitante = clubVisitanteData?.nombre || idVisitante || 'Rival';
            const local_foto_url = clubLocalData?.foto_url || '';
            const visitante_foto_url = clubVisitanteData?.foto_url || '';
            const competitionData = compMap[idComp];
            const competicion = competitionData?.nombre || idComp || 'Competición';
            const competicion_foto_url = competitionData?.foto_url || null;
            const estadio = estadioData?.nombre || null;
            const estadio_foto_url = estadioData?.foto_url || null;
            const ciudad = estadioData?.ciudad || null;
            const pais = estadioData?.pais || null;
            const capacidad = estadioData?.capacidad || null;
            const arbitra_nombre = arbMap[idArbitra] || null;

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

                team1: clubLocal,
                team2: clubVisitante,
                date: fecha,
                time: hora,
                competition: competicion,
                stadium: estadio || '',
                homeaway,
                estadio_foto_url: estadio_foto_url,
                competicion_foto_url: competicion_foto_url,
                ciudad: ciudad,
                pais: pais,
                capacidad: capacidad,
                id_arbitra: idArbitra ? Number(idArbitra) : null,
                arbitra_nombre: arbitra_nombre,
            };
        });
    } catch (error) {
        console.error('[fetchCalendarFromDb] Error:', error);
        return [];
    }
}


