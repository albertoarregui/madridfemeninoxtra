import type { Client } from '@libsql/client';

let clientInstance: Client | null = null;
let statsClientInstance: Client | null = null;

export async function getDbClient(): Promise<Client | null> {
    if (clientInstance) {
        return clientInstance;
    }

    try {
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env?.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('[DB CLIENT] AWARDS: Credenciales no configuradas');
            return null;
        }

        console.log(`[DB CLIENT] Connecting to AWARDS DB: ${url}`);
        clientInstance = createClient({ url, authToken });
        return clientInstance;
    } catch (e) {
        console.error("[DB CLIENT] AWARDS: Error creating client:", e);
        return null;
    }
}

export async function getPlayersDbClient(): Promise<Client | null> {
    if (statsClientInstance) {
        return statsClientInstance;
    }

    try {
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env?.TURSO_STATS_DATABASE_URL || process.env.TURSO_STATS_DATABASE_URL || import.meta.env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env?.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_STATS_AUTH_TOKEN || import.meta.env?.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('[DB CLIENT] STATS: Credenciales no configuradas');
            return null;
        }

        console.log(`[DB CLIENT] Connecting to STATS DB: ${url}`);
        statsClientInstance = createClient({ url, authToken });
        return statsClientInstance;
    } catch (e) {
        console.error("[DB CLIENT] STATS: Error creating client:", e);
        return null;
    }
}
