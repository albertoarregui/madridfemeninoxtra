import assert from 'node:assert/strict';
import test from 'node:test';
import { createClubShieldResolver } from '../src/lib/club-shields';

const resolve = createClubShieldResolver({
    'Real Madrid': 'https://media.madridfemeninoxtra.com/escudos/real_madrid.webp',
    'Sporting de Huelva': 'https://media.madridfemeninoxtra.com/escudos/sporting_de_huelva.webp',
    'Paris FC': 'https://media.madridfemeninoxtra.com/escudos/paris_fc.webp',
    'Levante UD': 'https://media.madridfemeninoxtra.com/escudos/levante_ud.webp',
    'Bayern Múnich': 'https://media.madridfemeninoxtra.com/escudos/bayern_munich.webp',
});

test('las filiales y canteras usan el escudo de su club', () => {
    for (const name of ['Real Madrid B', 'Juvenil Real Madrid', 'Real Madrid Cadete', 'Categorías inferiores Real Madrid']) {
        assert.deepEqual(resolve(name), { url: 'https://media.madridfemeninoxtra.com/escudos/real_madrid.webp', known: true }, name);
    }
    assert.equal(resolve('Levante')?.known, true);
    assert.equal(resolve('Bayern de Múnich')?.known, true);
});

test('no asigna el escudo de otro club con un nombre parecido', () => {
    for (const name of ['Sporting CP', 'Paris Saint-Germain', 'Levante Las Planas']) {
        const shield = resolve(name);
        assert.equal(shield?.known, false, name);
        assert.match(shield!.url, /^https:\/\/media\.madridfemeninoxtra\.com\/escudos\/[a-z0-9_]+\.webp$/);
    }
    assert.equal(resolve('Paris Saint-Germain')?.url, 'https://media.madridfemeninoxtra.com/escudos/paris_saint_germain.webp');
});
