import { e as createComponent, m as maybeRenderHead, r as renderTemplate, k as renderComponent } from '../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../chunks/Layout_CTgb0INN.mjs';
/* empty css                                    */
/* empty css                                       */
export { renderers } from '../renderers.mjs';

const $$Form = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="content-container" data-astro-cid-346426y5> <form class="content-container" id="contactForm" data-astro-cid-346426y5> <div class="form-group" data-astro-cid-346426y5> <label for="nombre" data-astro-cid-346426y5>Nombre *</label> <input type="text" id="nombre" name="nombre" required data-astro-cid-346426y5> </div> <div class="form-group" data-astro-cid-346426y5> <label for="email" data-astro-cid-346426y5>Email *</label> <input type="email" id="email" name="email" required data-astro-cid-346426y5> </div> <div class="form-group" data-astro-cid-346426y5> <label for="asunto" data-astro-cid-346426y5>Asunto *</label> <input type="text" id="asunto" name="asunto" required data-astro-cid-346426y5> </div> <div class="form-group" data-astro-cid-346426y5> <label for="mensaje" data-astro-cid-346426y5>Mensaje *</label> <textarea id="mensaje" name="mensaje" rows="6" required data-astro-cid-346426y5></textarea> </div> <button type="submit" class="btn-submit" data-astro-cid-346426y5> <span data-astro-cid-346426y5>Enviar Mensaje</span> </button> <p class="form-notice" data-astro-cid-346426y5>* Campos obligatorios</p> </form> </div> `;
}, "C:/Users/PC/madridfemeninoxtra/src/components/Form.astro", void 0);

const $$Contacto = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Contacto | Madrid Femenino Xtra", "description": "Tu fuente 100% dedicada al Real Madrid Femenino. Consulta todas las noticias, resultados, clasificaci\xF3n, calendario y estad\xEDsticas en un solo lugar. \xA1Entra y no te pierdas nada de la actualidad del equipo!", "data-astro-cid-2mxdoeuz": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="contacto-container" data-astro-cid-2mxdoeuz> <section data-astro-cid-2mxdoeuz> <h1 class="page-title" data-astro-cid-2mxdoeuz>CONECTA CON NOSOTROS</h1> <h2 class="content-h2-center" data-astro-cid-2mxdoeuz>
Envíanos tus preguntas, sugerencias o colaboraciones.
</h2> </section> <div class="email-info-box" data-astro-cid-2mxdoeuz> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-2mxdoeuz> <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" data-astro-cid-2mxdoeuz></path> <polyline points="22,6 12,13 2,6" data-astro-cid-2mxdoeuz></polyline> </svg> <section data-astro-cid-2mxdoeuz> <h3 data-astro-cid-2mxdoeuz>Email</h3> <a href="mailto:contacto@madridfemeninoxtra.com" data-astro-cid-2mxdoeuz>contacto@madridfemeninoxtra.com</a> </section> </div> ${renderComponent($$result2, "Form", $$Form, { "data-astro-cid-2mxdoeuz": true })} </main> ` })} `;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/contacto.astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/contacto.astro";
const $$url = "/contacto";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Contacto,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
