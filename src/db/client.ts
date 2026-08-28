import { createClient, type Client } from '@libsql/client';
import { cached, invalidarTags } from '../utils/cache';

const globalForDb = globalThis as unknown as {
    __awardsDb?: Client | null;
    __seasonAwardsDb?: Client | null;
    __playersDb?: Client | null;
    __analyticsDb?: Client | null;
};

// Una consulta solo vuelve a Turso una vez al mes, salvo revalidación por cambio.
const DB_READ_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MATCH_CACHE_VERSION = 'v2';

const TABLE_TAGS: Record<string, string[]> = {
    partidos: ['matches', 'calendar'],
    goles_y_asistencias: ['goals', 'statistics', 'rankings'],
    goles_propia: ['goals', 'statistics'],
    goles_rival: ['goals', 'matches', 'statistics'],
    alineaciones: ['lineups', 'statistics'],
    estadisticas_jugadoras: ['statistics', 'players', 'rankings'],
    estadisticas_partidos: ['statistics', 'matches'],
    jugadoras: ['players'],
    dorsales: ['players'],
    lesiones: ['players'],
    contratos: ['players'],
    trayectoria_jugadoras: ['players'],
    redes_sociales: ['players'],
    estadios: ['stadiums'],
    entrenadores: ['coaches', 'matches'],
    trayectoria_entrenadores: ['coaches'],
    clubes: ['rivals'],
    arbitras: ['referees', 'matches', 'statistics'],
    tarjetas: ['statistics', 'matches'],
    tarjetas_rival: ['statistics', 'matches'],
    cambios: ['lineups', 'statistics', 'players'],
    equipaciones: ['matches'],
    penaltis_fallados: ['goals', 'matches', 'statistics'],
    tanda_penaltis: ['goals', 'matches'],
    competiciones: ['matches', 'statistics'],
    temporadas: ['matches', 'statistics'],
    mvp: ['awards', 'players', 'homepage'],
};

function tagsForQuery(sql: string): string[] {
    const lower = sql.toLowerCase();
    const tags = new Set<string>();
    for (const [table, tableTags] of Object.entries(TABLE_TAGS)) {
        if (new RegExp(`\\b${table}\\b`, 'i').test(lower)) tableTags.forEach((tag) => tags.add(tag));
    }
    return [...tags];
}

function stableValue(value: unknown): unknown {
    if (typeof value === 'bigint') return `${value}n`;
    if (value instanceof ArrayBuffer) return Array.from(new Uint8Array(value));
    if (ArrayBuffer.isView(value)) return Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stableValue(item)]));
    }
    return value;
}

function withReadCache(client: Client, database: string): Client {
    return new Proxy(client, {
        get(target, property, receiver) {
            if (property === 'batch') {
                return async (statements: any[], mode?: any) => {
                    const results = await target.batch(statements, mode);
                    const changedTags = new Set<string>();
                    statements.forEach((statement, index) => {
                        const sql = typeof statement === 'string' ? statement : statement?.sql;
                        if (typeof sql === 'string' && !/^\s*(select|with|pragma)\b/i.test(sql) && results[index]?.rowsAffected > 0) {
                            tagsForQuery(sql).forEach((tag) => changedTags.add(tag));
                        }
                    });
                    await invalidarTags([...changedTags]);
                    return results;
                };
            }
            if (property !== 'execute') {
                const value = Reflect.get(target, property, receiver);
                return typeof value === 'function' ? value.bind(target) : value;
            }

            return async (statement: any) => {
                const sql = typeof statement === 'string' ? statement : statement?.sql;
                if (typeof sql !== 'string') return target.execute(statement);
                if (!/^\s*(select|with)\b/i.test(sql)) {
                    const result = await target.execute(statement);
                    if (result.rowsAffected > 0) await invalidarTags(tagsForQuery(sql));
                    return result;
                }

                const args = typeof statement === 'string' ? [] : (statement.args ?? statement.params ?? []);
                const normalizedSql = sql.replace(/\s+/g, ' ').trim();
                const tags = tagsForQuery(sql);
                const isMatchRead = tags.includes('matches');
                const cacheVersion = isMatchRead ? MATCH_CACHE_VERSION : 'v1';
                const key = `turso:${cacheVersion}:${database}:${normalizedSql}:${JSON.stringify(stableValue(args))}`;

                return cached(key, DB_READ_TTL_MS, async () => {
                    const result = await target.execute(statement);
                    return {
                        columns: [...result.columns],
                        columnTypes: [...result.columnTypes],
                        rows: result.rows.map((row) => Object.fromEntries([
                            ...result.columns.map((column, index) => [column, row[index]] as const),
                            ...result.columns.map((_, index) => [String(index), row[index]] as const),
                        ])),
                        rowsAffected: result.rowsAffected,
                        lastInsertRowid: result.lastInsertRowid,
                    } as any;
                }, { tags });
            };
        },
    });
}

const env = (key: string): string | undefined =>
    (import.meta.env?.[key] as string | undefined) ?? process.env[key];

function makeClient(
    cacheKey: keyof typeof globalForDb,
    urlKeys: string[],
    tokenKeys: string[],
    label: string,
    cacheReads = true,
): Client | null {
    const cached = globalForDb[cacheKey];
    if (cached) return cached;

    const url = urlKeys.map(env).find(Boolean);
    const authToken = tokenKeys.map(env).find(Boolean);

    if (!url || !authToken) {
        console.error(`[DB CLIENT] ${label}: Credenciales no configuradas`);
        return null;
    }

    try {
        const rawClient = createClient({ url, authToken });
        const databaseKey = (() => {
            try { return new URL(url).hostname; } catch { return label.toLowerCase(); }
        })();
        const client = cacheReads ? withReadCache(rawClient, databaseKey) : rawClient;
        globalForDb[cacheKey] = client;
        return client;
    } catch (e) {
        console.error(`[DB CLIENT] ${label}: Error creando el cliente:`, e);
        return null;
    }
}

export async function getDbClient(): Promise<Client | null> {
    return makeClient('__awardsDb', ['TURSO_DATABASE_URL'], ['TURSO_AUTH_TOKEN'], 'AWARDS');
}

export async function getSeasonAwardsDbClient(): Promise<Client | null> {
    return makeClient('__seasonAwardsDb', ['TURSO_DATABASE_URL_2'], ['TURSO_AUTH_TOKEN_2'], 'SEASON-AWARDS', false);
}

export async function getPlayersDbClient(): Promise<Client | null> {
    return makeClient(
        '__playersDb',
        ['TURSO_STATS_DATABASE_URL', 'TURSO_DATABASE_URL'],
        ['TURSO_STATS_AUTH_TOKEN', 'TURSO_AUTH_TOKEN'],
        'STATS',
    );
}

export async function getAnalyticsDbClient(): Promise<Client | null> {
    return makeClient('__analyticsDb', ['TURSO_NEWS_DATABASE_URL'], ['TURSO_NEWS_AUTH_TOKEN'], 'NEWS', false);
}
