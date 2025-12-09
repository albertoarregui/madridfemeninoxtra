import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../chunks/Layout_CTgb0INN.mjs';
/* empty css                                       */
export { renderers } from '../renderers.mjs';

const $$TerminosCondiciones = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "T\xE9rminos y Condiciones | Madrid Femenino Xtra", "description": "Tu fuente 100% dedicada al Real Madrid Femenino. Consulta todas las noticias, resultados, clasificaci\xF3n, calendario y estad\xEDsticas en un solo lugar. \xA1Entra y no te pierdas nada de la actualidad del equipo!" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="main-content-wrapper"> <section class="content-container"> <h1 class="page-title">TÉRMINOS Y CONDICIONES</h1> <p class="content-p">
Al acceder y usar <strong>Madrid Femenino Xtra</strong>, aceptas
                cumplir estos términos y condiciones. Si no estás de acuerdo, no
                uses este sitio web.
</p> <h2 class="section-title">Uso de la Web</h2> <p class="content-p">
El contenido es solo para información y entretenimiento. No se
                permite la reproducción total o parcial sin autorización.
</p> <h2 class="section-title">Servicios</h2> <p class="content-p">
Madrid Femenino Xtra proporciona noticias, análisis y contenido
                sobre el Real Madrid femenino. Nos reservamos el derecho de
                modificar o interrumpir los servicios sin previo aviso.
</p> <h2 class="section-title">Usuarios</h2> <p class="content-p">
Los usuarios se comprometen a no realizar actividades ilegales o
                dañinas en la web, ni a difundir contenido ofensivo o
                inapropiado.
</p> </section> </main> ` })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/terminos-condiciones.astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/terminos-condiciones.astro";
const $$url = "/terminos-condiciones";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$TerminosCondiciones,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
