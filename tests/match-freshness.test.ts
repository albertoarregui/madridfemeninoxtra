import assert from 'node:assert/strict';
import test from 'node:test';
import { isFreshMatchPath, isFreshMatchSlug } from '../src/lib/match-freshness';

test('mantiene fresca la ficha durante la carga de datos del partido', () => {
    const slug = 'real-madrid-vs-ajax-2026-09-02';

    assert.equal(isFreshMatchSlug(slug, new Date('2026-09-01T20:00:00Z')), true);
    assert.equal(isFreshMatchSlug(slug, new Date('2026-09-03T23:59:59Z')), true);
    assert.equal(isFreshMatchSlug(slug, new Date('2026-09-05T00:00:00Z')), false);
});

test('solo desactiva la CDN en rutas de fichas recientes', () => {
    const now = new Date('2026-09-03T00:30:00Z');

    assert.equal(isFreshMatchPath('/partidos/real-madrid-vs-ajax-2026-09-02', now), true);
    assert.equal(isFreshMatchPath('/partidos/real-madrid-vs-atletico-2026-08-30', now), false);
    assert.equal(isFreshMatchPath('/partidos', now), false);
});
