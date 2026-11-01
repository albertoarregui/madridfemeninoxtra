import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync('src/pages/valoraciones/[slug].astro', 'utf8');
const card = readFileSync('src/components/RatingsShareCard.astro', 'utf8');

test('compartir valoraciones abre una tarjeta descargable con notas propias y medias', () => {
  assert.match(page, /<RatingsShareCard/);
  assert.match(card, /MIS VALORACIONES/);
  assert.match(card, /MEDIA AFICIÓN/);
  assert.match(card, /DESCARGAR IMAGEN/);
  assert.match(card, /COMPARTIR IMAGEN/);
  assert.match(card, /html2canvas\(card/);
  assert.match(card, /canvas\.toBlob/);
});

test('la captura reutiliza los datos ya renderizados y carga html2canvas solo al generar', () => {
  assert.match(card, /ownScores/);
  assert.match(card, /data-average/);
  assert.match(card, /await import\('html2canvas'\)/);
  assert.doesNotMatch(card, /^\s*import html2canvas/m);
});
