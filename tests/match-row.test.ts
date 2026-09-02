import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMatchId } from '../src/lib/match-row';

test('conserva el ID del partido cuando no existen estadísticas globales', () => {
    assert.equal(resolveMatchId({ partido_id: 307, id_partido: null }), 307);
});

test('mantiene compatibilidad con filas que no usan el alias', () => {
    assert.equal(resolveMatchId({ id_partido: 312 }), 312);
});
