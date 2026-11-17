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

export interface ValorPeriodo { clave: string; rm: number | null; rival: number | null; rm_total?: number | null; rival_total?: number | null; }

export interface AnalisisPartido {
    periodos: Record<string, ValorPeriodo[]>;   // '1ST', '2ND', 'ALL'...
    tiros: Tiro[];
    posiciones: PosicionMedia[];
    dominio: { minuto: number; valor: number }[];
}

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

const MATCH_ANALYSIS_SQL = [
    `SELECT es_rm, id_jugadora, jugadora_nombre, minuto, minuto_anadido, resultado, situacion, parte_cuerpo, xg, x, y
     FROM tiros WHERE id_partido = ? ORDER BY segundo_partido`,
    `SELECT pm.id_jugadora, COALESCE(j.nombre, pm.jugadora_nombre) AS nombre, pm.x, pm.y, pm.acciones
     FROM posiciones_medias pm LEFT JOIN jugadoras j ON j.id_jugadora = pm.id_jugadora
     WHERE pm.id_partido = ? AND pm.es_rm = 1`,
    'SELECT minuto, valor FROM dominio_partido WHERE id_partido = ? ORDER BY minuto',
    'SELECT periodo, clave, rm, rival, rm_total, rival_total FROM estadisticas_periodos WHERE id_partido = ?',
] as const;

function buildMatchAnalysis([tiros, posiciones, dominio, periodos]: readonly (readonly any[])[]): AnalisisPartido | null {
    const porPeriodo: Record<string, ValorPeriodo[]> = {};
    for (const r of periodos) (porPeriodo[String(r.periodo)] ||= []).push({ clave: String(r.clave), rm: n(r.rm), rival: n(r.rival), rm_total: n(r.rm_total), rival_total: n(r.rival_total) });
    const data: AnalisisPartido = {
        periodos: porPeriodo,
        tiros: tiros.map((r: any) => ({
            es_rm: Number(r.es_rm) === 1, id_jugadora: n(r.id_jugadora), jugadora: String(r.jugadora_nombre ?? ''),
            minuto: n(r.minuto), minuto_anadido: n(r.minuto_anadido), resultado: String(r.resultado ?? ''),
            situacion: r.situacion ?? null, parte_cuerpo: r.parte_cuerpo ?? null, xg: n(r.xg), x: Number(r.x), y: Number(r.y),
        })),
        posiciones: posiciones.map((r: any) => ({
            id_jugadora: n(r.id_jugadora), jugadora: String(r.nombre ?? ''), x: Number(r.x), y: Number(r.y), acciones: Number(r.acciones ?? 0),
        })),
        dominio: dominio.map((r: any) => ({ minuto: Number(r.minuto), valor: Number(r.valor) })),
    };
    return data.tiros.length || data.posiciones.length || data.dominio.length || data.periodos['1ST']?.length ? data : null;
}

export async function fetchMatchAnalysis(matchId: string | number): Promise<AnalisisPartido | null> {
    try {
        const { getPlayersDbClient, readBatch } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) return null;
        return buildMatchAnalysis(await readBatch(client, MATCH_ANALYSIS_SQL.map((sql) => ({ sql, args: [matchId] }))));
    } catch (error) {
        console.error('Error fetching match analysis:', error);
        return null;
    }
}

export async function fetchMatchAnalysisCached(matchId: string | number, tags: string[], ttlMs: number): Promise<AnalisisPartido | null> {
    const { cached } = await import('./cache');
    const result = await cached(`match-analysis:v1:${matchId}`, ttlMs, async () => {
        const { getPlayersDbClient, readBatch } = await import('../db/client');
        const client = await getPlayersDbClient();
        if (!client) throw new Error('Turso no disponible');
        return { data: buildMatchAnalysis(await readBatch(client, MATCH_ANALYSIS_SQL.map((sql) => ({ sql, args: [matchId] })))) };
    }, { tags }).catch((error) => {
        console.error('Error fetching match analysis:', error);
        return { data: null };
    });
    return result.data;
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
