import { contentfulClient } from "../lib/contentful";

const CDN = "https://media.madridfemeninoxtra.com";
const BASE = `${CDN}/galerias`;

export type GalleryPhoto = {
    f: string;
    p: string[];
    r?: number;
    faces?: Record<string, [number, number, number, number]>;
};

export type GalleryIndex = {
    route: string;
    idPartido: number | null;
    count: number;
    fecha: string | null;
    temporada: string | null;
    competicion: string | null;
    photos: GalleryPhoto[];
    players: Record<string, number[]>;
};

export type GallerySummary = {
    route: string;
    idPartido: number | null;
    count: number;
    fecha: string | null;
    temporada: string | null;
    competicion: string | null;
    cover: string | null;
    players: Record<string, number>;
};

export type PlayerPhoto = {
    route: string;
    f: string;
    r: number | null;
    face: [number, number, number, number] | null;
    fecha: string | null;
    idPartido: number | null;
    temporada: string | null;
    competicion: string | null;
};

const TTL = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: unknown }>();

async function getJson<T>(url: string): Promise<T | null> {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < TTL) return hit.data as T;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = (await res.json()) as T;
        cache.set(url, { at: Date.now(), data });
        return data;
    } catch {
        return null;
    }
}

export function photoUrl(route: string, file: string): string {
    return `${BASE}/${route}/${encodeURIComponent(file)}`;
}

const SIGLAS = ["rcd", "fc", "sd", "cd", "ud", "cf", "ca", "rc", "ea"];
const MINUSCULAS = new Set(["de", "del", "la", "las", "el", "los", "y"]);

export function galleryTitle(route: string): string {
    const last = route.split("/").pop() || route;
    const cap = (w: string) => (w ? w[0].toUpperCase() + w.slice(1) : w);

    return last
        .replace(/^\d+-/, "")
        .split("-")
        .flatMap((w) => {
            if (MINUSCULAS.has(w)) return [w];
            const sigla = SIGLAS.find((s) => w.startsWith(s) && w.length > s.length + 2);
            if (sigla) return [sigla.toUpperCase(), cap(w.slice(sigla.length))];
            return [cap(w)];
        })
        .join(" ");
}

export function formatGalleryDate(fecha: string | null): string {
    if (!fecha) return "";
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return "";
    return d
        .toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
        .toUpperCase();
}

export async function fetchGalleriesIndex(): Promise<GallerySummary[]> {
    const data = await getJson<{ galleries: GallerySummary[] }>(`${BASE}/_index.json`);
    return data?.galleries ?? [];
}

export async function fetchGallery(route: string): Promise<GalleryIndex | null> {
    return getJson<GalleryIndex>(`${BASE}/${route}/_index.json`);
}

const normRoute = (s: string) =>
    s.toLowerCase().replace(/^\/+|\/+$/g, "").replace(/_/g, "-");

export async function resolveIndexRoute(raw: string): Promise<string | null> {
    if (!raw) return null;
    const galleries = await fetchGalleriesIndex();
    if (!galleries.length) return null;

    const r = normRoute(raw);
    let hit = galleries.find((g) => normRoute(g.route) === r);
    if (hit) return hit.route;

    const last = r.split("/").pop();
    hit = galleries.find((g) => normRoute(g.route).split("/").pop() === last);
    if (hit) return hit.route;

    const m = last?.match(/^(\d+)/);
    if (m) {
        const id = Number(m[1]);
        hit = galleries.find((g) => g.idPartido === id);
        if (hit) return hit.route;
    }
    return null;
}

export async function fetchPlayerPhotos(slug: string, limit?: number): Promise<PlayerPhoto[]> {
    const data = await getJson<{ photos: PlayerPhoto[] }>(`${BASE}/_players/${slug}.json`);
    const photos = data?.photos ?? [];
    return limit ? photos.slice(0, limit) : photos;
}

export async function fetchGalleryForMatch(idPartido: number): Promise<GalleryIndex | null> {
    const galleries = await fetchGalleriesIndex();
    const match = galleries.find((g) => g.idPartido === idPartido);
    return match ? fetchGallery(match.route) : null;
}

export async function fetchLatestGalleries(limit = 4): Promise<GallerySummary[]> {
    const galleries = await fetchGalleriesIndex();
    return galleries.slice(0, limit);
}

let slugCache: { at: number; data: Record<string, string> } | null = null;

export async function fetchGallerySlugs(): Promise<Record<string, string>> {
    if (slugCache && Date.now() - slugCache.at < TTL) return slugCache.data;
    const map: Record<string, string> = {};
    try {
        const entries = await contentfulClient.getEntries({ content_type: "gallery" });
        for (const item of entries.items) {
            const f = item.fields as any;
            const get = (label: string) => {
                const search = label.toLowerCase().replace(/\s/g, "");
                const key = Object.keys(f).find((k) => k.toLowerCase() === search);
                return key ? f[key] : null;
            };
            const ruta = get("route") || get("rutaDeCarpetas");
            const slug = get("slug");
            if (ruta && slug) {
                const raw = String(ruta).replace(/^\/+|\/+$/g, "");
                const real = (await resolveIndexRoute(raw)) || raw;
                map[real] = String(slug);
                if (real !== raw) map[raw] = String(slug);
            }
        }
    } catch {
    }
    slugCache = { at: Date.now(), data: map };
    return map;
}

export async function galleryPageHref(route: string): Promise<string | null> {
    const slugs = await fetchGallerySlugs();
    return slugs[route] ? `/fotogalerias/${slugs[route]}` : null;
}

export async function fetchPlayerNames(): Promise<Record<string, string>> {
    const { fetchPlayersDirectly } = await import("./players");
    const players = await fetchPlayersDirectly();
    const map: Record<string, string> = {};
    for (const p of players) {
        if (p.slug && p.nombre) map[p.slug] = p.nombre;
    }
    return map;
}

export function photoAlt(slugs: string[] | undefined, names: Record<string, string>, contexto: string): string {
    const nombres = (slugs || []).map((s) => names[s]).filter(Boolean);
    return nombres.length ? `${nombres.join(", ")} — ${contexto}` : contexto;
}

export function faceThumbStyle(face: [number, number, number, number] | null): string {
    if (!face) return "object-position:50% 35%;";
    const [x, y, w, h] = face;
    const cx = Math.min(100, Math.max(0, (x + w / 2) * 100));
    const cy = Math.min(100, Math.max(0, (y + h / 2) * 100));
    return `object-position:${cx.toFixed(1)}% ${cy.toFixed(1)}%;`;
}
