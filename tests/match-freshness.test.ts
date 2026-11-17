import assert from 'node:assert/strict';
import test from 'node:test';
import { isOpenMatchDate, isOpenMatchSlug, matchCacheTags, matchDateFromSlug, matchOpenUntil, ownMatchTags } from '../src/lib/match-freshness';

test('una ficha sigue abierta hasta tres días después del día del partido', () => {
    const slug = 'real-madrid-vs-ajax-2026-09-02';

    assert.equal(isOpenMatchSlug(slug, new Date('2026-08-20T10:00:00Z')), true, 'partido futuro');
    assert.equal(isOpenMatchSlug(slug, new Date('2026-09-02T20:00:00Z')), true, 'día del partido');
    assert.equal(isOpenMatchSlug(slug, new Date('2026-09-04T23:59:59Z')), true, 'carga de datos posterior');
    assert.equal(isOpenMatchSlug(slug, new Date('2026-09-05T00:00:00Z')), false, 'partido antiguo');
    assert.equal(matchOpenUntil('2026-09-02'), Date.parse('2026-09-05T00:00:00Z'));
});

test('solo reconoce slugs de partido con fecha', () => {
    assert.equal(matchDateFromSlug('real-madrid-vs-ajax-2026-09-02'), '2026-09-02');
    assert.equal(matchDateFromSlug('real-madrid-vs-ajax'), null);
    assert.equal(isOpenMatchSlug('real-madrid-vs-ajax'), false);
    assert.equal(isOpenMatchDate(null), true, 'sin fecha se trata como abierta para no quedarse vieja');
});

test('las fichas antiguas solo llevan sus propias etiquetas', () => {
    const now = new Date('2026-11-17T10:00:00Z');
    const old = { id_partido: 101, slug: 'real-madrid-vs-atletico-de-madrid-2024-10-05', fecha: '2024-10-05' };
    assert.deepEqual(matchCacheTags(old, now), ['database', 'match-101', 'match-real-madrid-vs-atletico-de-madrid-2024-10-05']);
});

test('las fichas abiertas se vacían con cualquier carga de datos de partido', () => {
    const now = new Date('2026-11-17T10:00:00Z');
    const recent = matchCacheTags({ id_partido: 103, slug: 'real-madrid-vs-atletico-de-madrid-2026-11-15', fecha: '2026-11-15' }, now);
    for (const tag of ['database', 'match-103', 'matches', 'lineups', 'goals', 'statistics', 'players', 'calendar']) {
        assert.ok(recent.includes(tag), tag);
    }
    assert.ok(matchCacheTags({ id_partido: 104, fecha: '2026-11-29' }, now).includes('matches'), 'partido futuro');
});

test('no genera etiquetas con caracteres que la CDN no admite', () => {
    assert.deepEqual(ownMatchTags({ id_partido: 7, slug: 'a,b c' }), ['database', 'match-7']);
});
