const MATCH_METRIC_FIELDS = [
    "posesion_rm",
    "posesion_rival",
    "rm_pases_completados",
    "rm_pases_totales",
    "rival_pases_completados",
    "rival_pases_totales",
    "rm_pases_largo_completados",
    "rm_pases_largo_totales",
    "rival_pases_largo_completados",
    "rival_pases_largo_totales",
    "rm_pases_tercio_completados",
    "rm_pases_tercio_totales",
    "rival_pases_tercio_completados",
    "rival_pases_tercio_totales",
    "rm_centros_completados",
    "rm_centros_totales",
    "rival_centros_completados",
    "rival_centros_totales",
    "rm_toques_area_rival",
    "rival_toques_area_rival",
    "xg_a_favor",
    "xg_en_contra",
    "rm_asistencias_esperadas",
    "rival_asistencias_esperadas",
    "rm_tiros",
    "rival_tiros",
    "rm_tiros_puerta",
    "rival_tiros_puerta",
    "rm_grandes_ocasiones",
    "rival_grandes_ocasiones",
    "rm_tiros_palo",
    "rival_tiros_palo",
    "rm_corners",
    "rival_corners",
    "rm_regates",
    "rival_regates",
    "rm_fueras_juego",
    "rival_fueras_juego",
    "rm_paradas",
    "rival_paradas",
    "rm_entradas_ganadas",
    "rm_entradas_totales",
    "rival_entradas_ganadas",
    "rival_entradas_totales",
    "rm_intercepciones",
    "rival_intercepciones",
    "rm_recuperaciones",
    "rival_recuperaciones",
    "rm_despejes",
    "rival_despejes",
    "rm_duelos_suelo_ganados",
    "rm_duelos_suelo_totales",
    "rival_duelos_suelo_ganados",
    "rival_duelos_suelo_totales",
    "rm_duelos_aereos_ganados",
    "rm_duelos_aereos_totales",
    "rival_duelos_aereos_ganados",
    "rival_duelos_aereos_totales",
    "faltas_cometidas",
    "faltas_recibidas",
    "rm_tiros_libres",
    "rival_tiros_libres",
] as const;

export function hasMeaningfulValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== "";
}

export function hasMatchMetrics(match: Record<string, unknown>): boolean {
    return MATCH_METRIC_FIELDS.some((field) => hasMeaningfulValue(match[field]));
}

export function hasSubstantiveHtml(value: unknown, minimumCharacters = 200): boolean {
    if (typeof value !== "string") return false;
    const plainText = value
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;|&#160;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    return plainText.length >= minimumCharacters;
}

export function isIndexableMatchSummary(match: Record<string, any>): boolean {
    if (!match.slug || !match.isPlayed) return false;
    return Boolean(
        hasMatchMetrics(match) ||
        match.once_inicial_url ||
        match.mvp ||
        hasMeaningfulValue(match.asistencia),
    );
}

export function isIndexableMatchDetail(
    match: Record<string, any>,
    context: { hasEditorial: boolean; lineupCount: number; eventCount: number; galleryCount?: number },
): boolean {
    if (!match.isPlayed) return false;
    return Boolean(
        context.hasEditorial ||
        context.lineupCount >= 5 ||
        context.eventCount > 0 ||
        (context.galleryCount ?? 0) > 0 ||
        hasMatchMetrics(match),
    );
}

export function hasPlayedStats(item: Record<string, any>): boolean {
    return Number(item?.stats?.played ?? 0) > 0;
}

export function isIndexablePlayerSummary(player: Record<string, any>): boolean {
    return Boolean(
        player.slug &&
        player.nombre &&
        player.posicion &&
        Array.isArray(player.temporadas) &&
        player.temporadas.length > 0,
    );
}
