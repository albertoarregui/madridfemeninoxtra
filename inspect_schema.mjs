import { createClient } from '@libsql/client';


const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('Credenciales de Turso no configuradas');
    process.exit(1);
}

const client = createClient({
    url: url,
    authToken: authToken,
});

async function inspect() {
    try {
        console.log('--- ALINEACIONES ---');
        const alineaciones = await client.execute("SELECT * FROM alineaciones LIMIT 1");
        console.log(Object.keys(alineaciones.rows[0] || {}));

        console.log('--- CAMBIOS ---');
        const cambios = await client.execute("SELECT * FROM cambios LIMIT 1");
        console.log(Object.keys(cambios.rows[0] || {}));
    } catch (e) {
        console.error(e);
    }
}

inspect();
