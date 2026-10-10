import assert from 'node:assert/strict';
import test from 'node:test';
import { readCacheTtlMs } from '../src/db/client';
import { tableCacheTag } from '../src/lib/db-cache-tags';

test('los datos deportivos dinámicos se mantienen diez minutos salvo invalidación', () => {
    assert.equal(readCacheTtlMs([tableCacheTag('partidos')]), 10 * 60 * 1000);
    assert.equal(readCacheTtlMs([tableCacheTag('goles_y_asistencias')]), 10 * 60 * 1000);
    assert.equal(readCacheTtlMs([tableCacheTag('estadisticas_partidos')]), 10 * 60 * 1000);
    assert.equal(readCacheTtlMs([tableCacheTag('mvp')]), 10 * 60 * 1000);
});

test('los catálogos estáticos conservan la caché larga', () => {
    assert.equal(readCacheTtlMs([tableCacheTag('clubes')]), 30 * 24 * 60 * 60 * 1000);
    assert.equal(readCacheTtlMs([tableCacheTag('estadios')]), 30 * 24 * 60 * 60 * 1000);
});

test('una consulta mixta usa la caducidad del dato dinámico', () => {
    assert.equal(
        readCacheTtlMs([tableCacheTag('clubes'), tableCacheTag('partidos')]),
        10 * 60 * 1000,
    );
});
