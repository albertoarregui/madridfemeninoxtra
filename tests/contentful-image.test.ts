import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { contentfulImageUrl } from '../src/lib/contentful-image';

test('las fotos de Contentful se piden reducidas y en WebP', () => {
    assert.equal(
        contentfulImageUrl('//images.ctfassets.net/sp/id/h/foto.jpg', { width: 520, height: 340 }),
        'https://images.ctfassets.net/sp/id/h/foto.jpg?fm=webp&w=520&h=340&q=72&fit=fill',
    );
    assert.equal(
        contentfulImageUrl('https://images.ctfassets.net/sp/id/h/foto.jpg', { width: 400, height: 360 }),
        'https://images.ctfassets.net/sp/id/h/foto.jpg?fm=webp&w=400&h=360&q=72&fit=fill',
    );
    assert.equal(contentfulImageUrl('//downloads.ctfassets.net/sp/id/h/doc.png', { width: 1, height: 1 }), 'https://downloads.ctfassets.net/sp/id/h/doc.png');
    assert.equal(contentfulImageUrl(undefined, { width: 1, height: 1 }), '/og.png');
});

test('el carrusel y las destacadas de la portada usan la URL reducida y tienen imagen de reserva', () => {
    for (const file of ['src/components/HistoryCarousel.astro', 'src/pages/index.astro']) {
        const source = readFileSync(file, 'utf8');
        assert.match(source, /contentfulImageUrl\(/, file);
        assert.match(source, /onerror="this\.onerror=null;this\.src='\/og\.png'"/, file);
    }
    assert.doesNotMatch(readFileSync('src/components/HistoryCarousel.astro', 'utf8'), /`https:\$\{item\.fields\.featuredImage/);
});
