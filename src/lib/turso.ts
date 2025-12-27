import { createClient } from "@libsql/client";

const url = import.meta.env.TURSO_DATABASE_URL;
const authToken = import.meta.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    throw new Error("TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is not defined");
}

export const turso = createClient({
    url,
    authToken,
});
