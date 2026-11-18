import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { tagsForPath } from '../src/lib/cache-tags';
import { nextMatchCacheSeconds, pickNextMatch } from '../src/utils/next-match';

const read = (file: string) => readFileSync(file, 'utf8');

test('buscador, valoraciones y premios se purgan cuando cambian sus datos', () => {
    for (const tag of ['matches', 'players', 'rivals', 'coaches', 'stadiums', 'referees']) {
        assert.ok(tagsForPath('/search').includes(tag), tag);
        assert.ok(tagsForPath('/api/search').includes(tag), tag);
    }
    assert.ok(tagsForPath('/valoraciones').includes('matches'));
    assert.ok(tagsForPath('/valoraciones/real-madrid-vs-atletico-2026-11-15').includes('lineups'));
    assert.ok(tagsForPath('/premios').includes('awards'));
});

test('las API públicas quedan en la CDN hasta que cambian los datos', () => {
    const middleware = read('src/middleware.ts');
    assert.match(middleware, /routePath\.startsWith\("\/api\/"\)/);
    assert.match(middleware, /max-age=\$\{CACHE_CORTA_S\}, stale-while-revalidate=\$\{SWR_S\}/);
    assert.match(middleware, /\.\.\.dataTags/);
});

test('el buscador usa un índice compacto en caché', () => {
    const search = read('src/pages/api/search.ts');
    assert.match(search, /cached\('search:index:v1'/);
    assert.match(search, /jsonResponse\(/);
    assert.match(read('src/pages/search.astro'), /if \(error\) Astro\.response\.headers\.set\("Vercel-CDN-Cache-Control", "no-store"\)/);
});

test('RSS y sitemaps se guardan con etiquetas y no se cachean si fallan', () => {
    for (const file of ['src/pages/rss.xml.ts', 'src/pages/news-sitemap.xml.ts']) {
        const source = read(file);
        assert.match(source, /database,news,contentful/, file);
        assert.match(source, /no-store/, file);
    }
    const sitemap = read('src/pages/sitemap.xml.ts');
    assert.match(sitemap, /'Vercel-Cache-Tag': SITEMAP_TAGS\.join/);
    assert.match(sitemap, /SITEMAP_TTL_S = 7 \* 24 \* 60 \* 60/);
});

test('el widget del próximo partido solo lee los partidos cercanos', () => {
    const widget = read('src/components/NextMatchCountdown.astro');
    assert.doesNotMatch(widget, /fetchGamesDirectly|fetchCalendarFromDb/);
    assert.match(read('src/pages/proximo-partido.astro'), /fetchUpcomingMatches/);
    assert.match(read('src/utils/next-match.ts'), /sql: gamesSql\('p\.fecha >= \?'\)/);
});

const match = (fecha: string, hora: string) => ({ fecha, hora, club_local: 'Real Madrid Femenino', club_visitante: 'Atlético de Madrid' });
const window = (...games: ReturnType<typeof match>[]) => ({ allGames: games, calendarMatches: games });

test('el próximo partido se guarda hasta el saque inicial y en directo cinco minutos', () => {
    const now = new Date('2026-11-18T10:00:00+01:00');

    const upcoming = pickNextMatch(window(match('2026-11-15', '18:00'), match('2026-11-18', '12:00')), now);
    assert.equal(upcoming.nextMatch?.fecha, '2026-11-18');
    assert.equal(upcoming.live, false);
    assert.equal(nextMatchCacheSeconds(upcoming.nextMatch, upcoming.live, now), 2 * 60 * 60);

    const far = pickNextMatch(window(match('2026-11-29', '21:00')), now);
    assert.equal(nextMatchCacheSeconds(far.nextMatch, far.live, now), 24 * 60 * 60);

    const live = pickNextMatch(window(match('2026-11-18', '09:30')), now);
    assert.equal(live.live, true);
    assert.equal(nextMatchCacheSeconds(live.nextMatch, live.live, now), 300);

    const none = pickNextMatch(window(), now);
    assert.equal(none.nextMatch, null);
    assert.equal(nextMatchCacheSeconds(none.nextMatch, none.live, now), 24 * 60 * 60);

    const failed = pickNextMatch(null, now);
    assert.equal(nextMatchCacheSeconds(failed.nextMatch, failed.live, now, failed.failed), 300);

    const soon = pickNextMatch(window(match('2026-11-18', '10:00')), new Date('2026-11-18T09:59:30+01:00'));
    assert.equal(nextMatchCacheSeconds(soon.nextMatch, soon.live, new Date('2026-11-18T09:59:30+01:00')), 60);
});
