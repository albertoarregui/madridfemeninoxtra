import type { AwardData } from "./awards";

/**
 * Filter awards data for a specific player
 */
export function getPlayerAwards(
    awardsData: AwardData[],
    playerId: number | string
): AwardData[] {
    return awardsData
        .filter((award) => String(award.id_jugadora) === String(playerId))
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
        monthly: awards.filter((award) => award.tipo === "MVP_MES"),
        seasonal: awards.filter((award) => award.tipo === "MVP_TEMPORADA"),
    };
}

/**
 * Format award date for display
 */
export function formatAwardDate(dateString: string | Date): string {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return String(dateString);

        const formatted = date.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
        }).replace(/ de /g, " "); // Remove "de" separator

        // Return capitalized: "Octubre 2024"
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
        return String(dateString);
    }
}
