export const RANKING_VALUE_KEYS = [
    "convocatorias", "partidos", "titularidades", "minutos", "cambio_entrada",
    "cambio_salida", "victorias", "porterias_cero", "goles", "goles_victoria",
    "goles_empate", "goles_abrelatas", "penaltis", "asistencias",
    "tarjetas_amarillas", "tarjetas_rojas", "capitanias", "pases_clave",
    "tiros_totales", "tiros_puerta", "toques", "toques_area_rival",
    "pases_completados", "pases_totales", "pases_ultimo_tercio_completados",
    "pases_ultimo_tercio_totales", "pases_largo_completados", "pases_largo_totales",
    "centros_completados", "centros_totales", "regates_completados", "regates_totales",
    "duelos_suelo_ganados", "duelos_suelo_totales", "duelos_aereos_ganados",
    "duelos_aereos_totales", "intercepciones", "despejes", "bloqueos", "entradas",
    "recuperaciones", "valoracion", "valoracion_count", "perdidas", "fueras_juego",
    "regateada", "faltas_recibidas", "faltas_cometidas",
] as const;

export type RankingValueKey = typeof RANKING_VALUE_KEYS[number];
export type CompactRankingRow = [number, string, string, number[]];
export type RankingPlayerMeta = Record<string, { nombre: string; slug: string; posicion: string }>;

export function compactRankingRows(rows: any[]): {
    rows: CompactRankingRow[];
    players: RankingPlayerMeta;
} {
    const players: RankingPlayerMeta = {};
    const compact = rows.map((row): CompactRankingRow => {
        const id = Number(row.id_jugadora);
        players[String(id)] = {
            nombre: String(row.nombre || ""),
            slug: String(row.slug || ""),
            posicion: String(row.posicion || ""),
        };

        const values: number[] = [];
        RANKING_VALUE_KEYS.forEach((key, index) => {
            const value = Number(row[key] || 0);
            if (value !== 0) values.push(index, value);
        });

        return [id, String(row.temporada || ""), String(row.competicion || ""), values];
    });

    return { rows: compact, players };
}

export function expandRankingRows(
    rows: CompactRankingRow[],
    players: RankingPlayerMeta,
): any[] {
    return rows.map(([id, temporada, competicion, values]) => {
        const player = players[String(id)] || { nombre: "", slug: "", posicion: "" };
        const row: Record<string, string | number> = {
            id_jugadora: id,
            ...player,
            temporada,
            competicion,
        };

        for (let index = 0; index < values.length; index += 2) {
            const key = RANKING_VALUE_KEYS[values[index]];
            if (key) row[key] = values[index + 1];
        }

        return row;
    });
}
