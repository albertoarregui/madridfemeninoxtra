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

test("mercado, jugadora vs rival y con o sin leen datos en caché diaria", () => {
    assert.match(read("src/utils/mercado.ts"), /cached\("mercado:v3"/);
    assert.match(read("src/utils/mercado.ts"), /COALESCE\(cur\.cat, 0\) = 4/);
    assert.doesNotMatch(read("src/pages/mercado.astro"), /Operaciones más caras/);
    assert.match(read("src/utils/player-match-data.ts"), /cached\("comparadores:player-match:v2"/);
    assert.doesNotMatch(read("src/utils/player-match-data.ts"), /\(SELECT COUNT\(\*\) FROM goles_y_asistencias g WHERE g\.id_partido = a\.id_partido/);
    assert.match(read("src/pages/comparador/jugadora-rival.astro"), /fetchPlayerMatchData/);
    assert.match(read("src/pages/comparador/sinergias.astro"), /onPitch/);
    assert.match(read("astro.config.mjs"), /'\/comparador\/con-sin': \{ status: 301, destination: '\/comparador\/sinergias' \}/);
    const header = read("src/components/Header.astro");
    assert.match(header, /href="\/mercado"/);
    assert.match(header, /href="\/comparador\/sinergias"/);
});

test("rankings: estadísticas en fila deslizable y total/x90", () => {
    const rankings = read("src/components/StatsRankings.tsx");
    assert.match(rankings, /<ScrollPills/);
    assert.doesNotMatch(rankings, /id="rk-more"/);
    assert.match(rankings, /PER90_MIN_MINUTES = 450/);
});

test("la comprobación de cambios solo se ejecuta cada 30 s en la CDN y no escribe sin cambios", () => {
    const check = read("src/pages/api/cache/check.ts");
    assert.match(check, /Vercel-CDN-Cache-Control": `max-age=\$\{CDN_SECONDS\}`/);
    assert.match(check, /getPlayersDbClient\(\{ forceRefresh: true \}\)/);
    assert.match(check, /if \(!previous \|\| changed\.length > 0\)/);
    assert.match(read("src/layouts/Layout.astro"), /\/api\/cache\/check/);
});
