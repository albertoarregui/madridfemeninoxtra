import { fetchRivalMatches } from "../../utils/rival-records";

export async function GET() {
    try {
        const matches = await fetchRivalMatches(2);
        return new Response(JSON.stringify(matches), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}


