import { e as createComponent, s as spreadAttributes, u as unescapeHTML, r as renderTemplate, m as maybeRenderHead, h as addAttribute, k as renderComponent, o as renderScript, f as createAstro, x as renderSlot, y as renderHead } from './astro/server_Cpt8RX-b.mjs';
/* empty css                               */

function createSvgComponent({ meta, attributes, children }) {
  const Component = createComponent((_, props) => {
    const normalizedProps = normalizeProps(attributes, props);
    return renderTemplate`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
  });
  Object.defineProperty(Component, "toJSON", {
    value: () => meta,
    enumerable: false
  });
  return Object.assign(Component, meta);
}
const ATTRS_TO_DROP = ["xmlns", "xmlns:xlink", "version"];
const DEFAULT_ATTRS = {};
function dropAttributes(attributes) {
  for (const attr of ATTRS_TO_DROP) {
    delete attributes[attr];
  }
  return attributes;
}
function normalizeProps(attributes, props) {
  return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

const X = createSvgComponent({"meta":{"src":"/_astro/x.BGXxVvip.svg","width":16,"height":16,"format":"svg"},"attributes":{"width":"1em","height":"1em","viewBox":"0 0 24 24"},"children":"<title xmlns=\"\">x-solid</title><path fill=\"currentColor\" d=\"M13.795 10.533L20.68 2h-3.073l-5.255 6.517L7.69 2H1l7.806 10.91L1.47 22h3.074l5.705-7.07L15.31 22H22zm-2.38 2.95L9.97 11.464L4.36 3.627h2.31l4.528 6.317l1.443 2.02l6.018 8.409h-2.31z\" />"});

const Instagram = createSvgComponent({"meta":{"src":"/_astro/instagram.DZvzzqDL.svg","width":16,"height":16,"format":"svg"},"attributes":{"width":"1em","height":"1em","viewBox":"0 0 24 24"},"children":"<title xmlns=\"\">instagram</title><path fill=\"currentColor\" d=\"M11.999 7.377a4.623 4.623 0 1 0 0 9.248a4.623 4.623 0 0 0 0-9.248m0 7.627a3.004 3.004 0 1 1 0-6.008a3.004 3.004 0 0 1 0 6.008\" /><circle cx=\"16.806\" cy=\"7.207\" r=\"1.078\" fill=\"currentColor\" /><path fill=\"currentColor\" d=\"M20.533 6.111A4.6 4.6 0 0 0 17.9 3.479a6.6 6.6 0 0 0-2.186-.42c-.963-.042-1.268-.054-3.71-.054s-2.755 0-3.71.054a6.6 6.6 0 0 0-2.184.42a4.6 4.6 0 0 0-2.633 2.632a6.6 6.6 0 0 0-.419 2.186c-.043.962-.056 1.267-.056 3.71s0 2.753.056 3.71c.015.748.156 1.486.419 2.187a4.6 4.6 0 0 0 2.634 2.632a6.6 6.6 0 0 0 2.185.45c.963.042 1.268.055 3.71.055s2.755 0 3.71-.055a6.6 6.6 0 0 0 2.186-.419a4.6 4.6 0 0 0 2.633-2.633c.263-.7.404-1.438.419-2.186c.043-.962.056-1.267.056-3.71s0-2.753-.056-3.71a6.6 6.6 0 0 0-.421-2.217m-1.218 9.532a5 5 0 0 1-.311 1.688a3 3 0 0 1-1.712 1.711a5 5 0 0 1-1.67.311c-.95.044-1.218.055-3.654.055c-2.438 0-2.687 0-3.655-.055a5 5 0 0 1-1.669-.311a3 3 0 0 1-1.719-1.711a5.1 5.1 0 0 1-.311-1.669c-.043-.95-.053-1.218-.053-3.654s0-2.686.053-3.655a5 5 0 0 1 .311-1.687c.305-.789.93-1.41 1.719-1.712a5 5 0 0 1 1.669-.311c.951-.043 1.218-.055 3.655-.055s2.687 0 3.654.055a5 5 0 0 1 1.67.311a3 3 0 0 1 1.712 1.712a5.1 5.1 0 0 1 .311 1.669c.043.951.054 1.218.054 3.655s0 2.698-.043 3.654z\" />"});

const TikTok = createSvgComponent({"meta":{"src":"/_astro/tiktok.5qhyDnIq.svg","width":16,"height":16,"format":"svg"},"attributes":{"width":"1em","height":"1em","viewBox":"0 0 24 24"},"children":"<title xmlns=\"\">tiktok</title><path fill=\"currentColor\" d=\"M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74a2.89 2.89 0 0 1 2.31-4.64a3 3 0 0 1 .88.13V9.4a7 7 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a5 5 0 0 1-1-.1z\" />"});

const Youtube = createSvgComponent({"meta":{"src":"/_astro/youtube.C6d2u9F4.svg","width":16,"height":16,"format":"svg"},"attributes":{"width":"1em","height":"1em","viewBox":"0 0 24 24"},"children":"<title xmlns=\"\">youtube</title><path fill=\"currentColor\" d=\"M21.593 7.203a2.5 2.5 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765c1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.52 2.52 0 0 0 1.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831M9.996 15.005l.005-6l5.207 3.005z\" />"});

const Facebook = createSvgComponent({"meta":{"src":"/_astro/facebook.WTCl2RaQ.svg","width":16,"height":16,"format":"svg"},"attributes":{"width":"1em","height":"1em","viewBox":"0 0 24 24"},"children":"<title xmlns=\"\">facebook</title><path fill=\"currentColor\" d=\"M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22 22 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202z\" />"});

const Logo = new Proxy({"src":"/_astro/logo.9duZU3g_.png","width":400,"height":400,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/logo.png";
							}
							
							return target[name];
						}
					});

const $$Header = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<header class="header" data-astro-cid-3ef6ksr2> <div class="logo" data-astro-cid-3ef6ksr2> <a href="/" data-astro-cid-3ef6ksr2> <img${addAttribute(Logo.src, "src")} alt="Madrid Femenino Xtra" width="60" height="auto" data-astro-cid-3ef6ksr2> </a> </div> <nav id="main-nav" class="main-nav" data-astro-cid-3ef6ksr2> <ul class="nav-list" data-astro-cid-3ef6ksr2> <li data-astro-cid-3ef6ksr2><a href="/" data-astro-cid-3ef6ksr2>Inicio</a></li> <li data-astro-cid-3ef6ksr2><a href="/noticias" data-astro-cid-3ef6ksr2>Noticias</a></li> <li data-astro-cid-3ef6ksr2><a href="/plantilla" data-astro-cid-3ef6ksr2>Plantilla</a></li> <li class="has-submenu" data-astro-cid-3ef6ksr2> <div class="submenu-header" data-astro-cid-3ef6ksr2> <a href="#" aria-expanded="false" aria-controls="submenu-estadisticas" data-astro-cid-3ef6ksr2>Estadísticas</a> <button class="submenu-toggle" aria-expanded="false" aria-controls="submenu-estadisticas" data-astro-cid-3ef6ksr2>▼</button> </div> <ul class="submenu" id="submenu-estadisticas" data-astro-cid-3ef6ksr2> <li data-astro-cid-3ef6ksr2><a href="/jugadoras" data-astro-cid-3ef6ksr2>Jugadoras</a></li> <li data-astro-cid-3ef6ksr2> <a href="/entrenadores" data-astro-cid-3ef6ksr2>Entrenadores</a> </li> <li data-astro-cid-3ef6ksr2><a href="/partidos" data-astro-cid-3ef6ksr2>Partidos</a></li> <li data-astro-cid-3ef6ksr2><a href="/rivales" data-astro-cid-3ef6ksr2>Rivales</a></li> <li data-astro-cid-3ef6ksr2><a href="/rankings" data-astro-cid-3ef6ksr2>Rankings</a></li> </ul> </li> <li data-astro-cid-3ef6ksr2><a href="/sobre-nosotros" data-astro-cid-3ef6ksr2>Sobre Nosotros</a></li> <li data-astro-cid-3ef6ksr2><a href="/contacto" data-astro-cid-3ef6ksr2>Contacto</a></li> </ul> </nav> <div class="social-icons desktop-social-icons" data-astro-cid-3ef6ksr2> <a href="https://x.com/madridfemxtra" target="_blank" data-astro-cid-3ef6ksr2>${renderComponent($$result, "X", X, { "data-astro-cid-3ef6ksr2": true })}</a> <a href="https://instagram.com/madridfemxtra" target="_blank" rel="noopener noreferrer" data-astro-cid-3ef6ksr2>${renderComponent($$result, "Instagram", Instagram, { "data-astro-cid-3ef6ksr2": true })}</a> <a href="https://tiktok.com/@madridfemeninoxtra" target="_blank" rel="noopener noreferrer" data-astro-cid-3ef6ksr2>${renderComponent($$result, "TikTok", TikTok, { "data-astro-cid-3ef6ksr2": true })}</a> <a href="https://www.youtube.com/@madridfemxtra" target="_blank" rel="noopener noreferrer" data-astro-cid-3ef6ksr2>${renderComponent($$result, "Youtube", Youtube, { "data-astro-cid-3ef6ksr2": true })}</a> <a href="https://www.facebook.com/madridfemxtra" target="_blank" rel="noopener noreferrer" data-astro-cid-3ef6ksr2>${renderComponent($$result, "Facebook", Facebook, { "data-astro-cid-3ef6ksr2": true })}</a> </div> <button class="menu-toggle" id="menu-toggle" aria-controls="main-nav" aria-expanded="false" data-astro-cid-3ef6ksr2> <span class="line" data-astro-cid-3ef6ksr2></span> <span class="line" data-astro-cid-3ef6ksr2></span> <span class="line" data-astro-cid-3ef6ksr2></span> </button> </header> ${renderScript($$result, "C:/Users/PC/madridfemeninoxtra/src/components/Header.astro?astro&type=script&index=0&lang.ts")} `;
}, "C:/Users/PC/madridfemeninoxtra/src/components/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="footer-container" data-astro-cid-sz7xmlte> <div class="footer-content-wrapper" data-astro-cid-sz7xmlte> <div class="footer-brand" data-astro-cid-sz7xmlte> <h3 data-astro-cid-sz7xmlte>Madrid Femenino Xtra</h3> <p data-astro-cid-sz7xmlte>
Tu fuente 100% dedicada al Real Madrid Femenino. Consulta todas
                las noticias, resultados, clasificación, calendario y
                estadísticas en un solo lugar. ¡Entra y no te pierdas nada de la
                actualidad del equipo!
</p> </div> <div class="footer-links" data-astro-cid-sz7xmlte> <h4 data-astro-cid-sz7xmlte>Menú</h4> <ul data-astro-cid-sz7xmlte> <li data-astro-cid-sz7xmlte><a href="/" data-astro-cid-sz7xmlte>Inicio</a></li> <li data-astro-cid-sz7xmlte><a href="/noticias" data-astro-cid-sz7xmlte>Noticias</a></li> <li data-astro-cid-sz7xmlte><a href="/plantilla" data-astro-cid-sz7xmlte>Plantilla</a></li> <li data-astro-cid-sz7xmlte><a href="/sobre-nosotros" data-astro-cid-sz7xmlte>Sobre Nosotros</a></li> </ul> </div> <div class="footer-links" data-astro-cid-sz7xmlte> <h4 data-astro-cid-sz7xmlte>Enlaces Rápidos</h4> <ul data-astro-cid-sz7xmlte> <li data-astro-cid-sz7xmlte><a href="/aviso-legal" data-astro-cid-sz7xmlte>Aviso Legal</a></li> <li data-astro-cid-sz7xmlte> <a href="/terminos-condiciones" data-astro-cid-sz7xmlte>Términos y condiciones</a> </li> <li data-astro-cid-sz7xmlte> <a href="/politica-privacidad" data-astro-cid-sz7xmlte>Política de privacidad</a> </li> <li data-astro-cid-sz7xmlte><a href="/politica-cookies" data-astro-cid-sz7xmlte>Política de cookies</a></li> </ul> </div> <div class="footer-social" data-astro-cid-sz7xmlte> <h4 data-astro-cid-sz7xmlte>Síguenos</h4> <div class="social-icons-group" data-astro-cid-sz7xmlte> <a href="https://x.com/madridfemxtra" target="_blank" class="social-icon" aria-label="X (Twitter)" data-astro-cid-sz7xmlte> ${renderComponent($$result, "X", X, { "data-astro-cid-sz7xmlte": true })} </a> <a href="https://instagram.com/madridfemxtra" target="_blank" class="social-icon" aria-label="Instagram" data-astro-cid-sz7xmlte> ${renderComponent($$result, "Instagram", Instagram, { "data-astro-cid-sz7xmlte": true })} </a> <a href="https://tiktok.com/@madridfemeninoxtra" target="_blank" class="social-icon" aria-label="TikTok" data-astro-cid-sz7xmlte> ${renderComponent($$result, "TikTok", TikTok, { "data-astro-cid-sz7xmlte": true })} </a> <a href="https://www.youtube.com/@madridfemxtra" target="_blank" class="social-icon" aria-label="YouTube" data-astro-cid-sz7xmlte> ${renderComponent($$result, "Youtube", Youtube, { "data-astro-cid-sz7xmlte": true })} </a> <a href="https://www.facebook.com/madridfemxtra" target="_blank" class="social-icon" aria-label="Facebook" data-astro-cid-sz7xmlte> ${renderComponent($$result, "Facebook", Facebook, { "data-astro-cid-sz7xmlte": true })} </a> </div> </div> </div> <div class="footer-bottom" data-astro-cid-sz7xmlte> <p data-astro-cid-sz7xmlte>
&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Madrid Femenino Xtra. Todos los derechos
            reservados.
</p> </div> </footer> `;
}, "C:/Users/PC/madridfemeninoxtra/src/components/Footer.astro", void 0);

const $$ScrollToTop = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<button id="scroll-to-top" aria-label="Volver arriba" class="scroll-to-top" data-astro-cid-73562bqz> <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-up" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-73562bqz> <path stroke="none" d="M0 0h24v24H0z" fill="none" data-astro-cid-73562bqz></path> <path d="M12 5l0 14" data-astro-cid-73562bqz></path> <path d="M18 11l-6 -6" data-astro-cid-73562bqz></path> <path d="M6 11l6 -6" data-astro-cid-73562bqz></path> </svg> </button> ${renderScript($$result, "C:/Users/PC/madridfemeninoxtra/src/components/ScrollToTop.astro?astro&type=script&index=0&lang.ts")} `;
}, "C:/Users/PC/madridfemeninoxtra/src/components/ScrollToTop.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title = "Noticias, actualidad y estad\xEDsticas del Real Madrid femenino | Madrid Femenino Xtra",
    description = "Tu fuente 100% dedicada al Real Madrid Femenino. Consulta todas las noticias, resultados, clasificaci\xF3n, calendario y estad\xEDsticas en un solo lugar. \xA1Entra y no te pierdas nada de la actualidad del equipo!"
  } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>', '</title><link rel="icon" type="image/png" href="/favicon.png"><meta name="description"', '><meta property="og:url" content="https://www.madridfemeninoxtra.com"><meta property="og:type" content="website"><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image" content="https://www.madridfemeninoxtra.com/og.png"><meta property="og:locale" content="es_ES"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@madridfemxtra"><meta name="twitter:title"', '><meta name="twitter:description"', '><!-- Google AdSense --><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3753331336777901" crossorigin="anonymous"><\/script>', "</head> <body> ", ' <div class="page-wrapper"> ', " </div> ", " ", " </body></html>"])), title, addAttribute(description, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(title, "content"), addAttribute(description, "content"), renderHead(), renderComponent($$result, "Header", $$Header, {}), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, {}), renderComponent($$result, "ScrollToTop", $$ScrollToTop, {}));
}, "C:/Users/PC/madridfemeninoxtra/src/layouts/Layout.astro", void 0);

export { $$Layout as $, Instagram as I, TikTok as T, X, createSvgComponent as c };
