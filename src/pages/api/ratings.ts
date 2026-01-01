import type { APIRoute } from "astro";
import { turso } from "../../lib/turso";

export const POST: APIRoute = async ({ request, locals }) => {
    const { userId } = locals.auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { match_id, mvp_player_id } = body;

        if (!match_id) {
            return new Response(JSON.stringify({ error: "Missing match_id" }), { status: 400 });
        }

        if (mvp_player_id) {
            const existingMVP = await turso.execute({
                sql: "SELECT id FROM mvp_votes WHERE user_id = ? AND match_id = ?",
                args: [userId, match_id],
            });

            if (existingMVP.rows.length > 0) {
                await turso.execute({
                    sql: "UPDATE mvp_votes SET player_id = ? WHERE user_id = ? AND match_id = ?",
                    args: [mvp_player_id, userId, match_id],
                });
            } else {
                await turso.execute({
                    sql: "INSERT INTO mvp_votes (user_id, match_id, player_id) VALUES (?, ?, ?)",
                    args: [userId, match_id, mvp_player_id],
                });
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e) {
        console.error("Error saving MVP vote:", e);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};
