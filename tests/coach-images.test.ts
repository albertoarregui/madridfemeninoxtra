import assert from 'node:assert/strict';
import test from 'node:test';
import { versionCoachImageUrl } from '../src/lib/coach-image';

test('versiona las fotos de entrenadores alojadas en Cloudflare', () => {
    const url = versionCoachImageUrl(
        'https://media.madridfemeninoxtra.com/entrenadores/pau_quesada.webp',
    );

    assert.match(url, /pau_quesada\.webp\?mfxv=\d+$/);
});

test('cada actualización sustituye la versión anterior de la foto', () => {
    const url = versionCoachImageUrl(
        'https://media.madridfemeninoxtra.com/entrenadores/pau_quesada.webp?mfxv=anterior',
        2026091701,
        true,
    );

    assert.equal(
        url,
        'https://media.madridfemeninoxtra.com/entrenadores/pau_quesada.webp?mfxv=2026091701',
    );
});

test('no modifica imágenes externas ni sus parámetros', () => {
    const url = 'https://images.example.com/coach.webp?size=large';
    assert.equal(versionCoachImageUrl(url), url);
});
