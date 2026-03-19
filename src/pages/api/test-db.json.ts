import { getPlayersDbClient } from "../../db/client";

export async function GET() {
    const db = await getPlayersDbClient();
    try {
        const res = await db.execute("SELECT * FROM tarjetas_rival LIMIT 5");
        return new Response(JSON.stringify(res.rows), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}


