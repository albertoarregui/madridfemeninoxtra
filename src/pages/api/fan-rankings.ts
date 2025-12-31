import type { APIRoute } from "astro";
import { getFanRankings } from "../../lib/fanRankings";

export const GET: APIRoute = async () => {
    const rankings = await getFanRankings();
    return new Response(JSON.stringify(rankings), { status: 200 });
};
