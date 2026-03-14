import { fetchRivalMatches } from "../../utils/rival-records";
import { fetchRivalsDirectly } from "../../utils/rivales";

export async function GET() {
    try {
        const rivals = await fetchRivalsDirectly();
        const fcBarcelona = rivals.find(r => r.nombre.includes('Barcelona'));
        const matches = await fetchRivalMatches(fcBarcelona.id_club);
        return new Response(JSON.stringify(matches.map(m => ({ id: m.id, rmY: m.amarillas_rm, rmR: m.rojas_rm, rivY: m.amarillas, rivR: m.rojas }))), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
