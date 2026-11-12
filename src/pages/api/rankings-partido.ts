import type { APIRoute } from "astro";
import { jsonResponse, jsonError } from "../../lib/api-cache";
import { fetchMatchRecords } from "../../utils/match-records";
import { cacheTags } from "../../lib/cache-tags";

export const prerender = false;

// «Más X en un solo partido». El CDN guarda cada combinación de filtros un día;
// los datos de origen salen de una caché diaria (una lectura de Turso).
export const GET: APIRoute = async ({ url }) => {
    const stat = url.searchParams.get("estadistica") || "goles";
    const competition = url.searchParams.get("competicion") || "todos";
    const season = url.searchParams.get("temporada") || "todos";
    try {
        const data = await fetchMatchRecords(stat, competition, season);
        return jsonResponse(data, { sMaxage: 86400, swr: 604800, tags: [cacheTags.rankings, cacheTags.statistics] });
    } catch (error) {
        console.error("[rankings-partido]", error);
        return jsonError("No se pudieron cargar los récords");
    }
};
