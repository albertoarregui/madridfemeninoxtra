import type { APIRoute } from "astro";
import { turso } from "../../lib/turso";

export const POST: APIRoute = async ({ request, locals }) => {
    // 1. Authenticate
    const { userId } = await locals.auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Parse Body
    const body = await request.json();
    const { votes } = body; // Expects array of { categoryId, candidateId }

    if (!votes || !Array.isArray(votes)) {
        return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400 });
    }

    // 3. Process Votes (Batch or usage of transaction)
    // Turso supports multiple statements or we can loop.
    // For simplicity, we'll loop (or construct a transaction).

    try {
        const transaction = await turso.transaction("write");

        for (const vote of votes) {
            const { categoryId, candidateId } = vote;
            if (!categoryId || !candidateId) continue;

            // Upsert Logic
            await transaction.execute({
                sql: `
                    INSERT INTO votes (user_id, category_id, candidate_id)
                    VALUES (?, ?, ?)
                    ON CONFLICT(user_id, category_id) 
                    DO UPDATE SET candidate_id = excluded.candidate_id, created_at = CURRENT_TIMESTAMP
                `,
                args: [userId, categoryId, candidateId.toString()]
            });
        }

        await transaction.commit();

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e) {
        console.error("Error submitting votes:", e);
        return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
    }
};
