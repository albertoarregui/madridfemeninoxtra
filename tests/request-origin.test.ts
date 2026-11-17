import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Astro reconoce el dominio real para que las API comparen bien el origen', () => {
    const config = readFileSync('astro.config.mjs', 'utf8');
    assert.match(config, /allowedDomains:/);
    assert.match(config, /hostname: 'www\.madridfemeninoxtra\.com'/);
    assert.match(readFileSync('src/pages/api/noticias/lectura.ts', 'utf8'), /origin !== url\.origin/);
    assert.match(readFileSync('src/pages/api/valoraciones/[id].ts', 'utf8'), /request\.headers\.get\('origin'\)!==url\.origin/);
});
