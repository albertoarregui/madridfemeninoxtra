import type { APIRoute } from "astro";
import { getCache } from "@vercel/functions";
import { invalidarTags } from "../../../utils/cache";
import { isCachedTable, tagsForTables, type CachedTable } from "../../../lib/db-cache-tags";

export const prerender = false;

// Comprobación de cambios en Turso para que lo que se carga a mano se vea al
// instante. Los triggers de cada tabla suben su versión en `cache_cambios`;
// aquí se compara con la última versión vista y se invalidan solo las tablas
// que han cambiado. La CDN guarda la respuesta 30 s: como mucho una ejecución
// cada 30 s, sea cual sea el tráfico. Solo escribe en Runtime Cache cuando hay
// cambios de verdad.
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
        // Lectura directa (sin caché de datos ni escrituras en Runtime Cache).
        const { getPlayersDbClient } = await import("../../../db/client");
        const client = await getPlayersDbClient({ forceRefresh: true });
        if (!client) return json({ activo: false });
        let rows: any[];
        try {
            rows = (await client.execute("SELECT tabla, version FROM cache_cambios")).rows as any[];
        } catch {
            return json({ activo: false }); // Aún no se han creado los triggers.
        }
        const current: Record<string, number> = Object.fromEntries(rows.map((r) => [String(r.tabla), Number(r.version)]));

        const store = getCache({ namespace: "mfx-data-v4" });
        const previous = (await store.get(STATE_KEY)) as Record<string, number> | null;
        const changed = previous
            ? Object.keys(current).filter((t) => current[t] !== previous[t] && isCachedTable(t)) as CachedTable[]
            : [];
        if (!previous || changed.length > 0) {
            // Se guarda primero para que otra ejecución simultánea no repita la purga.
            await store.set(STATE_KEY, current, { ttl: 365 * 24 * 60 * 60 });
            if (changed.length > 0) await invalidarTags(tagsForTables(changed));
        }
        return json({ activo: true, cambios: changed });
    } catch (error) {
        console.error("[cache/check]", error);
        return json({ activo: false });
    }
};
