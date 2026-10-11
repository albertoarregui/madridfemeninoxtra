import test from 'node:test';
import assert from 'node:assert/strict';
import { madridDate, madridClock, isoDays, mondayAt10Madrid, norm } from '../src/lib/newsletter-time';

test('respects Madrid Monday at 10:00 in CEST and CET', () => {
  assert.equal(mondayAt10Madrid('2026-10-12'), '2026-10-12T08:00:00.000Z');
  assert.equal(mondayAt10Madrid('2026-10-26'), '2026-10-26T09:00:00.000Z');
  assert.equal(mondayAt10Madrid('2027-03-29'), '2027-03-29T08:00:00.000Z');
});

test('computes Spanish local dates at UTC calendar boundaries', () => {
  assert.equal(madridDate(new Date('2026-10-11T22:45:00.000Z')), '2026-10-12');
  assert.equal(madridClock(new Date('2026-10-12T08:00:00.000Z')), 10);
  assert.equal(madridClock(new Date('2026-10-26T09:00:00.000Z')), 10);
  assert.equal(isoDays('2026-10-12',-7),'2026-10-05');
  assert.equal(isoDays('2026-10-12',-1),'2026-10-11');
  assert.equal(norm('Crónicas'),'cronicas');
  assert.equal(norm('LA FÁBRICA'),'la fabrica');
});
