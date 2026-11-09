type Entrada<T> = {
    at: number;
    data?: T;
    enCurso?: Promise<T>;
    tags: string[];
};

type CacheOptions = {
    tags?: string[];
    /** Usa la caché distribuida solo para datos de origen, no para duplicados. */
    remote?: boolean;
    /** Evita datos obsoletos entre instancias después de una revalidación. */
    memoryTtlMs?: number;
    /** Omite la lectura de caché, consulta el origen y reemplaza la misma entrada. */
    forceRefresh?: boolean;
};

const almacen = new Map<string, Entrada<any>>();
const tagVersions = new Map<string, number>();
const keyVersions = new Map<string, number>();
// Se cambia solo cuando el formato o las reglas de invalidación dejan
// incompatibles las entradas existentes.
const RUNTIME_CACHE_NAMESPACE = 'mfx-data-v4';

type EdgeCache = {
    match(request: RequestInfo | URL): Promise<Response | undefined>;
    put(request: RequestInfo | URL, response: Response): Promise<void>;
    delete(request: RequestInfo | URL): Promise<boolean>;
};

function edgeCache(): EdgeCache | null {
    const storage = (globalThis as typeof globalThis & { caches?: { default?: EdgeCache } }).caches;
    return storage?.default ?? null;
}

async function remoteKey(clave: string): Promise<string> {
    const input = new TextEncoder().encode(`${RUNTIME_CACHE_NAMESPACE}:${clave}`);
    const digest = await crypto.subtle.digest('SHA-256', input);
    const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `https://cache.madridfemeninoxtra.com/data/${hash}`;
}

function serialize(data: unknown): string {
    return JSON.stringify(data, (_key, value) => typeof value === 'bigint'
        ? { __mfxType: 'bigint', value: value.toString() }
        : value);
}

function deserialize<T>(value: string): T {
    return JSON.parse(value, (_key, item) => item && item.__mfxType === 'bigint'
        ? BigInt(item.value)
        : item) as T;
}

export const TTL = {
    corto: 2 * 60 * 1000,
    medio: 10 * 60 * 1000,
    largo: 60 * 60 * 1000,
} as const;

export async function cached<T>(clave: string, ttlMs: number, fn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const ahora = Date.now();
    const tags = [...new Set(options.tags ?? [])];
    const remote = options.remote ?? true;
    const forceRefresh = options.forceRefresh ?? false;
    // Evita una consulta a la caché distribuida por cada visita a la misma función caliente.
    // Las invalidaciones por tags siguen limpiando esta caché de memoria.
    const memoryTtlMs = options.memoryTtlMs ?? (remote ? Math.min(ttlMs, 30_000) : ttlMs);
    const hit = almacen.get(clave) as Entrada<T> | undefined;

    if (!forceRefresh && memoryTtlMs > 0 && hit?.data !== undefined && ahora - hit.at < memoryTtlMs) {
        return hit.data;
    }
    if (!forceRefresh && hit?.enCurso) return hit.enCurso;

    if (forceRefresh) {
        keyVersions.set(clave, (keyVersions.get(clave) ?? 0) + 1);
    }

    // Se registra la carga antes de consultar la caché distribuida. Así también se
    // agrupan los fallos simultáneos de caché, no solo las consultas a Turso.
    const versions = new Map(tags.map((tag) => [tag, tagVersions.get(tag) ?? 0]));
    const keyVersion = keyVersions.get(clave) ?? 0;
    const sigueVigente = () =>
        (keyVersions.get(clave) ?? 0) === keyVersion &&
        tags.every((tag) => (tagVersions.get(tag) ?? 0) === versions.get(tag));
    // Las lecturas forzadas pertenecen a fichas recientes que el middleware
    // sirve con `no-store`. Si escribimos aquí, cada visita genera una escritura
    // de caché distribuida por consulta aunque la respuesta nunca se reutilice.
    const runtimeCache = remote && !forceRefresh ? edgeCache() : null;
    const runtimeKey = runtimeCache ? await remoteKey(clave) : null;

    let enCurso!: Promise<T>;
    enCurso = (async () => {
        if (runtimeCache && !forceRefresh) {
            try {
                const remoto = await runtimeCache.match(runtimeKey!);
                if (remoto && sigueVigente()) {
                    const data = deserialize<T>(await remoto.text());
                    if (almacen.get(clave)?.enCurso === enCurso) {
                        almacen.set(clave, { at: Date.now(), data, tags });
                    }
                    return data;
                }
            } catch (error) {
                if (import.meta.env?.PROD) console.error('[CACHE] Error leyendo la caché distribuida:', error);
            }
        }

        // Si Turso o Contentful fallan temporalmente, conserva el último dato
        // conocido en memoria. No se aplica a lecturas forzadas ni invalidadas.
        let data: T;
        try {
            data = await fn();
        } catch (error) {
            if (!forceRefresh && sigueVigente() && hit?.data !== undefined) {
                console.error('[CACHE] Origen temporalmente no disponible; devolviendo dato anterior:', error);
                return hit.data;
            }
            throw error;
        }
        const vigente = sigueVigente();

        if (vigente && almacen.get(clave)?.enCurso === enCurso) {
            almacen.set(clave, { at: Date.now(), data, tags });
        }

        if (runtimeCache && vigente) {
            try {
                await runtimeCache.put(runtimeKey!, new Response(serialize(data), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': `public, max-age=${Math.max(1, Math.ceil(ttlMs / 1000))}`,
                        ...(tags.length > 0 ? { 'Cache-Tag': tags.join(',') } : {}),
                    },
                }));
                // Si se invalidó mientras se escribía, evita que la lectura
                // anterior reaparezca en la caché después de la purga.
                if (!sigueVigente()) await runtimeCache.delete(runtimeKey!);
            } catch (error) {
                if (import.meta.env?.PROD) console.error('[CACHE] Error escribiendo la caché distribuida:', error);
            }
        }

        if (!sigueVigente() && almacen.get(clave)?.enCurso === enCurso) {
            almacen.delete(clave);
        }

        return data;
    })().catch((err) => {
        if (almacen.get(clave)?.enCurso === enCurso) {
            almacen.delete(clave);
        }
        throw err;
    });

    almacen.set(clave, { at: hit?.at ?? 0, data: hit?.data, enCurso, tags });
    return enCurso;
}

export function cachear<T>(clave: string, ttlMs: number, fn: () => Promise<T>, options: CacheOptions = {}): () => Promise<T> {
    // Las consultas internas ya tienen su propia caché remota. Guardar también
    // el agregado duplicaba escrituras cada pocos minutos.
    return () => cached(clave, ttlMs, fn, { ...options, remote: false, memoryTtlMs: 0 });
}

/** Invocar solamente después de que Turso confirme la escritura. */
export async function invalidarTags(tags: string[]): Promise<void> {
    const unicas = [...new Set(tags.filter(Boolean))];
    if (unicas.length === 0) return;

    // Invalida también las lecturas que siguen en curso para impedir que una
    // respuesta anterior vuelva a poblar la caché después de una escritura.
    unicas.forEach((tag) => tagVersions.set(tag, (tagVersions.get(tag) ?? 0) + 1));

    for (const [clave, entrada] of almacen) {
        if (entrada.tags.some((tag) => unicas.includes(tag))) almacen.delete(clave);
    }

    try {
        const { cache } = await import('cloudflare:workers');
        const result = await cache.purge({ tags: unicas });
        if (!result.success) throw new Error(result.errors.map((error) => error.message).join(', '));
    } catch (error) {
        // El módulo no existe durante las pruebas de Node. La memoria ya queda
        // invalidada; producción sí debe informar cualquier fallo real.
        if (import.meta.env?.PROD) {
            console.error('[CACHE] Error purgando etiquetas de Cloudflare:', error);
            throw error;
        }
    }
}

export function invalidarCache(clave?: string) {
    if (clave) almacen.delete(clave);
    else almacen.clear();
}
