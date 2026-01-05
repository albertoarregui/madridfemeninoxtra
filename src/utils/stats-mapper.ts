
export const STATS_TRANSLATIONS: Record<string, string> = {
    // General
    player: "Jugadora",
    nationality: "Nacionalidad",
    position: "Posición",
    age: "Edad",
    matches: "Partidos",
    games: "PJ",
    games_starts: "Titular",
    minutes: "Minutos",
    minutes_90s: "90s",

    // Standard
    goals: "Goles",
    assists: "Asistencias",
    goals_assists: "G+A",
    goals_pens: "Goles (sin pen.)",
    pens_made: "Pen. Marcados",
    pens_att: "Pen. Tirados",
    cards_yellow: "Amarillas",
    cards_red: "Rojas",
    xg: "xG",
    npxg: "npxG",
    xg_assist: "xAG",
    npxg_xg_assist: "npxG+xAG",
    progressive_carries: "Conducciones Prog.",
    progressive_passes: "Pases Prog.",
    progressive_passes_received: "Pases Recibidos Prog.",

    // Per 90
    goals_per90: "Goles/90",
    assists_per90: "Asist./90",
    goals_assists_per90: "G+A/90",
    goals_pens_per90: "Goles (sin pen.)/90",
    goals_assists_pens_per90: "G+A (sin pen.)/90",
    xg_per90: "xG/90",
    xg_assist_per90: "xAG/90",
    xg_xg_assist_per90: "xG+xAG/90",
    npxg_per90: "npxG/90",
    npxg_xg_assist_per90: "npxG+xAG/90",

    // Shooting
    shots: "Tiros",
    shots_on_target: "Tiros a Puerta",
    shots_on_target_pct: "% Tiros a Puerta",
    goals_per_shot: "Goles/Tiro",
    goals_per_shot_on_target: "Goles/Tiro a Puerta",
    average_shot_distance: "Distancia Media",
    shots_free_kicks: "Tiros Libre",

    // Passing
    passes_completed: "Pases Completados",
    passes: "Pases Intentados",
    passes_pct: "% Pases",
    passes_total_distance: "Distancia Total",
    passes_progressive_distance: "Distancia Prog.",
    passes_completed_short: "Pases Cortos (C)",
    passes_short: "Pases Cortos (I)",
    passes_pct_short: "% Cortos",
    passes_completed_medium: "Pases Medios (C)",
    passes_medium: "Pases Medios (I)",
    passes_pct_medium: "% Medios",
    passes_completed_long: "Pases Largos (C)",
    passes_long: "Pases Largos (I)",
    passes_pct_long: "% Largos",
    assist: "Asistencias",
    xag: "xAG",
    xa: "xA",
    key_passes: "Pases Clave",
    passes_into_final_third: "Pases 1/3",
    passes_into_penalty_area: "Pases Área",
    crosses_into_penalty_area: "Centros Área",

    // Defense
    tackles: "Entradas",
    tackles_won: "Entradas Ganadas",
    tackles_def_3rd: "Entradas Def 1/3",
    tackles_mid_3rd: "Entradas Med 1/3",
    tackles_att_3rd: "Entradas Ata 1/3",
    dribble_tackles: "Regates Parados",
    dribble_vs: "Regates vs",
    dribble_tackles_pct: "% Regates Parados",
    dribbled_past: "Regateada", // Dribbled past
    blocks: "Bloqueos",
    blocked_shots: "Tiros Bloq.",
    blocked_passes: "Pases Bloq.",
    interceptions: "Intercepciones",
    tackles_interceptions: "Entradas + Int.",
    clearances: "Despejes",
    errors: "Errores (Goles)",

    // Possession
    touches: "Toques",
    touches_def_pen_area: "Toques Área Def",
    touches_def_3rd: "Toques Def 1/3",
    touches_mid_3rd: "Toques Med 1/3",
    touches_att_3rd: "Toques Ata 1/3",
    touches_att_pen_area: "Toques Área Ata",
    touches_live_ball: "Toques Juego",
    dribbles_completed: "Regates (C)",
    dribbles: "Regates (I)",
    dribbles_pct: "% Regates",
    miscontrols: "Malos Controles",
    dispossessed: "Desposeída",
    passes_received: "Pases Recibidos",

    // Goalkeeping

    // Misc
    fouls: "Faltas Com.",
    fouled: "Faltas Rec.",
    offsides: "Fueras de Juego",
    crosses: "Centros",
    own_goals: "Autogoles",
    ball_recoveries: "Recuperaciones",
    aerials_won: "Duelos Aéreos (G)",
    aerials_lost: "Duelos Aéreos (P)",
    aerials_won_pct: "% Aéreos",
};

export const COMPETITION_NAMES: Record<string, string> = {
    "230": "Liga F",
    "181": "UWCL",
    "106": "Mundial Femenino",
    "103": "Eurocopa Femenina",
    // Add more as discovered
};

export const TABLE_NAMES: Record<string, string> = {
    "standard": "Resumen",
    "shooting": "Disparos",
    "passing": "Pases",
    "passing_types": "Tipos de Pase",
    "gca": "Creación de Goles",
    "defense": "Defensa",
    "possession": "Posesión",
    "playing_time": "Tiempo de Juego",
    "misc": "Varios",
    "keeper": "Portería",
    "keeper_adv": "Portería Avanzada",
};

export function getCompetitionId(tableKey: string): string {
    // Format is usually stats_TYPE_COMPETITION
    // e.g. stats_standard_230
    const parts = tableKey.split('_');
    const compId = parts[parts.length - 1]; // Last part
    return compId;
}

export function getTableType(tableKey: string): string {
    // Format is usually stats_TYPE_COMPETITION
    // e.g. stats_standard_230 -> standard
    // e.g. stats_keeper_adv_230 -> keeper_adv
    const parts = tableKey.split('_');
    // Remove "stats" (first) and the comp ID (last)
    if (parts.length < 3) return tableKey;
    return parts.slice(1, parts.length - 1).join('_');
}
