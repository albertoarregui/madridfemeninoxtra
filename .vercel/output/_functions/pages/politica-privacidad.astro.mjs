import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../chunks/Layout_CTgb0INN.mjs';
/* empty css                                       */
export { renderers } from '../renderers.mjs';

const $$PoliticaPrivacidad = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Pol\xEDtica de Privacidad | Madrid Femenino Xtra", "description": "Tu fuente 100% dedicada al Real Madrid Femenino. Consulta todas las noticias, resultados, clasificaci\xF3n, calendario y estad\xEDsticas en un solo lugar. \xA1Entra y no te pierdas nada de la actualidad del equipo!" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="main-content-wrapper"> <section class="content-container"> <h1 class="page-title">POLÍTICA DE PRIVACIDAD</h1> <p class="content-p">
En <strong>Madrid Femenino Xtra</strong> nos comprometemos a proteger
                tus datos personales y a cumplir con la normativa vigente en materia
                de protección de datos.
</p> <h2 class="section-title">Datos Recogidos</h2> <p class="content-p">
Recogemos únicamente los datos que nos facilitas
                voluntariamente, por ejemplo al enviarnos un mensaje a través
                del formulario de contacto.
</p> <h2 class="section-title">Uso de los Datos</h2> <p class="content-p">
Los datos se usan exclusivamente para responder a tus consultas
                y mejorar el servicio. No se cederán a terceros sin tu
                consentimiento.
</p> <h2 class="section-title">Cookies</h2> <p class="content-p">
Esta web utiliza cookies para mejorar la experiencia del usuario
                y analizar el tráfico. Puedes configurar tu navegador para
                deshabilitarlas si lo deseas.
</p> <h2 class="section-title">Derechos del Usuario</h2> <p class="content-p">
Puedes solicitar acceso, rectificación o eliminación de tus
                datos enviando un correo a contacto@madridfemeninoxtra.com.
</p> </section> </main> ` })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/politica-privacidad.astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/politica-privacidad.astro";
const $$url = "/politica-privacidad";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$PoliticaPrivacidad,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
