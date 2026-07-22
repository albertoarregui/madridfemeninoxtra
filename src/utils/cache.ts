type Entrada<T> = {
    at: number;
    data?: T;
    enCurso?: Promise<T>;
};

const almacen = new Map<string, Entrada<any>>();

export const TTL = {
    corto: 2 * 60 * 1000,
    medio: 10 * 60 * 1000,
    largo: 60 * 60 * 1000,
} as const;

export function cached<T>(clave: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const ahora = Date.now();
    const hit = almacen.get(clave) as Entrada<T> | undefined;

    if (hit?.data !== undefined && ahora - hit.at < ttlMs) {
        return Promise.resolve(hit.data);
    }
    if (hit?.enCurso) return hit.enCurso;

    const enCurso = fn()
        .then((data) => {
            almacen.set(clave, { at: Date.now(), data });
            return data;
        })
        .catch((err) => {
            if (hit?.data !== undefined) {
                almacen.set(clave, { at: hit.at, data: hit.data });
                return hit.data;
            }
            almacen.delete(clave);
            throw err;
        });

    almacen.set(clave, { at: hit?.at ?? 0, data: hit?.data, enCurso });
    return enCurso;
}

export function cachear<T>(clave: string, ttlMs: number, fn: () => Promise<T>): () => Promise<T> {
    return () => cached(clave, ttlMs, fn);
}

export function invalidarCache(clave?: string) {
    if (clave) almacen.delete(clave);
    else almacen.clear();
}
