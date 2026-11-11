import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const matchPage = readFileSync("src/pages/partidos/[slug].astro", "utf8");
const matchesPage = readFileSync("src/pages/partidos/index.astro", "utf8");
const playersPage = readFileSync("src/pages/jugadoras/index.astro", "utf8");
const sitemap = readFileSync("src/pages/sitemap.xml.ts", "utf8");

test("las fichas de partido tienen un H1 descriptivo sin alterar el diseño", () => {
    assert.match(matchPage, /<h1 class="section-header">[\s\S]*?<span class="match-page-title">/);
    assert.match(matchPage, /\.match-page-title\s*\{[\s\S]*?clip: rect\(0, 0, 0, 0\)/);
});

test("las entidades visibles de la ficha enlazan a sus páginas", () => {
    assert.match(matchPage, /const rivalHref = `\/rivales\/\$\{slugify\(rivalName\)\}`/);
    assert.match(matchPage, /return playerSlug.*`\/jugadoras\/\$\{playerSlug\}`/);
    assert.match(matchPage, /href=\{`\/arbitras\/\$\{arbitraSlug\}`\}/);
    assert.match(matchPage, /href=\{`\/estadios\/\$\{estadioSlug\}`\}/);
});

test("las islas reciben solo los campos que consumen", () => {
    // La lista de partidos se renderiza en el servidor: no envía datos a ninguna isla.
    assert.match(matchesPage, /<MatchTimeline matches=\{games\} currentSeason=\{currentSeason\} \/>/);
    assert.doesNotMatch(matchesPage, /client:(load|only|visible|idle)/);
    assert.match(playersPage, /const mapPlayers = playersData\.map/);
    assert.match(playersPage, /<PlayerMapWrapper players=\{mapPlayers\}/);
});

test("el sitemap comparte la lectura de partidos y temporadas", () => {
    assert.match(sitemap, /const gamesPromise = fetchGamesDirectly\(\)/);
    assert.equal((sitemap.match(/await gamesPromise/g) || []).length, 2);
});
