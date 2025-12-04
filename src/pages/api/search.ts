import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
    const query = url.searchParams.get('q')?.toLowerCase().trim();

    if (!query) {
        return new Response(JSON.stringify({ results: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const baseUrl = url.origin;

        const [playersRes, clubesRes, partidosRes] = await Promise.all([
            fetch(`${baseUrl}/api/players`),
            fetch(`${baseUrl}/api/clubes`),
            fetch(`${baseUrl}/api/partidos`)
        ]);

        const players = playersRes.ok ? await playersRes.json() : [];
        const clubes = clubesRes.ok ? await clubesRes.json() : [];
        const partidos = partidosRes.ok ? await partidosRes.json() : [];

        const results: any[] = [];

        players.forEach((player: any) => {
            const name = player.name?.toLowerCase() || '';
            if (name.includes(query)) {
                results.push({
                    type: 'player',
                    title: player.name,
                    subtitle: player.position || '',
                    url: `/jugadoras/${player.id.replace(/_/g, "-")}`,
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
                    url: `/rivales/${club.id}`,
                    relevance: name.startsWith(query) ? 10 : 5
                });
            }
        });

        partidos.forEach((partido: any) => {
            const rival = partido.rival?.toLowerCase() || '';
            const fecha = partido.fecha || '';

            if (rival.includes(query) || fecha.includes(query)) {
                results.push({
                    type: 'match',
                    title: `${partido.rival || 'Partido'}`,
                    subtitle: `${partido.fecha || ''} - ${partido.competicion || ''}`,
                    url: `/partidos/${partido.id}`,
                    relevance: rival.startsWith(query) ? 8 : 3
                });
            }
        });

        results.sort((a, b) => b.relevance - a.relevance);

        const limitedResults = results.slice(0, 20);

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
