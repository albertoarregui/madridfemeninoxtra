import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("las fichas de entrenador, árbitra, rival y estadio tienen pestañas y selector para comparar", () => {
    const pages = {
        entrenadores: ["info", "estadisticas", "trayectoria", "records"],
        arbitras: ["info", "estadisticas", "graficas", "historial"],
        rivales: ["info", "estadisticas", "graficas", "records", "historial"],
        estadios: ["info", "estadisticas", "graficas", "historial"],
    };
    for (const [tipo, panels] of Object.entries(pages)) {
        const page = read(`src/pages/${tipo}/[slug].astro`);
        assert.match(page, /<ProfileTabs/, tipo);
        assert.match(page, new RegExp(`<EntityPicker tipo="${tipo}"`), tipo);
        for (const panel of panels) assert.match(page, new RegExp(`data-panel="${panel}"`), `${tipo}: ${panel}`);
    }
});

test("el comparador genérico lee cada tipo de una sola consulta en caché", () => {
    const util = read("src/utils/entity-compare.ts");
    assert.match(util, /cached\(`compare:\$\{tipo\}:v1`, DAY/);
    assert.match(read("src/pages/comparador/[tipo].astro"), /fetchCompareEntities\(tipo\)/);
});

test("rankings en un partido: datos en caché diaria y respuesta cacheada en el CDN", () => {
    assert.match(read("src/utils/match-records.ts"), /cached\("rankings:match-records:v1", DAY/);
    assert.match(read("src/pages/api/rankings-partido.ts"), /sMaxage: 86400/);
    assert.match(read("src/components/StatsRankings.tsx"), /En un partido/);
});

test("las árbitras se listan en tarjetas y noticias filtra por categoría y temporada", () => {
    assert.match(read("src/components/RefereesTable.tsx"), /referees-card-grid/);
    assert.doesNotMatch(read("src/components/RefereesTable.tsx"), /<table/);
    const news = read("src/components/NewsArchive.tsx");
    assert.match(news, /className="pt-pills" role="group" aria-label="Categoría"/);
    assert.match(news, /id="news-season"/);
});
