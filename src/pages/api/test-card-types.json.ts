import { getPlayersDbClient } from "./db/client";

export async function GET() {
    try {
        const db = await getPlayersDbClient();
        const types = await db.execute("SELECT DISTINCT tipo_tarjeta FROM tarjetas_rival");
        const rmTypes = await db.execute("SELECT DISTINCT tipo_tarjeta FROM tarjetas");
        return new Response(JSON.stringify({ rival: types.rows, rm: rmTypes.rows }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
