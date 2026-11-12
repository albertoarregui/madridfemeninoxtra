import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("las herramientas avanzadas incluyen breadcrumbs y no muestran tarjetas de introducción", () => {
    for (const path of [
        "src/pages/estadisticas/avanzadas.astro",
        "src/pages/comparador.astro",
        "src/pages/estadisticas/buscador-avanzado-jugadoras.astro",
        "src/pages/estadisticas/buscador-avanzado-partidos.astro",
        "src/pages/estadisticas/buscador-avanzado-temporadas.astro",
    ]) {
        assert.match(read(path), /<BreadcrumbTrail/);
    }
    // Gráficos, comparador y buscadores ya no muestran las tarjetas de introducción.
    for (const path of [
        "src/pages/estadisticas/avanzadas.astro",
        "src/pages/comparador.astro",
        "src/pages/estadisticas/buscador-avanzado-jugadoras.astro",
        "src/pages/estadisticas/buscador-avanzado-partidos.astro",
        "src/pages/estadisticas/buscador-avanzado-temporadas.astro",
    ]) {
        assert.doesNotMatch(read(path), /<EditorialInfoCards/);
    }
});

test("Valoraciones es un acceso principal situado después de Hub", () => {
    const header = read("src/components/Header.astro");
    const hubEnd = header.indexOf('id="submenu-hub"');
    const ratings = header.indexOf('href="/valoraciones"');
    const fabrica = header.indexOf('href="/la-fabrica"');
    assert.ok(hubEnd >= 0 && ratings > hubEnd && fabrica > ratings);
    assert.doesNotMatch(header.match(/id="submenu-actualidad"[\s\S]*?<\/ul>/)?.[0] || "", /valoraciones/);
    assert.doesNotMatch(header, /href=\{href\("\/premios"\)\}/);
    assert.doesNotMatch(header, /submenu-fabrica/);
});

test("las fotogalerías se retiraron y redirigen a la portada", () => {
    const header = read("src/components/Header.astro");
    assert.doesNotMatch(header, /fotogalerias/);
    assert.match(read("src/pages/fotogalerias/[...slug].astro"), /Astro\.redirect\("\/", 301\)/);
});

test("los metatítulos conservan la redacción editorial anterior", () => {
    assert.match(read("src/pages/noticias/[slug].astro"), /title=\{`\$\{title\} \| Madrid Femenino Xtra`\}/);
    assert.match(read("src/pages/partidos/[slug].astro"), /\| Madrid Femenino Xtra/);
    assert.match(read("src/pages/partidos/index.astro"), /Partidos del Real Madrid Femenino/);
});
