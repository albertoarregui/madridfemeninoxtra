import { createClient } from "@libsql/client";

const mainUrl = import.meta.env.TURSO_DATABASE_URL;
const mainToken = import.meta.env.TURSO_AUTH_TOKEN;

const userUrl = import.meta.env.TURSO_DATABASE_URL_2;
const userToken = import.meta.env.TURSO_AUTH_TOKEN_2;

// Client for Static/Core Data (Players, Matches) - DB 1
export const dbMain = (mainUrl && mainToken)
    ? createClient({ url: mainUrl, authToken: mainToken })
    : {
        execute: async () => { console.error("❌ DB Main Creds Missing"); return { rows: [] }; },
        transaction: async () => { throw new Error("DB Main Missing"); }
    } as unknown as ReturnType<typeof createClient>;

// Client for User Data (Predictions, Ratings) - DB 2
// Fallback to Main if User DB not defined (for local dev single-db setup)
export const dbUser = (userUrl && userToken)
    ? createClient({ url: userUrl, authToken: userToken })
    : ((mainUrl && mainToken) ? dbMain : {
        execute: async () => { console.error("❌ DB User Creds Missing"); return { rows: [] }; },
        transaction: async () => { throw new Error("DB User Missing"); }
    } as unknown as ReturnType<typeof createClient>);

// Default export alias for backward compatibility (prefer explicit dbMain/dbUser)
export const turso = dbUser;
