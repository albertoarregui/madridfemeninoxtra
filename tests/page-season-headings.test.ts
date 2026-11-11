import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const plantilla = readFileSync('src/pages/plantilla.astro', 'utf8');
const squad = readFileSync('src/sections/Squad.astro', 'utf8');
const jugadoras = readFileSync('src/pages/jugadoras/index.astro', 'utf8');
const entrenadores = readFileSync('src/pages/entrenadores/index.astro', 'utf8');
const arbitras = readFileSync('src/pages/arbitras/index.astro', 'utf8');
const partidos = readFileSync('src/pages/partidos/index.astro', 'utf8');
const rivales = readFileSync('src/pages/rivales/index.astro', 'utf8');
const estadios = readFileSync('src/pages/estadios/index.astro', 'utf8');

test('plantilla y partidos muestran la temporada actual', () => {
    assert.match(plantilla, /<h1 class="landing-title">PLANTILLA \{season\}<\/h1>/);
    assert.match(
        plantilla,
        /Jugadoras, dorsales y posiciones del Real Madrid Femenino de la temporada \{season\}/,
    );
    assert.match(partidos, /Calendario, horarios y resultados de la temporada \{currentSeason\}/);
});

test('plantilla no duplica el índice textual de jugadoras y dorsales', () => {
    assert.doesNotMatch(squad, /squad-index/);
    assert.doesNotMatch(squad, /Jugadoras y dorsales del Real Madrid Femenino/);
});

test('los archivos históricos usan títulos breves y coherentes', () => {
    assert.match(jugadoras, /<h1 class="landing-title">JUGADORAS<\/h1>/);
    assert.match(entrenadores, /<h1 class="landing-title">ENTRENADORES<\/h1>/);
    assert.match(arbitras, /<h1 class="landing-title">ÁRBITRAS<\/h1>/);
    assert.match(partidos, /<h1 class="landing-title">PARTIDOS<\/h1>/);
    assert.match(rivales, /<h1 class="landing-title">RIVALES<\/h1>/);
    assert.match(estadios, /<h1 class="landing-title">ESTADIOS<\/h1>/);
    assert.match(
        partidos,
        /Historial de partidos disputados por el Real Madrid Femenino a lo largo de su historia, por temporada y competición/,
    );
});

test('el mapa de estadios aparece después del desglose por temporada', () => {
    assert.ok(estadios.indexOf('<MatchStatsDashboard') < estadios.indexOf('<MatchMapWrapper'));
    assert.ok(estadios.indexOf('<MatchMapWrapper') < estadios.indexOf('<StadiumsTable'));
    assert.doesNotMatch(estadios, /stadiums-overview__grid/);
});

test('plantilla filtra por temporada y resume la plantilla con datos cacheados', () => {
    assert.match(plantilla, /searchParams\.get\("temporada"\)/);
    assert.match(plantilla, /seasons\.includes\(requestedSeason\) \? requestedSeason : currentSeason/);
    for (const label of ['Jugadoras', 'Edad media', 'Estatura media', 'Peso medio']) assert.ok(squad.includes(`<dt>${label}</dt>`), label);
    // Tarjeta de entrenador aparte, enlazada a su ficha.
    assert.match(squad, /class="coach-card" href=\{`\/entrenadores\/\$\{coach\.slug\}`\}/);
    assert.match(squad, /\.coach-card:hover/);
    assert.match(squad, /data-squad-season/);
    // Bajo cada miniatura: partidos, goles y asistencias oficiales; porteras, solo porterías a cero.
    assert.match(squad, /row\.competicion === "Amistoso"/);
    assert.match(squad, /class="thumb-stats"/);
    // Porteras: partidos, paradas (de los partidos en los que fue la portera principal) y porterías a cero.
    assert.match(squad, /label: "PAR"/);
    assert.match(squad, /savesByPlayer/);
    assert.match(squad, /class="thumbnail-flag"/);
    // Descarga en PNG con html2canvas cargado solo al pulsar.
    assert.match(squad, /data-squad-download/);
    assert.match(squad, /await import\("html2canvas"\)/);
    assert.doesNotMatch(squad, /id="player-apps"/);
    assert.doesNotMatch(squad, /client\.execute/);
});
