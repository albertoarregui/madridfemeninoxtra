import { cached } from "./cache";
import { cacheTags } from "../lib/cache-tags";
import { generateSlug } from "./url-helper";

export type CompareTipo = "entrenadores" | "arbitras" | "rivales" | "estadios";

export interface CompareEntity {
    slug: string;
    name: string;
    img: string;
    sub: string;
    contain?: boolean;
    values: Record<string, number>;
}

export interface CompareMetric {
    key: string;
    label: string;
    better: "high" | "low" | "none";
    format?: "pct" | "dec";
}

export interface CompareGroup { title: string; metrics: CompareMetric[] }

const RESULTADOS: CompareGroup = {
    title: "Resultados",
    metrics: [
        { key: "pj", label: "Partidos", better: "high" },
        { key: "v", label: "Victorias", better: "high" },
        { key: "e", label: "Empates", better: "none" },
        { key: "d", label: "Derrotas", better: "low" },
        { key: "pctV", label: "% de victorias", better: "high", format: "pct" },
    ],
};
const GOLES: CompareGroup = {
    title: "Goles",
    metrics: [
        { key: "gf", label: "Goles a favor", better: "high" },
        { key: "gc", label: "Goles en contra", better: "low" },
        { key: "dif", label: "Diferencia", better: "high" },
        { key: "gfPj", label: "Goles a favor por partido", better: "high", format: "dec" },
        { key: "gcPj", label: "Goles en contra por partido", better: "low", format: "dec" },
    ],
};
const PORTERIAS: CompareMetric = { key: "pc", label: "Porterías a cero", better: "high" };

export const COMPARE_CONFIG: Record<CompareTipo, {
    singular: string; plural: string; title: string; groups: CompareGroup[];
}> = {
    entrenadores: {
        singular: "entrenador", plural: "entrenadores", title: "Comparador de entrenadores",
        groups: [RESULTADOS, { ...GOLES, metrics: [...GOLES.metrics, PORTERIAS] }],
    },
    arbitras: {
        singular: "árbitra", plural: "árbitras", title: "Comparador de árbitras",
        groups: [
            RESULTADOS,
            {
                title: "Disciplina",
                metrics: [
                    { key: "ta", label: "Amarillas al Real Madrid", better: "none" },
                    { key: "tr", label: "Rojas al Real Madrid", better: "none" },
                    { key: "taRival", label: "Amarillas al rival", better: "none" },
                    { key: "trRival", label: "Rojas al rival", better: "none" },
                    { key: "tarjPj", label: "Tarjetas por partido", better: "none", format: "dec" },
                ],
            },
            {
                title: "Penaltis y faltas",
                metrics: [
                    { key: "penFavor", label: "Penaltis a favor", better: "none" },
                    { key: "penContra", label: "Penaltis en contra", better: "none" },
                    { key: "faltasPj", label: "Faltas del Madrid por partido", better: "none", format: "dec" },
                    { key: "faltasRecPj", label: "Faltas recibidas por partido", better: "none", format: "dec" },
                ],
            },
        ],
    },
    rivales: {
        singular: "rival", plural: "rivales", title: "Comparador de rivales",
        groups: [RESULTADOS, { ...GOLES, metrics: [...GOLES.metrics, PORTERIAS] }],
    },
    estadios: {
        singular: "estadio", plural: "estadios", title: "Comparador de estadios",
        groups: [RESULTADOS, GOLES],
    },
};

export const isCompareTipo = (tipo: string | undefined): tipo is CompareTipo =>
    Boolean(tipo && tipo in COMPARE_CONFIG);

function withDerived(base: Record<string, number>): Record<string, number> {
    const pj = base.pj || 0;
    const ratio = (n: number) => (pj ? Math.round((n / pj) * 100) / 100 : 0);
    return {
        ...base,
        pctV: pj ? Math.round((base.v / pj) * 1000) / 10 : 0,
        dif: (base.gf ?? 0) - (base.gc ?? 0),
        gfPj: ratio(base.gf ?? 0),
        gcPj: ratio(base.gc ?? 0),
    };
}

const DAY = 24 * 60 * 60 * 1000;

async function loadCoaches(): Promise<CompareEntity[]> {
    const { fetchCoachesDirectly } = await import("./entrenadores");
    const { getPlayersDbClient } = await import("../db/client");
    const [coaches, client] = await Promise.all([fetchCoachesDirectly(), getPlayersDbClient()]);
    if (!client) return [];
    const result = await client.execute(`
        SELECT p.id_entrenador AS id,
            COUNT(DISTINCT p.id_partido) AS pj,
            SUM(CASE WHEN CAST(p.goles_rm AS INTEGER) > CAST(p.goles_rival AS INTEGER) THEN 1 ELSE 0 END) AS v,
            SUM(CASE WHEN CAST(p.goles_rm AS INTEGER) = CAST(p.goles_rival AS INTEGER) THEN 1 ELSE 0 END) AS e,
            SUM(CASE WHEN CAST(p.goles_rm AS INTEGER) < CAST(p.goles_rival AS INTEGER) THEN 1 ELSE 0 END) AS d,
            SUM(CAST(p.goles_rm AS INTEGER)) AS gf,
            SUM(CAST(p.goles_rival AS INTEGER)) AS gc,
            SUM(CASE WHEN CAST(p.goles_rival AS INTEGER) = 0 THEN 1 ELSE 0 END) AS pc
        FROM partidos p
        WHERE p.id_entrenador IS NOT NULL
          AND p.goles_rm IS NOT NULL AND p.goles_rm != ''
          AND p.goles_rival IS NOT NULL AND p.goles_rival != ''
          AND date(p.fecha) <= date('now')
        GROUP BY p.id_entrenador
    `);
    const byId = new Map(result.rows.map((r: any) => [String(r.id), r]));
    return coaches
        .map((c: any) => {
            const r: any = byId.get(String(c.id_entrenador)) || {};
            return {
                slug: c.slug,
                name: c.nombre || c.name || "",
                img: c.imageUrl || "",
                sub: c.pais || c.country || "Entrenador",
                values: withDerived({
                    pj: Number(r.pj || 0), v: Number(r.v || 0), e: Number(r.e || 0), d: Number(r.d || 0),
                    gf: Number(r.gf || 0), gc: Number(r.gc || 0), pc: Number(r.pc || 0),
                }),
            };
        })
        .filter((c) => c.slug && c.values.pj > 0);
}

async function loadReferees(): Promise<CompareEntity[]> {
    const { fetchRefereesDirectly } = await import("./arbitras");
    const referees = await fetchRefereesDirectly();
    return referees
        .filter((r: any) => r.stats?.played > 0)
        .map((r: any) => {
            const s = r.stats;
            const pj = s.played;
            const per = (n: number) => (pj ? Math.round((n / pj) * 100) / 100 : 0);
            return {
                slug: generateSlug(r.nombre),
                name: r.nombre,
                img: r.foto_url ? (r.foto_url.startsWith("http") ? r.foto_url : `https://media.madridfemeninoxtra.com${r.foto_url}`) : "",
                sub: [r.colegio, r.pais_origen].filter(Boolean).join(" · ") || "Árbitra",
                values: {
                    ...withDerived({ pj, v: s.wins, e: s.draws, d: s.losses }),
                    ta: s.yellowCards, tr: s.redCards, taRival: s.yellowCardsAgainst, trRival: s.redCardsAgainst,
                    tarjPj: per(s.yellowCards + s.redCards + s.yellowCardsAgainst + s.redCardsAgainst),
                    penFavor: s.penaltiesFor, penContra: s.penaltiesAgainst,
                    faltasPj: Number(s.foulsCommittedAvg), faltasRecPj: Number(s.foulsReceivedAvg),
                },
            };
        });
}

async function loadRivals(): Promise<CompareEntity[]> {
    const { fetchRivalsDirectly } = await import("./rivales");
    const rivals = await fetchRivalsDirectly();
    return rivals
        .filter((r: any) => r.stats?.played > 0 && !/real madrid/i.test(r.nombre))
        .map((r: any) => ({
            slug: r.slug,
            name: r.nombre,
            img: r.shieldUrl || "",
            sub: [r.ciudad, r.pais].filter(Boolean).join(" · "),
            contain: true,
            values: withDerived({
                pj: r.stats.played, v: r.stats.wins, e: r.stats.draws, d: r.stats.losses,
                gf: r.stats.gf, gc: r.stats.ga, pc: r.stats.cleanSheets,
            }),
        }));
}

async function loadStadiums(): Promise<CompareEntity[]> {
    const { fetchAllStadiumsWithStats } = await import("./estadios");
    const stadiums = await fetchAllStadiumsWithStats();
    return stadiums
        .filter((s: any) => s.stats?.played > 0)
        .map((s: any) => ({
            slug: s.slug,
            name: s.name,
            img: s.imageUrl || "",
            sub: s.city || "Estadio",
            values: withDerived({
                pj: s.stats.played, v: s.stats.wins, e: s.stats.draws, d: s.stats.losses,
                gf: s.stats.gf, gc: s.stats.ga,
            }),
        }));
}

const LOADERS: Record<CompareTipo, () => Promise<CompareEntity[]>> = {
    entrenadores: loadCoaches,
    arbitras: loadReferees,
    rivales: loadRivals,
    estadios: loadStadiums,
};

const TAGS: Record<CompareTipo, string[]> = {
    entrenadores: [cacheTags.coaches, cacheTags.matches],
    arbitras: [cacheTags.referees, cacheTags.matches],
    rivales: [cacheTags.rivals, cacheTags.matches],
    estadios: [cacheTags.stadiums, cacheTags.matches],
};

export async function fetchCompareEntities(tipo: CompareTipo): Promise<CompareEntity[]> {
    const list = await cached(`compare:${tipo}:v1`, DAY, LOADERS[tipo], { tags: TAGS[tipo] }).catch(() => []);
    return [...list].sort((a, b) => b.values.pj - a.values.pj || a.name.localeCompare(b.name, "es"));
}

export async function fetchCompareOptions(tipo: CompareTipo) {
    const list = await fetchCompareEntities(tipo);
    return list.map(({ slug, name, img, sub, contain, values }) => ({ slug, name, img, sub, contain, pj: values.pj }));
}
