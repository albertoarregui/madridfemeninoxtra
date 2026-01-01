import type { APIRoute } from "astro";
import { createClient } from "@libsql/client";

/**
 * API endpoint to calculate points for predictions of a completed match
 * POST /api/calculate-points
 * Body: { match_calendar_id: string }  // The ID from CALENDAR (e.g., "real-madrid-vs-sevilla")
 */

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { match_calendar_id, partido_id } = body;

        if (!match_calendar_id || !partido_id) {
            return new Response(JSON.stringify({
                error: "Missing required fields: match_calendar_id and partido_id"
            }), { status: 400 });
        }

        // 1. Connect to MAIN database (has actual match results)
        const mainDbUrl = import.meta.env.TURSO_DATABASE_URL;
        const mainDbToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!mainDbUrl || !mainDbToken) {
            return new Response(JSON.stringify({ error: "Main DB credentials missing" }), { status: 500 });
        }

        const mainDb = createClient({ url: mainDbUrl, authToken: mainDbToken });

        // 2. Connect to PREDICTIONS database
        const predsDbUrl = import.meta.env.TURSO_DATABASE_URL_2;
        const predsDbToken = import.meta.env.TURSO_AUTH_TOKEN_2;

        if (!predsDbUrl || !predsDbToken) {
            return new Response(JSON.stringify({ error: "Predictions DB credentials missing" }), { status: 500 });
        }

        const predsDb = createClient({ url: predsDbUrl, authToken: predsDbToken });

        // 3. Get actual match result from main DB using partido_id
        const matchQuery = `
            SELECT
                p.id_partido,
                p.goles_rm,
                p.goles_rival,
                p.fecha
            FROM partidos p
            WHERE p.id_partido = ?
        `;

        const matchResult = await mainDb.execute({
            sql: matchQuery,
            args: [partido_id]
        });

        if (matchResult.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Match not found" }), { status: 404 });
        }

        const actualMatch = matchResult.rows[0];
        const actualHomeScore = Number(actualMatch.goles_rm);
        const actualAwayScore = Number(actualMatch.goles_rival);

        if (actualHomeScore === null || actualAwayScore === null) {
            return new Response(JSON.stringify({ error: "Match result not available yet" }), { status: 400 });
        }

        // 4. Get actual scorers for this match
        const scorersQuery = `
            SELECT DISTINCT id_jugadora
            FROM goles_y_asistencias
            WHERE id_partido = ? AND tipo = 'gol'
        `;

        const scorersResult = await mainDb.execute({
            sql: scorersQuery,
            args: [partido_id]
        });

        const actualScorers = scorersResult.rows.map(row => String(row.id_jugadora));

        // 5. Get all predictions for this match from predictions DB
        const predictionsResult = await predsDb.execute({
            sql: "SELECT id, user_id, home_score, away_score, scorers FROM predictions WHERE match_id = ?",
            args: [match_calendar_id],
        });

        if (predictionsResult.rows.length === 0) {
            return new Response(JSON.stringify({
                message: "No predictions found for this match",
                processed: 0
            }), { status: 200 });
        }

        // 6. Calculate points for each prediction
        let processed = 0;
        const results = [];

        for (const pred of predictionsResult.rows) {
            const predHomeScore = Number(pred.home_score);
            const predAwayScore = Number(pred.away_score);
            let predScorers: string[] = [];

            try {
                if (pred.scorers && typeof pred.scorers === 'string') {
                    predScorers = JSON.parse(pred.scorers);
                } else if (Array.isArray(pred.scorers)) {
                    predScorers = pred.scorers;
                }
            } catch (e) {
                predScorers = [];
            }

            let points = 0;

            // Rule 1: Exact score (3 points)
            const exactScore = (predHomeScore === actualHomeScore && predAwayScore === actualAwayScore);
            if (exactScore) {
                points += 3;
            }
            // Rule 2: Correct outcome (winner/draw) - only if NOT exact score (1 point)
            else {
                const predOutcome = getOutcome(predHomeScore, predAwayScore);
                const actualOutcome = getOutcome(actualHomeScore, actualAwayScore);

                if (predOutcome === actualOutcome) {
                    points += 1;
                }
            }

            // Rule 3: Correct scorers (1 point per correct scorer)
            for (const scorerId of predScorers) {
                if (actualScorers.includes(scorerId)) {
                    points += 1;
                }
            }

            // 7. Update points_earned in predictions table
            await predsDb.execute({
                sql: "UPDATE predictions SET points_earned = ? WHERE id = ?",
                args: [points, pred.id],
            });

            processed++;
            results.push({
                user_id: pred.user_id,
                points_earned: points,
                exact_score: exactScore,
                correct_scorers: predScorers.filter(id => actualScorers.includes(id)).length
            });
        }

        return new Response(JSON.stringify({
            success: true,
            match_id: match_calendar_id,
            actual_result: `${actualHomeScore}-${actualAwayScore}`,
            actual_scorers: actualScorers,
            predictions_processed: processed,
            results: results
        }), { status: 200 });

    } catch (e) {
        console.error("Error calculating points:", e);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: String(e) }), { status: 500 });
    }
};

function getOutcome(homeScore: number, awayScore: number): 'home_win' | 'away_win' | 'draw' {
    if (homeScore > awayScore) return 'home_win';
    if (homeScore < awayScore) return 'away_win';
    return 'draw';
}
