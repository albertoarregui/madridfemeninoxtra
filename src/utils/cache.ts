import { dangerouslyDeleteByTag, getCache } from '@vercel/functions';

type Entrada<T> = {
    at: number;
    data?: T;
    enCurso?: Promise<T>;
    tags: string[];
};

type CacheOptions = { tags?: string[] };

const almacen = new Map<string, Entrada<any>>();

export const TTL = {
    corto: 2 * 60 * 1000,
    medio: 10 * 60 * 1000,
    largo: 60 * 60 * 1000,
} as const;

export async function cached<T>(clave: string, ttlMs: number, fn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const ahora = Date.now();
    const tags = [...new Set(options.tags ?? [])];
    const hit = almacen.get(clave) as Entrada<T> | undefined;

    if (hit?.data !== undefined && ahora - hit.at < ttlMs) {
        return hit.data;
    }
    if (hit?.enCurso) return hit.enCurso;

    try {
        const remoto = await getCache({ namespace: 'mfx-data-v1' }).get(clave);
        if (remoto !== null) {
            const data = remoto as T;
            almacen.set(clave, { at: ahora, data, tags });
            return data;
        }
    } catch (error) {
        if (import.meta.env?.PROD) console.error('[CACHE] Error leyendo Runtime Cache:', error);
    }

    const enCurso = fn()
        .then(async (data) => {
            almacen.set(clave, { at: Date.now(), data, tags });
            try {
                await getCache({ namespace: 'mfx-data-v1' }).set(clave, data, {
                    ttl: Math.max(1, Math.ceil(ttlMs / 1000)), tags, name: clave,
                });
            } catch (error) {
                if (import.meta.env?.PROD) console.error('[CACHE] Error escribiendo Runtime Cache:', error);
            }
            return data;
        })
        .catch((err) => {
            almacen.delete(clave);
            throw err;
        });

    almacen.set(clave, { at: hit?.at ?? 0, data: hit?.data, enCurso, tags });
    return enCurso;
}

export function cachear<T>(clave: string, ttlMs: number, fn: () => Promise<T>, options: CacheOptions = {}): () => Promise<T> {
    return () => cached(clave, ttlMs, fn, options);
}

/** Invocar solamente después de que Turso confirme la escritura. */
export async function invalidarTags(tags: string[]): Promise<void> {
    const unicas = [...new Set(tags.filter(Boolean))];
    if (unicas.length === 0) return;

    for (const [clave, entrada] of almacen) {
        if (entrada.tags.some((tag) => unicas.includes(tag))) almacen.delete(clave);
    }

    // Deadline 0 fuerza que la siguiente lectura repueble la CDN en foreground.
    await Promise.all([
        getCache({ namespace: 'mfx-data-v1' }).expireTag(unicas),
        dangerouslyDeleteByTag(unicas, { revalidationDeadlineSeconds: 0 }),
    ]);

    // Las APIs de purga confirman la recepción antes de que el cambio termine
    // de propagarse globalmente (normalmente <300 ms). En escrituras esperamos
    // esa ventana para garantizar read-after-write al devolver la respuesta.
    if (process.env.VERCEL) {
        await new Promise((resolve) => setTimeout(resolve, 400));
    }
}

export function invalidarCache(clave?: string) {
    if (clave) almacen.delete(clave);
    else almacen.clear();
}
