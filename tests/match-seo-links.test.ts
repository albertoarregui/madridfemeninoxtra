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
    assert.match(matchesPage, /<MatchTimeline matches=\{games\} currentSeason=\{currentSeason\} \/>/);
    assert.doesNotMatch(matchesPage, /client:(load|only|visible|idle)/);
    assert.match(playersPage, /const mapPlayers = playersData\.map/);
    assert.match(playersPage, /<PlayerMapWrapper players=\{mapPlayers\}/);
});

test("el sitemap comparte la lectura de partidos y temporadas", () => {
    assert.match(sitemap, /const gamesPromise = fetchGamesDirectly\(\)/);
    assert.equal((sitemap.match(/await gamesPromise/g) || []).length, 2);
});

test("la ficha muestra el historial sin consultas extra y pestañas en cuanto hay datos", () => {
    assert.doesNotMatch(matchPage, /INFORMACIÓN DEL PARTIDO/);
    assert.match(matchPage, /const h2hMatches = allGames/);
    assert.match(matchPage, /String\(g\.fecha \?\? ""\) < String\(game\.fecha \?\? ""\)/);
    assert.doesNotMatch(matchPage, /isWithinOneHour/);
    assert.match(matchPage, /<h3>Enfrentamientos anteriores<\/h3>/);
    assert.match(matchPage, /fetchMatchLineups\(game\.id_partido, matchReadOptions\),/);
    assert.match(matchPage, /const tabbed = lineup\.length > 0 \|\| Boolean\(game\.isPlayed\);/);
    assert.match(matchPage, /<MatchTabs /);
    for (const panel of ["info", "timeline", "alineacion", "estadisticas", "h2h", "valoraciones"]) {
        assert.match(matchPage, new RegExp(`data-mx-panel="${panel}"`));
    }
});
