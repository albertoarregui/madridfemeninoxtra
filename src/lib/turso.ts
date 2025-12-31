import { createClient } from "@libsql/client";

const url = import.meta.env.TURSO_DATABASE_URL_2 || import.meta.env.TURSO_DATABASE_URL;
const authToken = import.meta.env.TURSO_AUTH_TOKEN_2 || import.meta.env.TURSO_AUTH_TOKEN;

// Create client if credentials exist, otherwise return a mock that logs errors
// This prevents the entire app from crashing if env vars are missing
export const turso = (url && authToken)
    ? createClient({
        url,
        authToken,
    })
    : {
        execute: async () => {
            console.error("❌ TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is missing.");
            return { rows: [] }; // Return empty result to prevent calling code from crashing
        },
        transaction: async () => {
            console.error("❌ TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is missing.");
            throw new Error("DB Connection Missing");
        }
    } as unknown as ReturnType<typeof createClient>;
