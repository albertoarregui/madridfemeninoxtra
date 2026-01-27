import type { Client } from '@libsql/client';

let clientInstance: Client | null = null;
let statsClientInstance: Client | null = null;

export async function getDbClient(): Promise<Client | null> {
    if (clientInstance) {
        return clientInstance;
    }

    try {
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('[DB CLIENT] Credenciales de Turso (Votes) no configuradas');
            return null;
        }

        clientInstance = createClient({ url, authToken });
        return clientInstance;
    } catch (e) {
        console.error("[DB CLIENT] Error creating DB client:", e);
        return null;
    }
}

export async function getPlayersDbClient(): Promise<Client | null> {
    if (statsClientInstance) {
        return statsClientInstance;
    }

    try {
        const { createClient } = await import('@libsql/client');
        // Try specific stats env vars first, fallback to main if it might be the same
        const url = import.meta.env.TURSO_STATS_DATABASE_URL || import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_STATS_AUTH_TOKEN || import.meta.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            console.error('[DB CLIENT] Credenciales de Turso (Players/Stats) no configuradas');
            return null;
        }

        statsClientInstance = createClient({ url, authToken });
        return statsClientInstance;
    } catch (e) {
        console.error("[DB CLIENT] Error creating Players DB client:", e);
        return null;
    }
}
