// Datos de análisis importados de Sofascore: mapa de tiros, posiciones medias,
// gráfico de dominio y mapas de calor.

export interface Tiro {
    es_rm: boolean;
    id_jugadora: number | null;
    jugadora: string;
    minuto: number | null;
    minuto_anadido: number | null;
    resultado: string;        // goal | save | miss | block | post
    situacion: string | null;
    parte_cuerpo: string | null;
    xg: number | null;
    x: number;                // distancia a la línea de gol atacada (0-100 del largo)
    y: number;                // 0-100 a lo ancho
}

export interface PosicionMedia {
    id_jugadora: number | null;
    jugadora: string;
    x: number;
    y: number;
    acciones: number;
}

export interface ValorPeriodo { clave: string; rm: number | null; rival: number | null; }

export interface AnalisisPartido {
    periodos: Record<string, ValorPeriodo[]>;   // '1ST', '2ND', 'ALL'...
    tiros: Tiro[];
    posiciones: PosicionMedia[];
    dominio: { minuto: number; valor: number }[];
}

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function fetchMatchAnalysis(matchId: string | number, options: { fresh?: boolean } = {}): Promise<AnalisisPartido | null> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient({ forceRefresh: options.fresh });
        if (!client) return null;
        const [tiros, posiciones, dominio, periodos] = await Promise.all([
            client.execute({ sql: `SELECT es_rm, id_jugadora, jugadora_nombre, minuto, minuto_anadido, resultado, situacion, parte_cuerpo, xg, x, y
                                   FROM tiros WHERE id_partido = ? ORDER BY segundo_partido`, args: [matchId] }),
            client.execute({ sql: `SELECT pm.id_jugadora, COALESCE(j.nombre, pm.jugadora_nombre) AS nombre, pm.x, pm.y, pm.acciones
                                   FROM posiciones_medias pm LEFT JOIN jugadoras j ON j.id_jugadora = pm.id_jugadora
                                   WHERE pm.id_partido = ? AND pm.es_rm = 1`, args: [matchId] }),
            client.execute({ sql: 'SELECT minuto, valor FROM dominio_partido WHERE id_partido = ? ORDER BY minuto', args: [matchId] }),
            client.execute({ sql: 'SELECT periodo, clave, rm, rival FROM estadisticas_periodos WHERE id_partido = ?', args: [matchId] }),
        ]);
        const porPeriodo: Record<string, ValorPeriodo[]> = {};
        for (const r of periodos.rows as any[]) (porPeriodo[String(r.periodo)] ||= []).push({ clave: String(r.clave), rm: n(r.rm), rival: n(r.rival) });
        const data: AnalisisPartido = {
            periodos: porPeriodo,
            tiros: tiros.rows.map((r: any) => ({
                es_rm: Number(r.es_rm) === 1, id_jugadora: n(r.id_jugadora), jugadora: String(r.jugadora_nombre ?? ''),
                minuto: n(r.minuto), minuto_anadido: n(r.minuto_anadido), resultado: String(r.resultado ?? ''),
                situacion: r.situacion ?? null, parte_cuerpo: r.parte_cuerpo ?? null, xg: n(r.xg), x: Number(r.x), y: Number(r.y),
            })),
            posiciones: posiciones.rows.map((r: any) => ({
                id_jugadora: n(r.id_jugadora), jugadora: String(r.nombre ?? ''), x: Number(r.x), y: Number(r.y), acciones: Number(r.acciones ?? 0),
            })),
            dominio: dominio.rows.map((r: any) => ({ minuto: Number(r.minuto), valor: Number(r.valor) })),
        };
        return data.tiros.length || data.posiciones.length || data.dominio.length || data.periodos['1ST']?.length ? data : null;
    } catch (error) {
        console.error('Error fetching match analysis:', error);
        return null;
    }
}

export async function fetchPlayerShots(playerId: string | number, temporada?: string): Promise<(Tiro & { partido: string })[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return [];
        const res = await client.execute({
            sql: `SELECT t.*, p.fecha FROM tiros t JOIN partidos p ON p.id_partido = t.id_partido
                  LEFT JOIN temporadas te ON te.id_temporada = p.id_temporada
                  WHERE t.id_jugadora = ? AND t.es_rm = 1 ${temporada ? 'AND te.temporada = ?' : ''}
                  ORDER BY p.fecha, t.segundo_partido`,
            args: temporada ? [playerId, temporada] : [playerId],
        });
        return res.rows.map((r: any) => ({
            es_rm: true, id_jugadora: n(r.id_jugadora), jugadora: String(r.jugadora_nombre ?? ''), minuto: n(r.minuto), minuto_anadido: n(r.minuto_anadido),
            resultado: String(r.resultado ?? ''), situacion: r.situacion ?? null, parte_cuerpo: r.parte_cuerpo ?? null, xg: n(r.xg),
            x: Number(r.x), y: Number(r.y), partido: String(r.fecha ?? ''),
        }));
    } catch (error) {
        console.error('Error fetching player shots:', error);
        return [];
    }
}

export async function fetchPlayerHeatmap(playerId: string | number, temporada?: string): Promise<number[][]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return [];
        const res = await client.execute({
            sql: `SELECT mc.puntos FROM mapas_calor mc JOIN partidos p ON p.id_partido = mc.id_partido
                  LEFT JOIN temporadas te ON te.id_temporada = p.id_temporada
                  WHERE mc.id_jugadora = ? ${temporada ? 'AND te.temporada = ?' : ''}`,
            args: temporada ? [playerId, temporada] : [playerId],
        });
        return res.rows.flatMap((r: any) => { try { return JSON.parse(String(r.puntos)); } catch { return []; } });
    } catch (error) {
        console.error('Error fetching player heatmap:', error);
        return [];
    }
}
