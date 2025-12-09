import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../chunks/Layout_CTgb0INN.mjs';
/* empty css                                       */
/* empty css                                  */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Search = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Search;
  const query = Astro2.url.searchParams.get("q") || "";
  let results = [];
  let error = "";
  if (query) {
    try {
      const response = await fetch(
        `${Astro2.url.origin}/api/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        results = data.results || [];
      } else {
        error = "Error al realizar la b\xFAsqueda";
      }
    } catch (e) {
      console.error("Search error:", e);
      error = "Error al realizar la b\xFAsqueda";
    }
  }
  const playerResults = results.filter((r) => r.type === "player");
  const rivalResults = results.filter((r) => r.type === "rival");
  const matchResults = results.filter((r) => r.type === "match");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `B\xFAsqueda: ${query} - Madrid Femenino Xtra`, "data-astro-cid-ipsxrsrh": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="search-page" data-astro-cid-ipsxrsrh> <div class="search-container" data-astro-cid-ipsxrsrh> <h1 class="page-title" data-astro-cid-ipsxrsrh>Resultados de búsqueda</h1> <div class="search-box" data-astro-cid-ipsxrsrh> <form action="/search" method="get" class="search-form" data-astro-cid-ipsxrsrh> <input type="search" name="q"${addAttribute(query, "value")} placeholder="Buscar jugadoras, entrenadores, rivales..." class="search-input" autofocus data-astro-cid-ipsxrsrh> <button type="submit" class="search-button" data-astro-cid-ipsxrsrh>Buscar</button> </form> </div> ${query && renderTemplate`<div class="search-results" data-astro-cid-ipsxrsrh> ${error && renderTemplate`<p class="error-message" data-astro-cid-ipsxrsrh>${error}</p>`} ${!error && results.length === 0 && renderTemplate`<div class="no-results" data-astro-cid-ipsxrsrh> <p data-astro-cid-ipsxrsrh>
No se encontraron resultados para "
<strong data-astro-cid-ipsxrsrh>${query}</strong>"
</p> <p class="suggestion" data-astro-cid-ipsxrsrh>
Intenta con otros términos de búsqueda
</p> </div>`} ${!error && results.length > 0 && renderTemplate`<div class="results-summary" data-astro-cid-ipsxrsrh> <p data-astro-cid-ipsxrsrh>
Se encontraron${" "} <strong data-astro-cid-ipsxrsrh>${results.length}</strong>${" "}
resultado(s) para "<strong data-astro-cid-ipsxrsrh>${query}</strong>"
</p> </div>`} ${playerResults.length > 0 && renderTemplate`<section class="results-section" data-astro-cid-ipsxrsrh> <h2 class="section-title" data-astro-cid-ipsxrsrh>
Jugadoras (${playerResults.length})
</h2> <div class="results-grid" data-astro-cid-ipsxrsrh> ${playerResults.map((result) => renderTemplate`<a${addAttribute(result.url, "href")} class="result-card" data-astro-cid-ipsxrsrh> <h3 class="result-title" data-astro-cid-ipsxrsrh> ${result.title} </h3> <p class="result-subtitle" data-astro-cid-ipsxrsrh> ${result.subtitle} </p> </a>`)} </div> </section>`} ${rivalResults.length > 0 && renderTemplate`<section class="results-section" data-astro-cid-ipsxrsrh> <h2 class="section-title" data-astro-cid-ipsxrsrh>
Rivales (${rivalResults.length})
</h2> <div class="results-grid" data-astro-cid-ipsxrsrh> ${rivalResults.map((result) => renderTemplate`<a${addAttribute(result.url, "href")} class="result-card" data-astro-cid-ipsxrsrh> <h3 class="result-title" data-astro-cid-ipsxrsrh> ${result.title} </h3> <p class="result-subtitle" data-astro-cid-ipsxrsrh> ${result.subtitle} </p> </a>`)} </div> </section>`} ${matchResults.length > 0 && renderTemplate`<section class="results-section" data-astro-cid-ipsxrsrh> <h2 class="section-title" data-astro-cid-ipsxrsrh>
Partidos (${matchResults.length})
</h2> <div class="results-grid" data-astro-cid-ipsxrsrh> ${matchResults.map((result) => renderTemplate`<a${addAttribute(result.url, "href")} class="result-card" data-astro-cid-ipsxrsrh> <h3 class="result-title" data-astro-cid-ipsxrsrh> ${result.title} </h3> <p class="result-subtitle" data-astro-cid-ipsxrsrh> ${result.subtitle} </p> </a>`)} </div> </section>`} </div>`} </div> </div> ` })} `;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/search.astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/search.astro";
const $$url = "/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Search,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
