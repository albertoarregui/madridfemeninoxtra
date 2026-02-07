import type { APIRoute } from 'astro';

import { fetchRefereesDirectly } from '../../utils/arbitras';
import { getAllStadiums } from '../../utils/estadios';
import { fetchPlayersDirectly } from '../../utils/players';
import { fetchRivalsDirectly } from '../../utils/rivales';
import { fetchGamesDirectly } from '../../utils/partidos';
import { fetchCoachesDirectly } from '../../utils/entrenadores';

export const GET: APIRoute = async ({ url }) => {
    const query = url.searchParams.get('q')?.toLowerCase().trim();

    if (!query) {
        return new Response(JSON.stringify({ results: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const [players, clubes, partidos, entrenadores, arbitras, estadios] = await Promise.all([
            fetchPlayersDirectly(),
            fetchRivalsDirectly(),
            fetchGamesDirectly(),
            fetchCoachesDirectly(),
            fetchRefereesDirectly(),
            Promise.resolve(getAllStadiums())
        ]);

        const results: any[] = [];

        players.forEach((player: any) => {
            const name = player.nombre?.toLowerCase() || '';
            if (name.includes(query)) {
                results.push({
                    type: 'player',
                    title: player.nombre,
                    subtitle: player.posicion || '',
                    url: `/jugadoras/${player.slug}`,
                    slug: player.slug,
                    relevance: name.startsWith(query) ? 10 : 5
                });
            }
        });

        clubes.forEach((club: any) => {
            const name = club.nombre?.toLowerCase() || '';
            if (name.includes(query)) {
                results.push({
                    type: 'rival',
                    title: club.nombre,
                    subtitle: 'Rival',
                    url: `/rivales/${club.slug}`,
                    slug: club.slug,
                    relevance: name.startsWith(query) ? 10 : 5
                });
            }
        });

        entrenadores.forEach((coach: any) => {
            const name = coach.nombre?.toLowerCase() || '';
            if (name.includes(query)) {
                results.push({
                    type: 'coach',
                    title: coach.nombre,
                    subtitle: 'Entrenador',
                    url: `/entrenadores/${coach.slug}`,
                    slug: coach.slug,
                    relevance: name.startsWith(query) ? 9 : 4
                });
            }
        });

        partidos.forEach((partido: any) => {
            const rival = partido.club_visitante?.toLowerCase() === 'real madrid femenino'
                ? partido.club_local?.toLowerCase()
                : partido.club_visitante?.toLowerCase() || '';

            const fecha = partido.fecha_formateada || '';

            if (rival.includes(query) || fecha.includes(query)) {
                results.push({
                    type: 'match',
                    title: `${partido.club_local} vs ${partido.club_visitante}`,
                    subtitle: `${partido.fecha_formateada} - ${partido.competicion_nombre}`,
                    url: `/partidos/${partido.slug}`, // Fixed: Using slug instead of id_partido
                    slug: partido.slug,
                    relevance: rival.startsWith(query) ? 8 : 3
                });
            }
        });

        arbitras.forEach((ref: any) => {
            const name = ref.nombre?.toLowerCase() || '';
            if (name.includes(query)) {
                results.push({
                    type: 'referee',
                    title: ref.nombre,
                    subtitle: 'Árbitra',
                    url: `/arbitras/${generateSlug(ref.nombre)}`,
                    slug: generateSlug(ref.nombre),
                    relevance: name.startsWith(query) ? 9 : 4
                });
            }
        });

        estadios.forEach((stadium: any) => {
            const name = stadium.name?.toLowerCase() || '';
            if (name.includes(query)) {
                results.push({
                    type: 'stadium',
                    title: stadium.name,
                    subtitle: stadium.city || 'Estadio',
                    url: `/estadios/${stadium.slug}`,
                    slug: stadium.slug,
                    relevance: name.startsWith(query) ? 9 : 4
                });
            }
        });

        function generateSlug(text: string): string {
            return text.toLowerCase()
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");
        }

        results.sort((a, b) => b.relevance - a.relevance);

        const limitedResults = results.slice(0, 100);

        return new Response(JSON.stringify({ results: limitedResults }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
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
