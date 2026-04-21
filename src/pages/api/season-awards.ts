import type { APIRoute } from 'astro';
import { getSeasonAwardsDbClient } from '../../db/client';

const HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
};

export const OPTIONS: APIRoute = () =>
    new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });

export const POST: APIRoute = async ({ request, locals }) => {
    const client = await getSeasonAwardsDbClient();
    if (!client) {
        return new Response(JSON.stringify({ error: 'No se pudo conectar a la base de datos.' }), { status: 500, headers: HEADERS });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Payload inválido.' }), { status: 400, headers: HEADERS });
    }

    const { votes = {}, xi = {} } = body;

    const clerkUser = typeof locals?.currentUser === 'function' ? await locals.currentUser() : null;
    const userId = clerkUser?.id;

    if (!userId) {
        return new Response(JSON.stringify({ error: 'Debes iniciar sesión para votar.' }), { status: 401, headers: HEADERS });
    }

    const rows: { category_id: string; candidate_id: string }[] = [];

    const SUFFIX = '-2526';

    const awardMap: Record<string, string> = {
        'mejor-jugadora':  'mejor-jugadora'  + SUFFIX,
        'mejor-fichaje':   'mejor-fichaje'   + SUFFIX,
        'mejor-sub21':     'mejor-sub21'     + SUFFIX,
        'mejor-gol':       'mejor-gol'       + SUFFIX,
    };
    for (const [key, categoryId] of Object.entries(awardMap)) {
        const val = votes[key];
        if (val) rows.push({ category_id: categoryId, candidate_id: String(val) });
    }

    const xiPositions: Record<string, any[]> = {
        portera:        xi.portera        ?? [],
        defensa:        xi.defensa        ?? [],
        centrocampista: xi.centrocampista ?? [],
        delantera:      xi.delantera      ?? [],
    };
    for (const [pos, ids] of Object.entries(xiPositions)) {
        (ids as string[]).forEach((id, idx) => {
            if (id) rows.push({ category_id: `xi-${pos}-${idx}${SUFFIX}`, candidate_id: String(id) });
        });
    }

    if (rows.length === 0) {
        return new Response(JSON.stringify({ error: 'No hay votos que guardar.' }), { status: 400, headers: HEADERS });
    }

    try {
        const stmts = rows.map(({ category_id, candidate_id }) => ({
            sql: `INSERT OR REPLACE INTO votes (user_id, category_id, candidate_id)
                  VALUES (?, ?, ?)`,
            args: [userId, category_id, candidate_id],
        }));

        await client.batch(stmts, 'write');

        return new Response(JSON.stringify({ ok: true }), { status: 201, headers: HEADERS });
    } catch (err: any) {
        console.error('[season-awards] Error al insertar voto:', err);
        return new Response(JSON.stringify({ error: 'Error al guardar el voto.' }), { status: 500, headers: HEADERS });
    }
};
