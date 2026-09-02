import assert from 'node:assert/strict';
import test from 'node:test';
import {
    DATABASE_CACHE_TAG,
    isReadOnlySql,
    tagsForReadSql,
    tagsForTables,
    tagsForWriteSql,
    tableCacheTag,
} from '../src/lib/db-cache-tags';

test('clasifica SELECT y CTE de lectura sin confundirlos con escrituras', () => {
    assert.equal(isReadOnlySql('SELECT * FROM partidos'), true);
    assert.equal(isReadOnlySql('WITH p AS (SELECT * FROM partidos) SELECT * FROM p'), true);
    assert.equal(isReadOnlySql('WITH p AS (SELECT 1) UPDATE partidos SET jornada = 2'), false);
    assert.equal(isReadOnlySql('INSERT INTO partidos (id_partido) VALUES (1)'), false);
});

test('las consultas quedan ligadas a todas sus tablas y a la etiqueta de seguridad', () => {
    const tags = tagsForReadSql(`
        SELECT * FROM partidos p
        JOIN alineaciones a ON a.id_partido = p.id_partido
    `);

    assert.ok(tags.includes(tableCacheTag('partidos')));
    assert.ok(tags.includes(tableCacheTag('alineaciones')));
    assert.equal(tags.includes('players'), false);
    assert.ok(tags.includes(DATABASE_CACHE_TAG));
});

test('una escritura conocida invalida solo dominios afectados', () => {
    const tags = tagsForWriteSql('UPDATE partidos SET goles_rm = 2 WHERE id_partido = 314');

    assert.ok(tags.includes('matches'));
    assert.ok(tags.includes('statistics'));
    assert.ok(tags.includes('homepage'));
    assert.ok(tags.includes(tableCacheTag('partidos')));
    assert.equal(tags.includes(DATABASE_CACHE_TAG), false);
});

test('una tabla desconocida activa la invalidación global de seguridad', () => {
    assert.deepEqual(tagsForWriteSql('UPDATE tabla_futura SET valor = 1'), [DATABASE_CACHE_TAG]);
});

test('las tablas externas se traducen a etiquetas sin duplicados', () => {
    const tags = tagsForTables(['partidos', 'goles_y_asistencias']);

    assert.equal(new Set(tags).size, tags.length);
    assert.ok(tags.includes('matches'));
    assert.ok(tags.includes('goals'));
    assert.ok(tags.includes('rankings'));
    assert.ok(tags.includes(tableCacheTag('partidos')));
    assert.ok(tags.includes(tableCacheTag('goles_y_asistencias')));
});
