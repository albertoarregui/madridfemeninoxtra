import type { AwardData } from "./awards";

export function getPlayerAwards(
    awardsData: AwardData[],
    playerId: number | string
): AwardData[] {
    return awardsData
        .filter((award) => String(award.id_jugadora) === String(playerId))
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export function groupAwardsByType(awards: AwardData[]): {
    monthly: AwardData[];
    seasonal: AwardData[];
} {
    return {
        monthly: awards.filter((award) => award.tipo === "MVP_MES"),
        seasonal: awards.filter((award) => award.tipo === "MVP_TEMPORADA"),
    };
}

export function formatAwardDate(dateString: string | Date): string {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return String(dateString);

        const formatted = date.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
        }).replace(/ de /g, " ");

        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
        return String(dateString);
    }
}
