const MATCH_KEYS = [
    "temporada_nombre", "competicion_nombre", "goles_rm", "goles_rival", "penaltis",
    "resultado", "asistencia", "capacidad", "estadio", "faltas_cometidas",
    "faltas_recibidas", "amarillas_rm", "amarillas_rival", "rojas_rm", "rojas_rival",
    "penaltis_rm", "penaltis_rival", "club_local", "club_visitante", "fecha",
] as const;

const GOAL_KEYS = [
    "id_gol", "minuto", "temporada", "competicion", "nombre_goleadora", "nombre_asistente",
] as const;

export type CompactDashboardRow = unknown[];

export function compactDashboardPayload(matches: any[], goals: any[]) {
    const playerImages: Record<string, string> = {};
    for (const goal of goals) {
        if (goal.nombre_goleadora && goal.foto_goleadora) playerImages[goal.nombre_goleadora] = goal.foto_goleadora;
        if (goal.nombre_asistente && goal.foto_asistente) playerImages[goal.nombre_asistente] = goal.foto_asistente;
    }

    return {
        matchRows: matches.map((match) => MATCH_KEYS.map((key) => match[key] ?? null)),
        goalRows: goals.map((goal) => GOAL_KEYS.map((key) => goal[key] ?? null)),
        playerImages,
    };
}

function expandRows(rows: CompactDashboardRow[], keys: readonly string[]): any[] {
    return rows.map((values) => Object.fromEntries(keys.map((key, index) => [key, values[index]])));
}

export function expandDashboardMatches(rows: CompactDashboardRow[]): any[] {
    return expandRows(rows, MATCH_KEYS);
}

export function expandDashboardGoals(rows: CompactDashboardRow[], playerImages: Record<string, string>): any[] {
    return expandRows(rows, GOAL_KEYS).map((goal) => ({
        ...goal,
        foto_goleadora: playerImages[goal.nombre_goleadora] || undefined,
        foto_asistente: playerImages[goal.nombre_asistente] || undefined,
    }));
}

const CAMPOS_PARTIDO_STATS = [
	"temporada_nombre",
	"competicion_nombre",
	"goles_rm",
	"goles_rival",
	"penaltis",
	"resultado",
	"asistencia",
	"capacidad",
	"estadio",
	"faltas_cometidas",
	"faltas_recibidas",
	"amarillas_rm",
	"amarillas_rival",
	"rojas_rm",
	"rojas_rival",
	"penaltis_rm",
	"penaltis_rival",
	"club_local",
	"club_visitante",
	"fecha",
] as const;

const CAMPOS_GOL_STATS = [
	"id_gol",
	"minuto",
	"temporada",
	"competicion",
	"nombre_goleadora",
	"foto_goleadora",
	"nombre_asistente",
	"foto_asistente",
] as const;

function proyectar<T extends Record<string, any>>(
	filas: T[],
	campos: readonly string[],
): T[] {
	return filas.map((fila) => {
		const salida: Record<string, any> = {};
		for (const campo of campos) {
			if (fila[campo] !== undefined) salida[campo] = fila[campo];
		}
		return salida as T;
	});
}

export function buildDashboardPayload(games: any[], goals: any[]) {
    return compactDashboardPayload(proyectar(games, CAMPOS_PARTIDO_STATS), proyectar(goals, CAMPOS_GOL_STATS));
}
