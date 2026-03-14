import { fetchRivalMatches } from "../../utils/rival-records";
import { fetchRivalsDirectly } from "../../utils/rivales";

export async function GET() {
    try {
        const rivals = await fetchRivalsDirectly();
        const results = await Promise.all(rivals.map(async r => {
            const matches = await fetchRivalMatches(r.id_club);
            return {
                rival: r.nombre,
                amarillas: matches.reduce((sum, m) => sum + (m.amarillas || 0), 0),
                rojas: matches.reduce((sum, m) => sum + (m.rojas || 0), 0)
            }
        }));
        return new Response(JSON.stringify(results), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
