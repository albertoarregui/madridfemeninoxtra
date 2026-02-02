import type { AwardData } from "./awards";

/**
 * Filter awards data for a specific player
 */
export function getPlayerAwards(
    awardsData: AwardData[],
    playerId: number
): AwardData[] {
    return awardsData
        .filter((award) => award.id_jugadora === playerId)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

/**
 * Group awards by type for display
 */
export function groupAwardsByType(awards: AwardData[]): {
    monthly: AwardData[];
    seasonal: AwardData[];
} {
    return {
        monthly: awards.filter((award) => award.tipo === "mes"),
        seasonal: awards.filter((award) => award.tipo === "temporada"),
    };
}

/**
 * Format award date for display
 */
export function formatAwardDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
}
