import assert from 'node:assert/strict';
import test from 'node:test';
import { cached, invalidarTags } from '../src/utils/cache';

test('reutiliza una lectura y vuelve al origen justo después de invalidarla', async () => {
    const key = `test-cache-${Date.now()}-${Math.random()}`;
    const tag = `test-tag-${Date.now()}-${Math.random()}`;
    let originReads = 0;
    const read = () => cached(key, 60_000, async () => ({ value: ++originReads }), { tags: [tag] });

    assert.deepEqual(await read(), { value: 1 });
    assert.deepEqual(await read(), { value: 1 });
    assert.equal(originReads, 1);

    await invalidarTags([tag]);

    assert.deepEqual(await read(), { value: 2 });
    assert.equal(originReads, 2);
});

test('agrupa fallos simultáneos para no duplicar consultas al origen', async () => {
    const key = `test-concurrent-${Date.now()}-${Math.random()}`;
    let originReads = 0;
    const read = () => cached(key, 60_000, async () => {
        originReads += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return originReads;
    }, { tags: ['test-concurrent'] });

    assert.deepEqual(await Promise.all([read(), read(), read()]), [1, 1, 1]);
    assert.equal(originReads, 1);
});

test('una lectura anterior no repuebla la caché después de una escritura', async () => {
    const key = `test-race-${Date.now()}-${Math.random()}`;
    const tag = `test-race-tag-${Date.now()}-${Math.random()}`;
    let releaseFirst!: () => void;
    let markStarted!: () => void;
    const firstStarted = new Promise<void>((resolve) => { markStarted = resolve; });
    const release = new Promise<void>((resolve) => { releaseFirst = resolve; });

    const first = cached(key, 60_000, async () => {
        markStarted();
        await release;
        return 'anterior';
    }, { tags: [tag] });

    await firstStarted;
    await invalidarTags([tag]);
    releaseFirst();
    assert.equal(await first, 'anterior');

    let freshReads = 0;
    const fresh = await cached(key, 60_000, async () => {
        freshReads += 1;
        return 'nuevo';
    }, { tags: [tag] });

    assert.equal(fresh, 'nuevo');
    assert.equal(freshReads, 1);
});
