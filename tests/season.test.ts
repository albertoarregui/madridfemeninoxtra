import assert from 'node:assert/strict';
import test from 'node:test';
import { getCurrentSeason, secondsUntilNextSeason } from '../src/utils/season.ts';

test('cambia de temporada a medianoche del 1 de julio en Madrid', () => {
    const before = new Date('2027-06-30T21:59:59.000Z');
    const boundary = new Date('2027-06-30T22:00:00.000Z');

    assert.equal(getCurrentSeason(before), '2026/27');
    assert.equal(secondsUntilNextSeason(before), 1);
    assert.equal(secondsUntilNextSeason(new Date('2027-06-30T21:59:59.999Z')), 0);
    assert.equal(getCurrentSeason(boundary), '2027/28');
    assert.ok(secondsUntilNextSeason(boundary) > 300 * 24 * 60 * 60);
});
