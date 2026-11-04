import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("las herramientas avanzadas incluyen contexto editorial y breadcrumbs", () => {
    for (const path of [
        "src/pages/estadisticas/avanzadas.astro",
        "src/pages/comparador.astro",
        "src/pages/estadisticas/buscador-avanzado-jugadoras.astro",
        "src/pages/estadisticas/buscador-avanzado-partidos.astro",
        "src/pages/estadisticas/buscador-avanzado-temporadas.astro",
    ]) {
        const page = read(path);
        assert.match(page, /<BreadcrumbTrail/);
        assert.match(page, /<EditorialInfoCards/);
        assert.match(page, /introduction=/);
        assert.match(page, /utility=/);
        assert.match(page, /methodology=/);
    }
});

test("Valoraciones es un acceso principal situado después de Hub", () => {
    const header = read("src/components/Header.astro");
    const hubEnd = header.indexOf('id="submenu-hub"');
    const ratings = header.indexOf('href={href("/valoraciones")}');
    const fabrica = header.indexOf('href={href("/la-fabrica")}');
    assert.ok(hubEnd >= 0 && ratings > hubEnd && fabrica > ratings);
    assert.doesNotMatch(header.match(/id="submenu-actualidad"[\s\S]*?<\/ul>/)?.[0] || "", /valoraciones/);
    assert.match(header, /<li><a href=\{href\("\/premios"\)\}><span>\{t\.awards\}<\/span><\/a><\/li>/);
});

test("las fotogalerías muestran descripciones y reservan las dimensiones de portada", () => {
    const index = read("src/pages/fotogalerias/index.astro");
    const detail = read("src/pages/fotogalerias/[slug].astro");
    const archive = read("src/components/GalleryArchive.tsx");
    assert.match(index, /getV\("description"\)/);
    assert.match(detail, /gal-description-card/);
    assert.match(detail, /<p>\{albumData\.description\}<\/p>/);
    assert.match(detail, /description=\{`Explora las fotos de \$\{albumData\.title\} del Real Madrid Femenino\.`\}/);
    assert.match(archive, /className="gallery-description"/);
    assert.match(archive, /width=\{album\.coverWidth\}/);
    assert.match(archive, /height=\{album\.coverHeight\}/);
});

test("los metatítulos conservan la redacción editorial anterior", () => {
    assert.match(read("src/pages/noticias/[slug].astro"), /title=\{`\$\{title\} \| Madrid Femenino Xtra`\}/);
    assert.match(read("src/pages/partidos/[slug].astro"), /\| Madrid Femenino Xtra/);
    assert.match(read("src/pages/calendario.astro"), /Partidos del Real Madrid Femenino/);
});
