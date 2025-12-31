import type { APIRoute } from "astro";
import { dbUser } from "../../lib/turso";

export const POST: APIRoute = async ({ request, locals }) => {
    const { userId } = locals.auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { match_id, ratings, mvp_player_id } = body; // ratings: [{ player_id, rating }]

        if (!match_id) {
            return new Response(JSON.stringify({ error: "Missing match_id" }), { status: 400 });
        }

        // Check if already voted (MVP vote implies participation in this context, or check ratings)
        // We allow updating votes? The user requirement implies "participation", usually one-off. 
        // But for better UX, let's allow updating if it's the same user.

        // Use a transaction if possible, or sequential writes. Turso client `transaction` might be limited in HTTP mode if not using strict transaction object.
        // We'll do sequential writes for simplicity as concurrency per user is low.

        // 1. Save MVP
        if (mvp_player_id) {
            const currentMVP = await dbUser.execute({
                sql: "SELECT id FROM mvp_votes WHERE user_id = ? AND match_id = ?",
                args: [userId, match_id],
            });

            if (currentMVP.rows.length > 0) {
                await dbUser.execute({
                    sql: "UPDATE mvp_votes SET player_id = ? WHERE user_id = ? AND match_id = ?",
                    args: [mvp_player_id, userId, match_id],
                });
            } else {
                await dbUser.execute({
                    sql: "INSERT INTO mvp_votes (user_id, match_id, player_id) VALUES (?, ?, ?)",
                    args: [userId, match_id, mvp_player_id],
                });
            }
        }

        // 2. Save Ratings
        if (Array.isArray(ratings)) {
            for (const r of ratings) {
                const { player_id, rating } = r;
                const currentRatings = await dbUser.execute({
                    sql: "SELECT id FROM ratings WHERE user_id = ? AND match_id = ? AND player_id = ?",
                    args: [userId, match_id, player_id],
                });

                if (currentRatings.rows.length > 0) {
                    await dbUser.execute({
                        sql: "UPDATE ratings SET rating = ? WHERE user_id = ? AND match_id = ? AND player_id = ?",
                        args: [rating, userId, match_id, player_id],
                    });
                } else {
                    await turso.execute({
                        sql: "INSERT INTO ratings (user_id, match_id, player_id, rating) VALUES (?, ?, ?, ?)",
                        args: [userId, match_id, player_id, rating],
                    });
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e) {
        console.error("Error saving ratings:", e);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};
