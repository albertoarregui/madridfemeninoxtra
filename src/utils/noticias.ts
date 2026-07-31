import { contentfulClient } from "../lib/contentful";

export interface NoticiaCard {
    id: string;
    title: string;
    subtitle?: string;
    slug: string;
    category?: string;
    createdAt: string;
    referenceId?: string;
    player?: string;
    imageUrl: string | null;
}

const FALLBACK_IMAGE = "https://www.madridfemeninoxtra.com/og.png";

function mapNoticia(item: any): NoticiaCard {
    const f = item.fields || {};
    const rawUrl = f.featuredImage?.fields?.file?.url;
    return {
        id: item.sys.id,
        title: f.title,
        subtitle: f.subtitle,
        slug: f.slug,
        category: f.category,
        createdAt: item.sys.createdAt,
        referenceId: f.referenceId != null ? String(f.referenceId) : undefined,
        player: f.player,
        imageUrl: rawUrl ? `https:${rawUrl}` : FALLBACK_IMAGE,
    };
}

export async function getNewsForPlayer(
    idJugadora: string | number,
    playerName?: string,
    limit = 6,
): Promise<NoticiaCard[]> {
    const byId: NoticiaCard[] = [];
    try {
        const entries = await contentfulClient.getEntries({
            content_type: "noticia",
            "fields.focusType": "player",
            "fields.referenceId": String(idJugadora),
            order: ["-sys.createdAt"],
            limit,
        });
        byId.push(...entries.items.map(mapNoticia));
    } catch (e) {
        console.warn("[getNewsForPlayer] referenceId query failed:", e);
    }

    if (byId.length < limit && playerName) {
        try {
            const entries = await contentfulClient.getEntries({
                content_type: "noticia",
                "fields.focusType": "player",
                "fields.player": playerName,
                order: ["-sys.createdAt"],
                limit,
            });
            for (const mapped of entries.items.map(mapNoticia)) {
                if (!byId.some((n) => n.id === mapped.id)) byId.push(mapped);
            }
        } catch (e) {
            console.warn("[getNewsForPlayer] name query failed:", e);
        }
    }

    return byId.slice(0, limit);
}

export async function getRecentNewsByFocus(
    focusType: string,
    limit = 100,
): Promise<NoticiaCard[]> {
    try {
        const entries = await contentfulClient.getEntries({
            content_type: "noticia",
            "fields.focusType": focusType,
            order: ["-sys.createdAt"],
            limit,
        });
        return entries.items.map(mapNoticia);
    } catch (e) {
        console.warn(`[getRecentNewsByFocus:${focusType}] query failed:`, e);
        return [];
    }
}

export function getRecentPlayerNews(limit = 20): Promise<NoticiaCard[]> {
    return getRecentNewsByFocus("player", limit);
}

export function groupNewsByReference(
    news: NoticiaCard[],
    max = 3,
): Map<string, NoticiaCard[]> {
    const map = new Map<string, NoticiaCard[]>();
    for (const n of news) {
        if (!n.referenceId) continue;
        const arr = map.get(n.referenceId) ?? [];
        if (arr.length < max) {
            arr.push(n);
            map.set(n.referenceId, arr);
        }
    }
    return map;
}
