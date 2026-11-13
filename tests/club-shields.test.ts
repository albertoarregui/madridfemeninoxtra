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
    assert.equal(resolve('Paris Saint-Germain')?.url, 'https://media.madridfemeninoxtra.com/escudos/psg.webp');
});

test('los nombres alternativos usan el escudo del club en `clubes`', () => {
    const withRivals = createClubShieldResolver({
        PSG: 'https://media.madridfemeninoxtra.com/escudos/psg.webp',
        Wolfsburgo: 'https://media.madridfemeninoxtra.com/escudos/wolfsburgo.webp',
    });
    assert.deepEqual(withRivals('Paris Saint-Germain'), { url: 'https://media.madridfemeninoxtra.com/escudos/psg.webp', known: true });
    assert.deepEqual(withRivals('VfL Wolfsburg'), { url: 'https://media.madridfemeninoxtra.com/escudos/wolfsburgo.webp', known: true });
});

test('las variantes de un club comparten un único archivo de escudo', () => {
    const r = createClubShieldResolver({});
    assert.equal(r('Elche Ilicitano')?.url, r('Elche CF')?.url);
    assert.equal(r('Toluca Femenil')?.url, r('Toluca')?.url);
    assert.equal(r('Bordeaux')?.url, r('Girondins de Bordeaux')?.url);
    assert.equal(r('Categorías inferiores Montpellier')?.url, r('Montpellier')?.url);
    assert.equal(r('Olympique Lyonnais')?.url, r('OL Lyonnes')?.url);
});

test('los escudos subidos con nombre propio se encuentran', () => {
    const r = createClubShieldResolver({});
    assert.equal(r('Guangzhou FC Reserves')?.url, 'https://media.madridfemeninoxtra.com/escudos/guangzhou.webp');
    assert.equal(r('RSC')?.url, 'https://media.madridfemeninoxtra.com/escudos/rsc_internacional_fc.webp');
});
