import type { APIRoute } from "astro";
import { getCache } from "@vercel/functions";
import { invalidarTags } from "../../../utils/cache";
import { isCachedTable, tagsForTables, type CachedTable } from "../../../lib/db-cache-tags";

export const prerender = false;

const STATE_KEY = "cache:cambios:v1";
const CDN_SECONDS = 30;

const json = (data: unknown) =>
    new Response(JSON.stringify(data), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "CDN-Cache-Control": `max-age=${CDN_SECONDS}`,
            "Vercel-CDN-Cache-Control": `max-age=${CDN_SECONDS}`,
        },
    });

export const GET: APIRoute = async () => {
    try {
        const { getPlayersDbClient } = await import("../../../db/client");
        const client = await getPlayersDbClient({ forceRefresh: true });
        if (!client) return json({ activo: false });
        let rows: any[];
        try {
            rows = (await client.execute("SELECT tabla, version FROM cache_cambios")).rows as any[];
        } catch {
            return json({ activo: false });
        }
        const current: Record<string, number> = Object.fromEntries(rows.map((r) => [String(r.tabla), Number(r.version)]));

        const store = getCache({ namespace: "mfx-data-v4" });
        const previous = (await store.get(STATE_KEY)) as Record<string, number> | null;
        const changed = previous
            ? Object.keys(current).filter((t) => current[t] !== previous[t] && isCachedTable(t)) as CachedTable[]
            : [];
        if (!previous || changed.length > 0) {
            await store.set(STATE_KEY, current, { ttl: 365 * 24 * 60 * 60 });
            if (changed.length > 0) await invalidarTags(tagsForTables(changed));
        }
        return json({ activo: true, cambios: changed });
    } catch (error) {
        console.error("[cache/check]", error);
        return json({ activo: false });
    }
};
