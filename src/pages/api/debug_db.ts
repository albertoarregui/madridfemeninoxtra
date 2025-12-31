import { dbUser, dbMain } from "../lib/turso";

export async function GET() {
    const results = {
        main_auth: false,
        user_auth: false,
        user_db_configured: false,
        tables_in_user_db: [] as string[],
        tables_in_main_db: [] as string[],
        error: null as any
    };

    try {
        // Check Config
        const userUrl = import.meta.env.TURSO_DATABASE_URL_2;
        results.user_db_configured = !!userUrl;

        // Check Main DB
        try {
            const mainRes = await dbMain.execute("SELECT name FROM sqlite_master WHERE type='table'");
            results.tables_in_main_db = mainRes.rows.map((r: any) => r.name as string);
            results.main_auth = true;
        } catch (e) {
            console.error("Main DB Check Failed", e);
        }

        // Check User DB
        try {
            const userRes = await dbUser.execute("SELECT name FROM sqlite_master WHERE type='table'");
            results.tables_in_user_db = userRes.rows.map((r: any) => r.name as string);
            results.user_auth = true;
        } catch (e) {
            results.error = JSON.stringify(e, Object.getOwnPropertyNames(e));
        }

        return new Response(JSON.stringify(results, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ fatal_error: e }), { status: 500 });
    }
}
