import { turso } from "./src/lib/turso";

async function listTables() {
    try {
        const result = await turso.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", result.rows.map(r => r.name));
    } catch (e) {
        console.error(e);
    }
}

listTables();
