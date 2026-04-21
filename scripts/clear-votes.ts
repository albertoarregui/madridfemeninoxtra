import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL_2;
const authToken = process.env.TURSO_AUTH_TOKEN_2;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL_2 or TURSO_AUTH_TOKEN_2");
  process.exit(1);
}

const client = createClient({
  url,
  authToken,
});

try {
  const result = await client.execute("DELETE FROM votes");
  console.log("Votes cleared:", result);
  process.exit(0);
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
