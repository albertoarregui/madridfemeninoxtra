import { createClient, type Client } from '@libsql/client';

const globalForDb = globalThis as unknown as {
    __awardsDb?: Client | null;
    __seasonAwardsDb?: Client | null;
    __playersDb?: Client | null;
    __analyticsDb?: Client | null;
};

const env = (key: string): string | undefined =>
    (import.meta.env?.[key] as string | undefined) ?? process.env[key];

function makeClient(
    cacheKey: keyof typeof globalForDb,
    urlKeys: string[],
    tokenKeys: string[],
    label: string,
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
        const client = createClient({ url, authToken });
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
    return makeClient('__seasonAwardsDb', ['TURSO_DATABASE_URL_2'], ['TURSO_AUTH_TOKEN_2'], 'SEASON-AWARDS');
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
    return makeClient('__analyticsDb', ['TURSO_NEWS_DATABASE_URL'], ['TURSO_NEWS_AUTH_TOKEN'], 'NEWS');
}
