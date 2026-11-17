import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const page = read("src/pages/partidos/[slug].astro");
const detail = read("src/utils/match-detail.ts");
const fragment = read("src/pages/partidos/[slug]/[seccion].astro");
const ratings = read("src/pages/partidos/[slug]/valoraciones.astro");

test("la ficha solo consulta el partido pedido", () => {
    assert.match(page, /await fetchMatchDetail\(matchSlug\)/);
    for (const forbidden of [/fetchGamesDirectly/, /fetchCalendarFromDb/, /fetchCoachesDirectly/, /fetchPlayerNames/, /ratingSummary/, /fetchMatchAnalysis/]) {
        assert.doesNotMatch(page, forbidden, String(forbidden));
    }
    assert.match(detail, /gamesSql\('p\.fecha = \?'/);
    assert.match(detail, /WHERE p\.id_partido != \?\s+AND p\.fecha < \?/, "el H2H solo lee partidos anteriores contra el rival");
    assert.doesNotMatch(read("src/layouts/Layout.astro"), /<NextMatchCountdown/);
    assert.match(read("src/pages/proximo-partido.astro"), /export const partial = true/);
});

test("las consultas de la ficha van agrupadas en dos peticiones y una sola entrada de caché", () => {
    assert.equal((detail.match(/await readBatch\(client,/g) || []).length, 2);
    assert.match(detail, /cached\(`match-detail:\$\{CACHE_VERSION\}:\$\{slug\}`/);
    assert.match(read("src/db/client.ts"), /client\.batch\([\s\S]*?'read'\)/);
    assert.match(read("src/utils/analisis.ts"), /cached\(`match-analysis:v1:\$\{matchId\}`/);
    assert.match(read("src/utils/fichas.ts"), /cached\(`match-cronica:v1:/);
});

test("análisis, estadísticas, galería y valoraciones se cargan al abrir su pestaña", () => {
    for (const panel of ["estadisticas", "analisis", "galeria", "valoraciones"]) {
        assert.match(page, new RegExp(`data-mx-panel="${panel}" data-mx-src=\\{sectionSrc\\("${panel}"\\)\\}`), panel);
    }
    assert.doesNotMatch(page, /<MatchTeamStats|<MatchAnalysis|<GaleriaGrid|<MatchRatings/);
    assert.match(fragment, /export const partial = true/);
    assert.match(ratings, /export const partial = true/);
    assert.match(read("src/components/match/MatchTabs.astro"), /if \(!panel\.hidden\) void loadPanel\(panel\)/);
    assert.match(read("src/components/match/MatchTabs.astro"), /searchParams\.get\("seccion"\)/);
    assert.doesNotMatch(page, /Astro\.url\.searchParams/, "ISR guarda una sola versión para cualquier ?seccion=");
    for (const component of ["MatchTeamStats", "MatchAnalysis", "GaleriaGrid", "MatchRatings"]) {
        assert.match(page, new RegExp(`import "[./]+components/(?:match/|analisis/)?${component}\\.astro";`), component);
    }
    assert.match(read("src/lib/fragment-loader.ts"), /new CustomEvent\('mfx:fragment'/);
    assert.match(read("src/components/match/MatchTeamStats.astro"), /addEventListener\("mfx:fragment", setupTeamStats\)/);
    assert.match(read("src/components/GaleriaGrid.astro"), /addEventListener\("mfx:fragment", initGalerias\)/);
});

test("todas las fichas entran en la caché persistente (ISR)", () => {
    const config = read("astro.config.mjs");
    assert.doesNotMatch(config, /\/\^\\\/partidos\\\/\[\^\/\]\+\\\/\?\$\//, "las fichas ya no se excluyen de ISR");
    assert.match(config, /\/\^\\\/partidos\\\/\[\^\/\]\+\\\/valoraciones\\\/\?\$\//, "solo la pestaña de votos se queda fuera");
    const middleware = read("src/middleware.ts");
    assert.doesNotMatch(middleware, /isFreshMatchPath|FRESH_MATCH_CACHE_S/);
    assert.match(middleware, /if \(!response\.headers\.has\("Vercel-Cache-Tag"\)\)/);
    assert.match(middleware, /if \(!response\.headers\.has\("Vercel-CDN-Cache-Control"\)\)/);
    assert.match(page, /Astro\.response\.headers\.set\("Vercel-Cache-Tag", cachePolicy\.tags\.join\(","\)\)/);
    assert.match(fragment, /Astro\.response\.headers\.set\("Vercel-Cache-Tag", policy\.tags\.join\(","\)\)/);
});

test("los partidos recientes se invalidan al introducir datos", () => {
    assert.match(read("scripts/sofascore/importar-partido.mjs"), /`match-\$\{P\}`/);
    assert.match(read("scripts/revalidar-cache.mjs"), /--partido/);
    assert.match(read("scripts/galerias/indexar.mjs"), /`match-\$\{id\}`/);
    assert.match(read("src/pages/api/contentful-webhook.ts"), /cacheTags\.match\(matchRef\)/);
    assert.ok(existsSync("src/pages/api/cache/cambios.ts"));
    assert.match(read("src/pages/api/cache/cambios.ts"), /SELECT tabla, version FROM cache_cambios/);
    assert.match(page, /fetch\('\/api\/cache\/cambios'/);
    assert.match(page, /Date\.now\(\) < Number\(page\.dataset\.openUntil\)/);
    assert.doesNotMatch(read("src/layouts/Layout.astro"), /\/api\/cache\/cambios/);
});
