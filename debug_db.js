
import { createClient } from "@libsql/client";
import fs from "fs";

const envFile = fs.readFileSync(".env", "utf8");
const env = {};
envFile.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) env[key.trim()] = value.trim();
});

const url = env.TURSO_DATABASE_URL;
const authToken = env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("No credentials");
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function main() {
    // Get a rival
    const rivals = await client.execute("SELECT * FROM clubes WHERE nombre = 'Real Madrid Femenino' LIMIT 1");
    const rival = rivals.rows[0];
    console.log("Rival:", rival.nombre, "ID:", rival.id_club);

    // Get matches for this rival
    const matches = await client.execute({
        sql: "SELECT * FROM partidos WHERE id_club_local = ? OR id_club_visitante = ?",
        args: [rival.id_club, rival.id_club]
    });

    console.log("Matches found:", matches.rows.length);
    matches.rows.forEach(m => {
        console.log("Match ID:", m.id_partido);
        console.log("  Local:", m.id_club_local, typeof m.id_club_local);
        console.log("  Visitor:", m.id_club_visitante, typeof m.id_club_visitante);
        console.log("  Rival ID:", rival.id_club, typeof rival.id_club);

        // Test logic
        const esLocal = m.id_club_visitante === Number(rival.id_club);
        console.log("  Logic (m.visitor === Number(rivalId)):", esLocal);
        console.log("  Predicted Ubicacion:", esLocal ? "Local" : "Visitante");
        console.log("---");
    });
}

main();
