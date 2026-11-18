import type { APIRoute } from 'astro';

import { fetchRefereesDirectly } from '../../utils/arbitras';
import { getAllStadiums } from '../../utils/estadios';
import { fetchPlayersDirectly } from '../../utils/players';
import { fetchRivalsDirectly } from '../../utils/rivales';
import { fetchGamesDirectly } from '../../utils/partidos';
import { fetchCoachesDirectly } from '../../utils/entrenadores';
import { cached } from '../../utils/cache';
import { cacheTags } from '../../lib/cache-tags';
import { jsonResponse } from '../../lib/api-cache';

type SearchEntry = {
    k: string;
    f?: string;
    hi: number;
    lo: number;
    r: Record<string, unknown>;
};

const INDEX_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INDEX_TAGS = [
    cacheTags.database, cacheTags.players, cacheTags.statistics, cacheTags.rivals, cacheTags.matches,
    cacheTags.calendar, cacheTags.coaches, cacheTags.referees, cacheTags.stadiums,
];

function generateSlug(text: string): string {
    return text.toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function buildSearchIndex(): Promise<SearchEntry[]> {
    const [players, clubes, partidos, entrenadores, arbitras, estadios] = await Promise.all([
        fetchPlayersDirectly(),
        fetchRivalsDirectly(),
        fetchGamesDirectly(),
        fetchCoachesDirectly(),
        fetchRefereesDirectly(),
        getAllStadiums()
    ]);

    if (players.length === 0 && partidos.length === 0) {
        throw new Error('Índice de búsqueda vacío');
    }

    const index: SearchEntry[] = [];

    players.forEach((player: any) => {
        index.push({
            k: player.nombre?.toLowerCase() || '', hi: 10, lo: 5,
            r: {
                type: 'player',
                title: player.nombre,
                subtitle: player.posicion || '',
                url: `/jugadoras/${player.slug}`,
                slug: player.slug,
                imageUrl: player.imageUrl,
            },
        });
    });

    clubes.forEach((club: any) => {
        index.push({
            k: club.nombre?.toLowerCase() || '', hi: 10, lo: 5,
            r: {
                type: 'rival',
                title: club.nombre,
                subtitle: 'Rival',
                url: `/rivales/${club.slug}`,
                slug: club.slug,
                shieldUrl: club.shieldUrl || club.foto_url,
            },
        });
    });

    entrenadores.forEach((coach: any) => {
        index.push({
            k: coach.nombre?.toLowerCase() || '', hi: 9, lo: 4,
            r: {
                type: 'coach',
                title: coach.nombre,
                subtitle: 'Entrenador',
                url: `/entrenadores/${coach.slug}`,
                slug: coach.slug,
                imageUrl: coach.imageUrl,
            },
        });
    });

    partidos.forEach((partido: any) => {
        const rival = partido.club_visitante?.toLowerCase() === 'real madrid femenino'
            ? partido.club_local?.toLowerCase() || ''
            : partido.club_visitante?.toLowerCase() || '';

        index.push({
            k: rival, f: partido.fecha_formateada || '', hi: 8, lo: 3,
            r: {
                type: 'match',
                title: `${partido.club_local} vs ${partido.club_visitante}`,
                subtitle: `${partido.fecha_formateada} - ${partido.competicion_nombre}`,
                url: `/partidos/${partido.slug}`,
                slug: partido.slug,
            },
        });
    });

    arbitras.forEach((ref: any) => {
        const slug = generateSlug(ref.nombre || '');
        index.push({
            k: ref.nombre?.toLowerCase() || '', hi: 9, lo: 4,
            r: {
                type: 'referee',
                title: ref.nombre,
                subtitle: 'Árbitra',
                url: `/arbitras/${slug}`,
                slug,
            },
        });
    });

    estadios.forEach((stadium: any) => {
        index.push({
            k: stadium.name?.toLowerCase() || '', hi: 9, lo: 4,
            r: {
                type: 'stadium',
                title: stadium.name,
                subtitle: stadium.city || 'Estadio',
                url: `/estadios/${stadium.slug}`,
                slug: stadium.slug,
            },
        });
    });

    return index;
}

function searchIndex(index: SearchEntry[], query: string) {
    return index
        .filter((entry) => entry.k.includes(query) || (entry.f !== undefined && entry.f.includes(query)))
        .map((entry) => ({ ...entry.r, relevance: entry.k.startsWith(query) ? entry.hi : entry.lo }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 100);
}

export const GET: APIRoute = async ({ url }) => {
    const query = url.searchParams.get('q')?.toLowerCase().trim();

    if (!query) {
        return new Response(JSON.stringify({ results: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const index = await cached('search:index:v1', INDEX_TTL_MS, buildSearchIndex, { tags: INDEX_TAGS });
        return jsonResponse({ results: searchIndex(index, query) }, { sMaxage: 3600, swr: 86400 });
    } catch (error) {
        console.error('Search error:', error);
        return new Response(JSON.stringify({
            results: [],
            error: 'Error performing search'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
