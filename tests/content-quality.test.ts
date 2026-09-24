import assert from "node:assert/strict";
import test from "node:test";

import {
    hasMatchMetrics,
    hasMeaningfulValue,
    hasPlayedStats,
    hasSubstantiveHtml,
    isIndexableMatchDetail,
    isIndexableMatchSummary,
    isIndexablePlayerSummary,
} from "../src/lib/content-quality";

test("zero is data, but null and empty strings are not", () => {
    assert.equal(hasMeaningfulValue(0), true);
    assert.equal(hasMeaningfulValue("0"), true);
    assert.equal(hasMeaningfulValue(null), false);
    assert.equal(hasMeaningfulValue("  "), false);
});

test("match metrics require a real advanced-stat value", () => {
    assert.equal(hasMatchMetrics({ amarillas_rm: 2, rojas_rival: 0 }), false);
    assert.equal(hasMatchMetrics({ posesion_rm: null, rm_tiros: "" }), false);
    assert.equal(hasMatchMetrics({ rm_tiros: 0 }), true);
});

test("sitemap only includes played matches with supporting content", () => {
    assert.equal(isIndexableMatchSummary({ slug: "proximo", isPlayed: false }), false);
    assert.equal(isIndexableMatchSummary({ slug: "antiguo", isPlayed: true }), false);
    assert.equal(isIndexableMatchSummary({ slug: "completo", isPlayed: true, once_inicial_url: "https://example.com/xi.webp" }), true);
});

test("detail pages can qualify through editorial or recorded match content", () => {
    const match = { isPlayed: true };
    assert.equal(isIndexableMatchDetail(match, { hasEditorial: false, lineupCount: 0, eventCount: 0 }), false);
    assert.equal(isIndexableMatchDetail(match, { hasEditorial: true, lineupCount: 0, eventCount: 0 }), true);
    assert.equal(isIndexableMatchDetail(match, { hasEditorial: false, lineupCount: 11, eventCount: 0 }), true);
    assert.equal(isIndexableMatchDetail(match, { hasEditorial: false, lineupCount: 0, eventCount: 1 }), true);
});

test("HTML quality checks visible text rather than markup", () => {
    assert.equal(hasSubstantiveHtml("<p>Breve</p>"), false);
    assert.equal(hasSubstantiveHtml(`<p>${"Contenido original ".repeat(15)}</p>`), true);
});

test("summary filters reuse data already present in aggregate reads", () => {
    assert.equal(hasPlayedStats({ stats: { played: 1 } }), true);
    assert.equal(hasPlayedStats({ stats: { played: 0 } }), false);
    assert.equal(isIndexablePlayerSummary({ slug: "ana", nombre: "Ana", posicion: "Defensa", temporadas: ["2025/26"] }), true);
    assert.equal(isIndexablePlayerSummary({ slug: "ana", nombre: "Ana", posicion: "", temporadas: [] }), false);
});
