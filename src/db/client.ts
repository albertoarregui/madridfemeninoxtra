import { createClient, type Client } from '@libsql/client';
import { cached, invalidarTags } from '../utils/cache';
import { isReadOnlySql, tagsForReadSql, tagsForWriteSql } from '../lib/db-cache-tags';

const globalForDb = globalThis as unknown as {
    __awardsDb?: Client | null;
    __seasonAwardsDb?: Client | null;
    __playersDb?: Client | null;
    __playersFreshDb?: Client | null;
    __analyticsDb?: Client | null;
};

// Una consulta solo vuelve a Turso una vez al mes, salvo revalidación por cambio.
const DB_READ_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DB_CACHE_VERSION = 'v3';

function statementSql(statement: any): string | undefined {
    if (typeof statement === 'string') return statement;
    if (Array.isArray(statement) && typeof statement[0] === 'string') return statement[0];
    return typeof statement?.sql === 'string' ? statement.sql : undefined;
}

function statementArgs(statement: any, executeArgs?: any): any {
    if (executeArgs !== undefined) return executeArgs;
    if (Array.isArray(statement)) return statement[1] ?? [];
    return typeof statement === 'string' ? [] : (statement?.args ?? statement?.params ?? []);
}

function addTags(target: Set<string>, tags: string[]): void {
    tags.forEach((tag) => target.add(tag));
}

function changedRowsOrSchema(sql: string, rowsAffected = 0): boolean {
    return rowsAffected > 0 || /^\s*(create|alter|drop|vacuum|reindex)\b/i.test(sql);
}

function withWriteInvalidation(transaction: any): any {
    const changedTags = new Set<string>();

    return new Proxy(transaction, {
        get(target, property, receiver) {
            if (property === 'execute') {
                return async (statement: any) => {
                    const result = await target.execute(statement);
                    const sql = statementSql(statement);
                    if (sql && !isReadOnlySql(sql) && changedRowsOrSchema(sql, result.rowsAffected)) {
                        addTags(changedTags, tagsForWriteSql(sql));
                    }
                    return result;
                };
            }
            if (property === 'batch') {
                return async (statements: any[]) => {
                    const results = await target.batch(statements);
                    statements.forEach((statement, index) => {
                        const sql = statementSql(statement);
                        if (sql && !isReadOnlySql(sql) && changedRowsOrSchema(sql, results[index]?.rowsAffected)) {
                            addTags(changedTags, tagsForWriteSql(sql));
                        }
                    });
                    return results;
                };
            }
            if (property === 'executeMultiple') {
                return async (sql: string) => {
                    await target.executeMultiple(sql);
                    if (!isReadOnlySql(sql)) addTags(changedTags, tagsForWriteSql(sql));
                };
            }
            if (property === 'commit') {
                return async () => {
                    await target.commit();
                    await invalidarTags([...changedTags]);
                    changedTags.clear();
                };
            }
            if (property === 'rollback') {
                return async () => {
                    await target.rollback();
                    changedTags.clear();
                };
            }
            if (property === 'close') {
                return () => {
                    target.close();
                    changedTags.clear();
                };
            }

            const value = Reflect.get(target, property, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        },
    });
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

function withReadCache(client: Client, database: string, forceRefresh = false): Client {
    return new Proxy(client, {
        get(target, property, receiver) {
            if (property === 'batch') {
                return async (statements: any[], mode?: any) => {
                    const results = await target.batch(statements, mode);
                    const changedTags = new Set<string>();
                    statements.forEach((statement, index) => {
                        const sql = statementSql(statement);
                        if (sql && !isReadOnlySql(sql) && changedRowsOrSchema(sql, results[index]?.rowsAffected)) {
                            addTags(changedTags, tagsForWriteSql(sql));
                        }
                    });
                    await invalidarTags([...changedTags]);
                    return results;
                };
            }
            if (property === 'migrate') {
                return async (statements: any[]) => {
                    const results = await target.migrate(statements);
                    const changedTags = new Set<string>();
                    statements.forEach((statement, index) => {
                        const sql = statementSql(statement);
                        if (sql && !isReadOnlySql(sql) && changedRowsOrSchema(sql, results[index]?.rowsAffected)) {
                            addTags(changedTags, tagsForWriteSql(sql));
                        }
                    });
                    await invalidarTags([...changedTags]);
                    return results;
                };
            }
            if (property === 'executeMultiple') {
                return async (sql: string) => {
                    await target.executeMultiple(sql);
                    if (!isReadOnlySql(sql)) await invalidarTags(tagsForWriteSql(sql));
                };
            }
            if (property === 'transaction') {
                return async (mode?: any) => withWriteInvalidation(await target.transaction(mode));
            }
            if (property !== 'execute') {
                const value = Reflect.get(target, property, receiver);
                return typeof value === 'function' ? value.bind(target) : value;
            }

            return async (statement: any, executeArgs?: any) => {
                const sql = statementSql(statement);
                const run = () => executeArgs === undefined
                    ? target.execute(statement)
                    : target.execute(statement, executeArgs);

                if (!sql) return run();
                if (!isReadOnlySql(sql)) {
                    const result = await run();
                    if (changedRowsOrSchema(sql, result.rowsAffected)) await invalidarTags(tagsForWriteSql(sql));
                    return result;
                }

                const args = statementArgs(statement, executeArgs);
                const normalizedSql = sql.replace(/\s+/g, ' ').trim();
                const tags = tagsForReadSql(sql);
                const key = `turso:${DB_CACHE_VERSION}:${database}:${normalizedSql}:${JSON.stringify(stableValue(args))}`;

                return cached(key, DB_READ_TTL_MS, async () => {
                    const result = await run();
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
                }, { tags, forceRefresh });
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
    forceRefresh = false,
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
        const client = cacheReads ? withReadCache(rawClient, databaseKey, forceRefresh) : rawClient;
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

export async function getPlayersDbClient(options: { forceRefresh?: boolean } = {}): Promise<Client | null> {
    const forceRefresh = options.forceRefresh === true;
    return makeClient(
        forceRefresh ? '__playersFreshDb' : '__playersDb',
        ['TURSO_STATS_DATABASE_URL', 'TURSO_DATABASE_URL'],
        ['TURSO_STATS_AUTH_TOKEN', 'TURSO_AUTH_TOKEN'],
        forceRefresh ? 'STATS-FRESH' : 'STATS',
        true,
        forceRefresh,
    );
}

export async function getAnalyticsDbClient(): Promise<Client | null> {
    return makeClient('__analyticsDb', ['TURSO_NEWS_DATABASE_URL'], ['TURSO_NEWS_AUTH_TOKEN'], 'NEWS', false);
}
