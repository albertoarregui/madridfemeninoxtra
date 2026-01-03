import type { Client } from '@libsql/client';

let clientInstance: Client | null = null;

export async function getDbClient(): Promise<Client | null> {
    if (clientInstance) {
        console.log('[DB CLIENT] Returning existing client instance');
        return clientInstance;
    }

    try {
        const { createClient } = await import('@libsql/client');
        const url = import.meta.env.TURSO_DATABASE_URL;
        const authToken = import.meta.env.TURSO_AUTH_TOKEN;

        console.log('[DB CLIENT] URL exists:', !!url);
        console.log('[DB CLIENT] AuthToken exists:', !!authToken);

        if (!url || !authToken) {
            console.error('[DB CLIENT] Credenciales de Turso no configuradas');
            return null;
        }

        clientInstance = createClient({
            url,
            authToken,
        });

        console.log('[DB CLIENT] Client created successfully');
        return clientInstance;
    } catch (e) {
        console.error("[DB CLIENT] Error creating DB client:", e);
        return null;
    }
}
