import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('valoraciones y premios se guardan poco tiempo en la CDN en vez de ejecutarse en cada visita', () => {
    const middleware = readFileSync('src/middleware.ts', 'utf8');
    assert.match(middleware, /const SIN_CACHE = \[\/\^\\\/api\\\/\/\];/);
    assert.match(middleware, /const CACHE_VOTOS_PARTIDO_S = 60;/);
    assert.match(middleware, /const CACHE_VOTOS_LISTAS_S = 5 \* 60;/);
    assert.match(readFileSync('astro.config.mjs', 'utf8'), /\/\^\\\/valoraciones\(\?:\\\/\|\$\)\//);
    for (const page of ['src/pages/premios.astro', 'src/pages/valoraciones/index.astro', 'src/pages/valoraciones/[slug].astro']) {
        assert.doesNotMatch(readFileSync(page, 'utf8'), /locals\.currentUser|Astro\.cookies/, page);
    }
});
