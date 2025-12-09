import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_YyKkGznr.mjs';
import { manifest } from './manifest_BlB9L3Lt.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/clubes.astro.mjs');
const _page2 = () => import('./pages/api/goles_y_asistencias.astro.mjs');
const _page3 = () => import('./pages/api/opciones_filtro.astro.mjs');
const _page4 = () => import('./pages/api/partidos.astro.mjs');
const _page5 = () => import('./pages/api/players.astro.mjs');
const _page6 = () => import('./pages/api/search.astro.mjs');
const _page7 = () => import('./pages/api/wp-noticias.astro.mjs');
const _page8 = () => import('./pages/aviso-legal.astro.mjs');
const _page9 = () => import('./pages/contacto.astro.mjs');
const _page10 = () => import('./pages/entrenadores/_slug_.astro.mjs');
const _page11 = () => import('./pages/entrenadores.astro.mjs');
const _page12 = () => import('./pages/jugadoras/_slug_.astro.mjs');
const _page13 = () => import('./pages/jugadoras.astro.mjs');
const _page14 = () => import('./pages/noticia/_slug_.astro.mjs');
const _page15 = () => import('./pages/noticias/_slug_.astro.mjs');
const _page16 = () => import('./pages/noticias.astro.mjs');
const _page17 = () => import('./pages/partidos/_slug_.astro.mjs');
const _page18 = () => import('./pages/partidos.astro.mjs');
const _page19 = () => import('./pages/plantilla.astro.mjs');
const _page20 = () => import('./pages/politica-cookies.astro.mjs');
const _page21 = () => import('./pages/politica-privacidad.astro.mjs');
const _page22 = () => import('./pages/rankings.astro.mjs');
const _page23 = () => import('./pages/rivales/_slug_.astro.mjs');
const _page24 = () => import('./pages/rivales.astro.mjs');
const _page25 = () => import('./pages/search.astro.mjs');
const _page26 = () => import('./pages/sitemap.xml.astro.mjs');
const _page27 = () => import('./pages/sobre-nosotros.astro.mjs');
const _page28 = () => import('./pages/terminos-condiciones.astro.mjs');
const _page29 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.16.0_@types+node@24.10.1_@vercel+functions@2.2.13_jiti@2.6.1_lightningcss@1.30.2_rollup@4.53.3_typescript@5.9.3/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/clubes.js", _page1],
    ["src/pages/api/goles_y_asistencias.js", _page2],
    ["src/pages/api/opciones_filtro.js", _page3],
    ["src/pages/api/partidos.js", _page4],
    ["src/pages/api/players.js", _page5],
    ["src/pages/api/search.ts", _page6],
    ["src/pages/api/wp-noticias.js", _page7],
    ["src/pages/aviso-legal.astro", _page8],
    ["src/pages/contacto.astro", _page9],
    ["src/pages/entrenadores/[slug].astro", _page10],
    ["src/pages/entrenadores.astro", _page11],
    ["src/pages/jugadoras/[slug].astro", _page12],
    ["src/pages/jugadoras.astro", _page13],
    ["src/pages/noticia/[slug].astro", _page14],
    ["src/pages/noticias/[slug].astro", _page15],
    ["src/pages/noticias/index.astro", _page16],
    ["src/pages/partidos/[slug].astro", _page17],
    ["src/pages/partidos.astro", _page18],
    ["src/pages/plantilla.astro", _page19],
    ["src/pages/politica-cookies.astro", _page20],
    ["src/pages/politica-privacidad.astro", _page21],
    ["src/pages/rankings.astro", _page22],
    ["src/pages/rivales/[slug].astro", _page23],
    ["src/pages/rivales.astro", _page24],
    ["src/pages/search.astro", _page25],
    ["src/pages/sitemap.xml.ts", _page26],
    ["src/pages/sobre-nosotros.astro", _page27],
    ["src/pages/terminos-condiciones.astro", _page28],
    ["src/pages/index.astro", _page29]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "46517929-a727-482c-948b-db813b9242dd",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
