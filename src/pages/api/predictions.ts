import type { APIRoute } from "astro";
import { dbUser } from "../../lib/turso";

export const POST: APIRoute = async ({ request, locals }) => {
    const { userId } = locals.auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { match_id, home_score, away_score, scorers } = body;

        // Validation
        if (!match_id || isNaN(home_score) || isNaN(away_score)) {
            return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400 });
        }

        // Scorers should be an array of strings (player IDs) or null
        const scorersJson = Array.isArray(scorers) ? JSON.stringify(scorers) : null;

        // Check if prediction exists
        const existing = await dbUser.execute({
            sql: "SELECT id FROM predictions WHERE user_id = ? AND match_id = ?",
            args: [userId, match_id],
        });

        if (existing.rows.length > 0) {
            // Update
            await dbUser.execute({
                sql: "UPDATE predictions SET home_score = ?, away_score = ?, scorers = ? WHERE user_id = ? AND match_id = ?",
                args: [home_score, away_score, scorersJson, userId, match_id],
            });
        } else {
            // Insert
            await dbUser.execute({
                sql: "INSERT INTO predictions (user_id, match_id, home_score, away_score, scorers) VALUES (?, ?, ?, ?, ?)",
                args: [userId, match_id, home_score, away_score, scorersJson],
            });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e) {
        console.error("Error saving prediction:", e);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};

export const GET: APIRoute = async ({ request, locals }) => {
    const { userId } = locals.auth();
    if (!userId) {
        return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
    }

    const url = new URL(request.url);
    const matchId = url.searchParams.get("match_id");

    if (!matchId) {
        return new Response(JSON.stringify({ error: "Missing match_id" }), { status: 400 });
    }

    try {
        const result = await dbUser.execute({
            sql: "SELECT home_score, away_score, scorers FROM predictions WHERE user_id = ? AND match_id = ?",
            args: [userId, matchId],
        });

        if (result.rows.length > 0) {
            return new Response(JSON.stringify({
                prediction: result.rows[0],
                authenticated: true
            }), { status: 200 });
        }

        return new Response(JSON.stringify({ prediction: null, authenticated: true }), { status: 200 });

    } catch (e) {
        console.error("Error fetching prediction:", e);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};
