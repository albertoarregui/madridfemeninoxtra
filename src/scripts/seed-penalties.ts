
import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing TURSO credentials in .env");
    process.exit(1);
}

const client = createClient({ url, authToken });

const TABLE_PENALTIS = "penaltis";

const createTablesSQL = [
    `CREATE TABLE IF NOT EXISTS penaltis (
        id_penalti INTEGER PRIMARY KEY AUTOINCREMENT,
        id_partido INTEGER NOT NULL,
        id_jugadora INTEGER REFERENCES jugadoras(id_jugadora),
        lanzadora_rival TEXT,
        portera_rival TEXT,
        tipo TEXT NOT NULL CHECK(tipo IN ('a_favor', 'en_contra')),
        resultado TEXT NOT NULL CHECK(resultado IN ('gol', 'parado', 'fuera', 'palo', 'fallado')),
        minuto INTEGER,
        FOREIGN KEY(id_partido) REFERENCES partidos(id_partido)
    );`,
    `CREATE TABLE IF NOT EXISTS goles_propia (
        id_autogol INTEGER PRIMARY KEY AUTOINCREMENT,
        id_partido INTEGER NOT NULL,
        id_jugadora INTEGER REFERENCES jugadoras(id_jugadora),
        autora_rival TEXT,
        tipo TEXT NOT NULL CHECK(tipo IN ('a_favor', 'en_contra')),
        minuto INTEGER,
        FOREIGN KEY(id_partido) REFERENCES partidos(id_partido)
    );`,
    `CREATE TABLE IF NOT EXISTS tandas_penaltis (
        id_tanda INTEGER PRIMARY KEY AUTOINCREMENT,
        id_partido INTEGER NOT NULL UNIQUE,
        goles_rm INTEGER NOT NULL DEFAULT 0,
        goles_rival INTEGER NOT NULL DEFAULT 0,
        resultado TEXT CHECK(resultado IN ('ganado', 'perdido')),
        FOREIGN KEY(id_partido) REFERENCES partidos(id_partido)
    );`
];

// Data provided by user
const rawData = `
1	5	Kosovare Asllani 	NULL	NULL	NULL	A favor	Anotado	46
2	5	Kosovare Asllani 	NULL	NULL	NULL	A favor	Anotado	54
3	6	Kosovare Asllani 	NULL	NULL	NULL	A favor	Anotado	54
4	11	Lorena Navarro	NULL	NULL	NULL	A favor	Anotado	79
5	16	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	79
6	21	Jessica Martínez	NULL	NULL	NULL	A favor	Anotado	8
7	25	Kosovare Asllani 	NULL	NULL	NULL	A favor	Anotado	17
8	26	Kosovare Asllani 	NULL	NULL	NULL	A favor	Anotado	79
9	27	Kosovare Asllani 	NULL	NULL	NULL	A favor	Anotado	76
10	29	NULL	NULL	Misa Rodríguez	NULL	En contra	Fallado	33
11	33	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	47
12	34	Samara Ortiz	NULL	NULL	NULL	A favor	Anotado	30
13	35	NULL	NULL	Yohana Gómez	NULL	En contra	Anotado	51
14	37	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	87
15	38	NULL	NULL	Meline Gerard	NULL	En contra	Anotado	78
16	39	Marta Corredera	NULL	NULL	NULL	A favor	Anotado	66
17	43	Esther González	NULL	NULL	NULL	A favor	Fallado	43
18	48	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	37
19	53	NULL	NULL	Meline Gerard	NULL	En contra	Fallado	80
20	61	Kosovare Asllani 	NULL	NULL	NULL	A favor	Anotado	39
21	71	Claudia Zornoza	NULL	NULL	NULL	A favor	Anotado	95
22	73	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	63
23	76	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	51
24	78	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	16
25	79	Claudia Zornoza	NULL	NULL	NULL	A favor	Anotado	5
26	83	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	94
27	85	Kosovare Asllani 	NULL	NULL	NULL	A favor	Anotado	43
28	87	NULL	NULL	Meline Gerard	NULL	En contra	Fallado	56
29	98	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	76
30	108	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	57
31	110	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	57
32	111	Teresa Abelleira 	NULL	NULL	NULL	A favor	Anotado	21
33	113	Nahikari García 	NULL	NULL	NULL	A favor	Fallado	62
35	114	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	72
34	115	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	110
37	120	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	89
36	126	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	76
38	148	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	79
39	153	Olga Carmona	NULL	NULL	NULL	A favor	Fallado	27
40	154	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	80
41	155	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	78
42	157	Sandie Toletti	NULL	NULL	NULL	A favor	Anotado	46
43	158	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	38
44	159	NULL	NULL	Mylene Chavas	NULL	En contra	Anotado	61
45	160	Athenea del Castillo	NULL	NULL	NULL	A favor	Fallado	59
46	165	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	22
47	166	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	28
48	183	Olga Carmona	NULL	NULL	NULL	A favor	Fallado	28
49	184	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	47
50	185	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	18
51	187	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	35
52	189	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	27
54	190	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	78
53	191	Linda Caicedo	NULL	NULL	NULL	A favor	Anotado	83
55	200	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	51
59	200	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	56
56	203	Olga Carmona	NULL	NULL	NULL	A favor	Fallado	43
57	204	Teresa Abelleira 	NULL	NULL	NULL	A favor	Fallado	70
58	210	Caroline Weir	NULL	NULL	NULL	A favor	Anotado	22
60	212	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	10
61	213	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	10
62	217	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	24
63	217	Olga Carmona	NULL	NULL	NULL	A favor	Anotado	82
64	223	Caroline Weir	NULL	NULL	NULL	A favor	Anotado	9
65	237	Sara Däbritz	NULL	NULL	NULL	A favor	Fallado	60
66	245	NULL	NULL	Misa Rodríguez	NULL	En contra	Anotado	41
67	246	Caroline Weir	NULL	NULL	NULL	A favor	Fallado	81
68	254	Filippa Angeldahl	NULL	NULL	NULL	A favor	Fallado	82
`.trim();

function normalize(str: string): string {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

async function main() {
    console.log("Starting DB Seed...");

    // 1. Fetch Players Map
    console.log("Fetching players...");
    const playersResult = await client.execute("SELECT id_jugadora, nombre FROM jugadoras");
    const playersMap = new Map<string, number>();

    playersResult.rows.forEach(row => {
        if (typeof row.nombre === 'string') {
            playersMap.set(normalize(row.nombre), Number(row.id_jugadora));
        }
    });
    console.log(`Loaded ${playersMap.size} players.`);

    // 2. Create Tables
    console.log("Creating tables...");
    for (const sql of createTablesSQL) {
        await client.execute(sql);
    }
    console.log("Tables created/verified.");

    // 3. Parse and Insert Data
    console.log("Parsing data...");
    const lines = rawData.split('\n');
    const regex = /^(\d+)\s+(\d+)\s+(.+?)\s+(NULL|.+?)\s+(NULL|.+?)\s+(NULL|.+?)\s+(A favor|En contra)\s+(Anotado|Fallado)\s+(\d+)$/i;

    let successCount = 0;
    let failCount = 0;

    for (const line of lines) {
        const match = line.trim().match(regex);
        if (!match) {
            console.warn(`REGEX MISMATCH: ${line}`);
            failCount++;
            continue;
        }

        const [_, id_penalti, id_partido, id_jugadora_str, lanzadora_rival_str, portera_rm_str, portera_rival_str, tipo_str, resultado_str, minuto] = match;

        const tipo = tipo_str.toLowerCase().replace(' ', '_'); // "A favor" -> "a_favor"
        const resultado = resultado_str.toLowerCase() === 'anotado' ? 'gol' : 'fallado';

        let db_id_jugadora: number | null = null;
        let db_lanzadora_rival: string | null = null;
        let db_portera_rival: string | null = null;

        if (tipo === 'a_favor') {
            const name = id_jugadora_str.trim();
            if (name !== 'NULL') {
                const normName = normalize(name);
                const id = playersMap.get(normName);
                if (id) {
                    db_id_jugadora = id;
                } else {
                    console.warn(`PLAYER NOT FOUND: ${name} (Line: ${id_penalti})`);
                }
            }
            // Portera rival is usually NULL in data, but if it existed, we'd map it
            if (portera_rival_str.trim() !== 'NULL') {
                db_portera_rival = portera_rival_str.trim();
            }
        } else if (tipo === 'en_contra') {
            // "En contra" means opponent kicked it.
            // id_jugadora logic: we want OUR goalkeeper here? 
            // The schema says: id_jugadora REFERENCES jugadoras.
            // If it's "en_contra", the player involved from OUR side is the goalkeeper.
            const name = portera_rm_str.trim();
            if (name !== 'NULL') {
                const normName = normalize(name);
                const id = playersMap.get(normName);
                if (id) {
                    db_id_jugadora = id;
                } else {
                    console.warn(`GOALKEEPER NOT FOUND: ${name} (Line: ${id_penalti})`);
                }
            }

            if (lanzadora_rival_str.trim() !== 'NULL') {
                db_lanzadora_rival = lanzadora_rival_str.trim();
            }
        }

        try {
            await client.execute({
                sql: `INSERT OR REPLACE INTO penaltis (id_penalti, id_partido, id_jugadora, lanzadora_rival, portera_rival, tipo, resultado, minuto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    id_penalti,
                    id_partido,
                    db_id_jugadora,
                    db_lanzadora_rival,
                    db_portera_rival,
                    tipo,
                    resultado,
                    minuto
                ]
            });
            successCount++;
        } catch (e) {
            console.error(`INSERT FAILED (Line: ${id_penalti}):`, e);
            failCount++;
        }
    }

    console.log(`Finished. Success: ${successCount}, Fail: ${failCount}.`);
}

main().catch(console.error);
