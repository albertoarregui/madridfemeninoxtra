import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout, X, I as Instagram, T as TikTok } from '../chunks/Layout_CTgb0INN.mjs';
/* empty css                                       */
/* empty css                                          */
export { renderers } from '../renderers.mjs';

const fotoPerfil = new Proxy({"src":"/_astro/foto-perfil.Dh0UtoC4.jpg","width":960,"height":1280,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/foto-perfil.jpg";
							}
							
							return target[name];
						}
					});

const $$SobreNosotros = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sobre Nosotros | Madrid Femenino Xtra", "description": "Tu fuente 100% dedicada al Real Madrid Femenino. Consulta todas las noticias, resultados, clasificaci\xF3n, calendario y estad\xEDsticas en un solo lugar. \xA1Entra y no te pierdas nada de la actualidad del equipo!" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page"> <div class="sobre-nosotros-container"> <section class="proyecto-section"> <h2 class="page-title">EL PROYECTO</h2> <div class="content p"> <p>
Madrid Femenino Xtra nace en 2023 de la necesidad de un medio que
            ofrezca una cobertura exclusiva del día a día del Real Madrid
            femenino. Nuestro objetivo es ser la referencia para todos los
            aficionados madridistas que quieren seguir de cerca la actualidad,
            noticias y estadísticas del equipo.
</p> <p>
Este proyecto no solamente cubre la actualidad del equipo sino que,
            además, trabaja en la elaboración de la mayor base de datos del Real
            Madrid femenino recopilando todos los partidos, resultados,
            jugadoras, rivales, árbitras y estadios.
</p> </div> </section> <section class="equipo-section"> <h2 class="page-title">EQUIPO</h2> <div class="equipo-grid"> <div class="team-card"> <img${addAttribute(fotoPerfil.src, "src")} alt="Alberto Arregui" class="team-avatar"> <h3 class="team-name">Alberto Arregui</h3> <p class="team-role">Founder</p> <div class="team-social"> <a href="https://x.com/madridfemxtra" target="_blank" rel="noopener noreferrer"> ${renderComponent($$result2, "X", X, {})} </a> <a href="https://instagram.com/madridfemxtra" target="_blank" rel="noopener noreferrer"> ${renderComponent($$result2, "Instagram", Instagram, {})} </a> <a href="https://tiktok.com/@madridfemeninoxtra" target="_blank" rel="noopener noreferrer"> ${renderComponent($$result2, "TikTok", TikTok, {})} </a> </div> <p class="team-bio">
Creador y director de Madrid Femenino Xtra. Siguiendo al Real
              Madrid femenino desde 2019.
</p> </div> </div> </section> </div> </div> ` })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/sobre-nosotros.astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/sobre-nosotros.astro";
const $$url = "/sobre-nosotros";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$SobreNosotros,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
