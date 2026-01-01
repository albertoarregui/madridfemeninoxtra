import { turso } from "./turso";
import { CALENDAR } from "../consts/calendar";

export async function getFanRankings() {
    try {
        const ratingsResult = await turso.execute("SELECT * FROM ratings");
        const mvpResult = await turso.execute("SELECT * FROM mvp_votes");

        const ratings = ratingsResult.rows as any[];
        const mvpVotes = mvpResult.rows as any[];

        const matchDates = new Map(CALENDAR.map(m => [m.id, new Date(m.date)]));

        const playerStats: Record<string, {
            totalRating: number,
            count: number,
            mvpVotes: number,
            ratingsByMatch: Record<string, { total: number, count: number }>
        }> = {};

        ratings.forEach(r => {
            if (!playerStats[r.player_id]) {
                playerStats[r.player_id] = { totalRating: 0, count: 0, mvpVotes: 0, ratingsByMatch: {} };
            }
            const p = playerStats[r.player_id];

            p.totalRating += r.rating;
            p.count++;

            if (!p.ratingsByMatch[r.match_id]) {
                p.ratingsByMatch[r.match_id] = { total: 0, count: 0 };
            }
            p.ratingsByMatch[r.match_id].total += r.rating;
            p.ratingsByMatch[r.match_id].count++;
        });

        mvpVotes.forEach(v => {
            if (!playerStats[v.player_id]) {
                playerStats[v.player_id] = { totalRating: 0, count: 0, mvpVotes: 0, ratingsByMatch: {} };
            }
            playerStats[v.player_id].mvpVotes++;
        });

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const seasonRankings = Object.entries(playerStats)
            .map(([id, stats]) => ({
                id,
                avg: stats.count > 0 ? stats.totalRating / stats.count : 0,
                mvp: stats.mvpVotes
            }))
            .filter(p => p.avg > 0)
            .sort((a, b) => b.avg - a.avg);

        const monthRankings = Object.entries(playerStats)
            .map(([id, stats]) => {
                let monthTotal = 0;
                let monthCount = 0;

                Object.entries(stats.ratingsByMatch).forEach(([matchId, matchStats]) => {
                    const date = matchDates.get(matchId);
                    // Simple current month check
                    if (date && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                        monthTotal += matchStats.total;
                        monthCount += matchStats.count;
                    }
                });

                return {
                    id,
                    avg: monthCount > 0 ? monthTotal / monthCount : 0
                };
            })
            .filter(p => p.avg > 0)
            .sort((a, b) => b.avg - a.avg);

        const matchesWithRatings = new Set(ratings.map(r => r.match_id));
        const playedMatches = CALENDAR
            .filter(m => matchesWithRatings.has(m.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const lastMatchId = playedMatches.length > 0 ? playedMatches[0].id : null;
        let matchRankings: any[] = [];

        if (lastMatchId) {
            matchRankings = Object.entries(playerStats)
                .map(([id, stats]) => {
                    const m = stats.ratingsByMatch[lastMatchId];
                    return {
                        id,
                        avg: m ? m.total / m.count : 0
                    };
                })
                .filter(p => p.avg > 0)
                .sort((a, b) => b.avg - a.avg);
        }

        const votesByMatch: Record<string, Record<string, number>> = {};
        mvpVotes.forEach(v => {
            if (!votesByMatch[v.match_id]) votesByMatch[v.match_id] = {};
            if (!votesByMatch[v.match_id][v.player_id]) votesByMatch[v.match_id][v.player_id] = 0;
            votesByMatch[v.match_id][v.player_id]++;
        });

        const mvpWins: Record<string, number> = {};

        CALENDAR.forEach(match => {
            const matchDate = new Date(match.date);
            const msSince = now.getTime() - matchDate.getTime();
            const hoursSince = msSince / (1000 * 60 * 60);

            if (hoursSince > 24) {
                const matchVotes = votesByMatch[match.id];
                if (matchVotes) {
                    let maxVotes = -1;
                    let winners: string[] = [];

                    Object.entries(matchVotes).forEach(([pid, count]) => {
                        if (count > maxVotes) {
                            maxVotes = count;
                            winners = [pid];
                        } else if (count === maxVotes) {
                            winners.push(pid); // Tie
                        }
                    })

                    winners.forEach(w => {
                        if (!mvpWins[w]) mvpWins[w] = 0;
                        mvpWins[w]++;
                    });
                }
            }
        });

        const mvpRankings = Object.entries(mvpWins)
            .map(([id, wins]) => ({
                id,
                count: wins
            }))
            .sort((a, b) => b.count - a.count);

        return {
            season: seasonRankings.slice(0, 5),
            month: monthRankings.slice(0, 5),
            match: matchRankings.slice(0, 5),
            mvp: mvpRankings.slice(0, 5)
        };

    } catch (error) {
        console.error("Error calculating rankings:", error);
        return { season: [], month: [], match: [], mvp: [] };
    }
}
