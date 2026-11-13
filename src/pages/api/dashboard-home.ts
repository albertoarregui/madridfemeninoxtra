import type { APIRoute } from "astro";
import { jsonResponse, jsonError } from "../../lib/api-cache";
import { cacheTags } from "../../lib/cache-tags";
import { buildDashboardPayload } from "../../lib/dashboard-payload";
import { fetchAllGoals, fetchGamesDirectly } from "../../utils/partidos";

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        const [games, goals] = await Promise.all([fetchGamesDirectly(), fetchAllGoals()]);
        return jsonResponse(buildDashboardPayload(games, goals), {
            sMaxage: 86400,
            swr: 604800,
            tags: [cacheTags.homepage, cacheTags.matches, cacheTags.goals, cacheTags.statistics],
        });
    } catch (error) {
        console.error("[dashboard-home]", error);
        return jsonError("No se pudieron cargar las estadísticas");
    }
};
