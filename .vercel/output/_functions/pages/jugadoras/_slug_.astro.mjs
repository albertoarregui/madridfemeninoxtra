import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, l as Fragment, h as addAttribute, m as maybeRenderHead } from '../../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../../chunks/Layout_CTgb0INN.mjs';
import { f as fetchPlayersDirectly, a as fetchPlayerStats, b as fetchPlayerDebut } from '../../chunks/players_C35rOX2Y.mjs';
import { s as supercopaLogo, c as copaLogo, l as ligaFLogo } from '../../chunks/supercopa_de_espana_2BQWYr8Z.mjs';
import { u as uwclLogo } from '../../chunks/uwcl_DIYEy1cM.mjs';
import alemaniaFlag from '../../chunks/alemania_BwexC0ei.mjs';
import australiaFlag from '../../chunks/australia_VpSuLwKi.mjs';
import austriaFlag from '../../chunks/austria_avJTJful.mjs';
import azerbaiyanFlag from '../../chunks/azerbaiyan_BYvs3h3G.mjs';
import brasilFlag from '../../chunks/brasil_UYRooQvg.mjs';
import colombiaFlag from '../../chunks/colombia_CMI8uVu4.mjs';
import dinamarcaFlag from '../../chunks/dinamarca_CwHXtM4S.mjs';
import escociaFlag from '../../chunks/escocia_DZ6FTHuy.mjs';
import espanaFlag from '../../chunks/espana_CXM6K5Gb.mjs';
import franciaFlag from '../../chunks/francia_5Z-sSpSJ.mjs';
import inglaterraFlag from '../../chunks/inglaterra_1RQbzEWT.mjs';
import islandiaFlag from '../../chunks/islandia_AJk3E9In.mjs';
import italiaFlag from '../../chunks/italia_B3bvGEt0.mjs';
import mexicoFlag from '../../chunks/mexico_C4bw5jAu.mjs';
import noruegaFlag from '../../chunks/noruega_B-lKfTt4.mjs';
import paisesBajosFlag from '../../chunks/paises_bajos_CZgfOHr1.mjs';
import paraguayFlag from '../../chunks/paraguay_D0lQxrjp.mjs';
import portugalFlag from '../../chunks/portugal_BUF0W8UN.mjs';
import republicaChecaFlag from '../../chunks/republica_checa_DUnSRyKl.mjs';
import sueciaFlag from '../../chunks/suecia_D4Ppb6wZ.mjs';
import ucraniaFlag from '../../chunks/ucrania_JNemUslr.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const competitionLogos = {
    "Liga F": ligaFLogo,
    UWCL: uwclLogo,
    "Copa de la Reina": copaLogo,
    "Supercopa de Espa\xF1a": supercopaLogo
    // Amistoso doesn't have a logo
  };
  const countryFlags = {
    Alemania: alemaniaFlag,
    Australia: australiaFlag,
    Austria: austriaFlag,
    Azerbaiy\u00E1n: azerbaiyanFlag,
    Brasil: brasilFlag,
    Colombia: colombiaFlag,
    Dinamarca: dinamarcaFlag,
    Escocia: escociaFlag,
    Espa\u00F1a: espanaFlag,
    Francia: franciaFlag,
    Inglaterra: inglaterraFlag,
    Islandia: islandiaFlag,
    Italia: italiaFlag,
    M\u00E9xico: mexicoFlag,
    Noruega: noruegaFlag,
    "Pa\xEDses Bajos": paisesBajosFlag,
    Paraguay: paraguayFlag,
    Portugal: portugalFlag,
    "Rep\xFAblica Checa": republicaChecaFlag,
    Suecia: sueciaFlag,
    Ucrania: ucraniaFlag
  };
  const { slug } = Astro2.params;
  const allPlayers = await fetchPlayersDirectly();
  const player = allPlayers.find((p) => p.slug === slug);
  if (!player) {
    return Astro2.redirect("/404");
  }
  const isGoalkeeper = player.posicion === "Portera";
  const playerStats = await fetchPlayerStats(player.id_jugadora, isGoalkeeper);
  if (playerStats) {
    playerStats.jugadora = {
      id: player.id_jugadora,
      nombre: player.nombre,
      posicion: player.posicion,
      es_portera: isGoalkeeper
    };
  }
  const formatShortDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString.split("T")[0]);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return "-";
    }
  };
  const calculateAge = (dateString) => {
    if (!dateString) return null;
    try {
      const birthDate = new Date(dateString.split("T")[0]);
      if (isNaN(birthDate.getTime())) return null;
      const today = /* @__PURE__ */ new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birthDate.getDate()) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };
  const fechaNacimiento = formatShortDate(player.fecha_nacimiento);
  calculateAge(player.fecha_nacimiento);
  const alturaDisplay = player.altura ? `${player.altura} m.` : "-";
  const pesoDisplay = player.peso ? `${player.peso} kg` : "-";
  const debutInfo = await fetchPlayerDebut(player.id_jugadora);
  const debutDisplay = debutInfo && debutInfo.fecha_debut ? `${formatShortDate(debutInfo.fecha_debut)}${debutInfo.rival ? ` (${debutInfo.rival})` : ""}` : "-";
  const positionCoords = {
    Portera: { left: "10%", top: "50%" },
    Defensa: { left: "30%", top: "50%" },
    Centrocampista: { left: "55%", top: "50%" },
    Delantera: { left: "80%", top: "50%" }
  };
  const playerPosition = positionCoords[player.posicion] || {
    left: "50%",
    top: "50%"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${player.nombre} - Perfil | Madrid Femenino Xtra`, "description": `Ficha completa de ${player.nombre}, jugadora del Real Madrid Femenino. Consulta sus estad\xEDsticas, posici\xF3n, biograf\xEDa y r\xE9cords.`, "data-astro-cid-xsosvpj5": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="player-profile-page" data-astro-cid-xsosvpj5> <a href="/jugadoras" class="back-link" data-astro-cid-xsosvpj5> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" data-astro-cid-xsosvpj5> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-astro-cid-xsosvpj5></path> </svg>\nVolver al resto de jugadoras\n</a> <div class="profile-grid" data-astro-cid-xsosvpj5> <section class="ficha-section" data-astro-cid-xsosvpj5> <h2 class="section-header" data-astro-cid-xsosvpj5>Ficha de ', '</h2> <div class="ficha-content" data-astro-cid-xsosvpj5> <div class="player-photo-container" data-astro-cid-xsosvpj5> <img', "", ` class="player-photo" onerror="this.onerror=null; this.src='/images/placeholder_jugadora.png';" data-astro-cid-xsosvpj5> </div> <div class="player-info" data-astro-cid-xsosvpj5> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Nombre completo:</span> <span class="info-value" data-astro-cid-xsosvpj5>`, '</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Fecha de nacimiento:</span> <span class="info-value" data-astro-cid-xsosvpj5>', '</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Lugar de nacimiento:</span> <span class="info-value" data-astro-cid-xsosvpj5>-</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Nacionalidad:</span> <span class="info-value" data-astro-cid-xsosvpj5> ', " ", ' </span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Altura / Peso:</span> <span class="info-value" data-astro-cid-xsosvpj5>', " / ", '</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>T\xEDtulos:</span> <span class="info-value" data-astro-cid-xsosvpj5>-</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Debut:</span> <span class="info-value" data-astro-cid-xsosvpj5>', '</span> </div> </div> </div> </section> <!-- POSICI\xD3N --> <section class="position-section" data-astro-cid-xsosvpj5> <h2 class="section-header" data-astro-cid-xsosvpj5>Posici\xF3n</h2> <div class="field-diagram" data-astro-cid-xsosvpj5> <svg viewBox="0 0 100 65" class="field-svg" data-astro-cid-xsosvpj5> <!-- Field --> <rect x="0" y="0" width="100" height="65" fill="#4a7c35" data-astro-cid-xsosvpj5></rect> <!-- Stripes --> <rect x="0" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <rect x="20" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <rect x="40" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <rect x="60" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <rect x="80" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <!-- Lines --> <rect x="0" y="0" width="100" height="65" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> <line x1="50" y1="0" x2="50" y2="65" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></line> <circle cx="50" cy="32.5" r="8" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></circle> <!-- Left goal area --> <rect x="0" y="20" width="15" height="25" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> <rect x="0" y="26" width="5" height="13" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> <!-- Right goal area --> <rect x="85" y="20" width="15" height="25" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> <rect x="95" y="26" width="5" height="13" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> </svg> <div class="player-marker"', ' data-astro-cid-xsosvpj5> <div class="marker-icon" data-astro-cid-xsosvpj5></div> </div> </div> </section> <section class="teams-section" data-astro-cid-xsosvpj5> <h2 class="section-header" data-astro-cid-xsosvpj5>TRAYECTORIA</h2> <div class="teams-content" data-astro-cid-xsosvpj5> <p class="no-data" data-astro-cid-xsosvpj5>Sin datos disponibles</p> </div> </section> <section class="stats-section" data-astro-cid-xsosvpj5> <h2 class="section-header" data-astro-cid-xsosvpj5>ESTAD\xCDSTICAS</h2> ', ' </section> </div> </main> <script>\n        function toggleSeason(season) {\n            const rows = document.querySelectorAll(\n                `.competition-row.season-${season}`,\n            );\n            const icon = document.querySelector(\n                `.season-total-row[onclick*="${season}"] .toggle-icon`,\n            );\n\n            rows.forEach((row) => {\n                if (row.style.display === "none") {\n                    row.style.display = "table-row";\n                    if (icon) icon.textContent = "\u25B2";\n                } else {\n                    row.style.display = "none";\n                    if (icon) icon.textContent = "\u25BC";\n                }\n            });\n        }\n    <\/script>  '], [" ", '<main class="player-profile-page" data-astro-cid-xsosvpj5> <a href="/jugadoras" class="back-link" data-astro-cid-xsosvpj5> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" data-astro-cid-xsosvpj5> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-astro-cid-xsosvpj5></path> </svg>\nVolver al resto de jugadoras\n</a> <div class="profile-grid" data-astro-cid-xsosvpj5> <section class="ficha-section" data-astro-cid-xsosvpj5> <h2 class="section-header" data-astro-cid-xsosvpj5>Ficha de ', '</h2> <div class="ficha-content" data-astro-cid-xsosvpj5> <div class="player-photo-container" data-astro-cid-xsosvpj5> <img', "", ` class="player-photo" onerror="this.onerror=null; this.src='/images/placeholder_jugadora.png';" data-astro-cid-xsosvpj5> </div> <div class="player-info" data-astro-cid-xsosvpj5> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Nombre completo:</span> <span class="info-value" data-astro-cid-xsosvpj5>`, '</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Fecha de nacimiento:</span> <span class="info-value" data-astro-cid-xsosvpj5>', '</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Lugar de nacimiento:</span> <span class="info-value" data-astro-cid-xsosvpj5>-</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Nacionalidad:</span> <span class="info-value" data-astro-cid-xsosvpj5> ', " ", ' </span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Altura / Peso:</span> <span class="info-value" data-astro-cid-xsosvpj5>', " / ", '</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>T\xEDtulos:</span> <span class="info-value" data-astro-cid-xsosvpj5>-</span> </div> <div class="info-row" data-astro-cid-xsosvpj5> <span class="info-label" data-astro-cid-xsosvpj5>Debut:</span> <span class="info-value" data-astro-cid-xsosvpj5>', '</span> </div> </div> </div> </section> <!-- POSICI\xD3N --> <section class="position-section" data-astro-cid-xsosvpj5> <h2 class="section-header" data-astro-cid-xsosvpj5>Posici\xF3n</h2> <div class="field-diagram" data-astro-cid-xsosvpj5> <svg viewBox="0 0 100 65" class="field-svg" data-astro-cid-xsosvpj5> <!-- Field --> <rect x="0" y="0" width="100" height="65" fill="#4a7c35" data-astro-cid-xsosvpj5></rect> <!-- Stripes --> <rect x="0" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <rect x="20" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <rect x="40" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <rect x="60" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <rect x="80" y="0" width="10" height="65" fill="#3d6b2e" opacity="0.3" data-astro-cid-xsosvpj5></rect> <!-- Lines --> <rect x="0" y="0" width="100" height="65" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> <line x1="50" y1="0" x2="50" y2="65" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></line> <circle cx="50" cy="32.5" r="8" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></circle> <!-- Left goal area --> <rect x="0" y="20" width="15" height="25" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> <rect x="0" y="26" width="5" height="13" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> <!-- Right goal area --> <rect x="85" y="20" width="15" height="25" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> <rect x="95" y="26" width="5" height="13" fill="none" stroke="white" stroke-width="0.3" data-astro-cid-xsosvpj5></rect> </svg> <div class="player-marker"', ' data-astro-cid-xsosvpj5> <div class="marker-icon" data-astro-cid-xsosvpj5></div> </div> </div> </section> <section class="teams-section" data-astro-cid-xsosvpj5> <h2 class="section-header" data-astro-cid-xsosvpj5>TRAYECTORIA</h2> <div class="teams-content" data-astro-cid-xsosvpj5> <p class="no-data" data-astro-cid-xsosvpj5>Sin datos disponibles</p> </div> </section> <section class="stats-section" data-astro-cid-xsosvpj5> <h2 class="section-header" data-astro-cid-xsosvpj5>ESTAD\xCDSTICAS</h2> ', ' </section> </div> </main> <script>\n        function toggleSeason(season) {\n            const rows = document.querySelectorAll(\n                \\`.competition-row.season-\\${season}\\`,\n            );\n            const icon = document.querySelector(\n                \\`.season-total-row[onclick*="\\${season}"] .toggle-icon\\`,\n            );\n\n            rows.forEach((row) => {\n                if (row.style.display === "none") {\n                    row.style.display = "table-row";\n                    if (icon) icon.textContent = "\u25B2";\n                } else {\n                    row.style.display = "none";\n                    if (icon) icon.textContent = "\u25BC";\n                }\n            });\n        }\n    <\/script>  '])), maybeRenderHead(), player.nombre, addAttribute(player.imageUrl, "src"), addAttribute(`Foto de ${player.nombre}`, "alt"), player.nombre, fechaNacimiento, player.pais_origin, countryFlags[player.pais_origin] && renderTemplate`<img class="flag-icon"${addAttribute(
    countryFlags[player.pais_origin].src,
    "src"
  )}${addAttribute(`Bandera de ${player.pais_origin}`, "alt")} data-astro-cid-xsosvpj5>`, alturaDisplay, pesoDisplay, debutDisplay, addAttribute(`left: ${playerPosition.left}; top: ${playerPosition.top};`, "style"), playerStats ? renderTemplate`<table class="stats-table" data-astro-cid-xsosvpj5> <thead data-astro-cid-xsosvpj5> <tr data-astro-cid-xsosvpj5> <th data-astro-cid-xsosvpj5>Temporada</th> <th title="Convocatorias" data-astro-cid-xsosvpj5>Conv.</th> <th title="Partidos" data-astro-cid-xsosvpj5>Part.</th> <th title="Titularidades" data-astro-cid-xsosvpj5>Tit.</th> <th title="Minutos" data-astro-cid-xsosvpj5>Min.</th> <th title="Cambio Entrada" data-astro-cid-xsosvpj5>Ent.</th> <th title="Cambio Salida" data-astro-cid-xsosvpj5>Sal.</th> <th title="Goles" data-astro-cid-xsosvpj5>Goles</th> <th title="Asistencias" data-astro-cid-xsosvpj5>Asist.</th> <th title="Goles + Asistencias" data-astro-cid-xsosvpj5>G+A</th> ${playerStats.jugadora.es_portera && renderTemplate`<th title="Porterías a cero" data-astro-cid-xsosvpj5>P.0</th>`} <th title="Tarjetas Amarillas" data-astro-cid-xsosvpj5>TA</th> <th title="Tarjetas Rojas" data-astro-cid-xsosvpj5>TR</th> <th title="Capitanías" data-astro-cid-xsosvpj5>Cap.</th> </tr> </thead> <tbody data-astro-cid-xsosvpj5> ${playerStats.estadisticas.map((season) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-xsosvpj5": true }, { "default": async ($$result3) => renderTemplate`<tr class="season-total-row"${addAttribute(`toggleSeason('${season.temporada.replace(/\//g, "-")}')`, "onclick")} style="cursor: pointer;" data-astro-cid-xsosvpj5> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.temporada} </strong>${" "} <span class="toggle-icon" data-astro-cid-xsosvpj5>
▼
</span> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.convocatorias} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.partidos} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.titularidades} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.minutos} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.cambio_entrada} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.cambio_salida} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.goles} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.asistencias} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.goles_asistencias} </strong> </td> ${playerStats.jugadora.es_portera && renderTemplate`<td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.porterias_cero} </strong> </td>`} <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.tarjetas_amarillas} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.tarjetas_rojas} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${season.total.capitanias} </strong> </td> </tr> ${season.competiciones.map(
    (comp) => renderTemplate`<tr${addAttribute(`competition-row season-${season.temporada.replace(/\//g, "-")}`, "class")} style="display: none;" data-astro-cid-xsosvpj5> <td class="competition-name" data-astro-cid-xsosvpj5> ${competitionLogos[comp.competicion] && renderTemplate`<img${addAttribute(
      competitionLogos[comp.competicion].src,
      "src"
    )}${addAttribute(
      comp.competicion,
      "alt"
    )} class="competition-logo" data-astro-cid-xsosvpj5>`} ${comp.competicion} </td> <td data-astro-cid-xsosvpj5> ${comp.convocatorias} </td> <td data-astro-cid-xsosvpj5>${comp.partidos}</td> <td data-astro-cid-xsosvpj5> ${comp.titularidades} </td> <td data-astro-cid-xsosvpj5>${comp.minutos}</td> <td data-astro-cid-xsosvpj5> ${comp.cambio_entrada} </td> <td data-astro-cid-xsosvpj5> ${comp.cambio_salida} </td> <td data-astro-cid-xsosvpj5>${comp.goles}</td> <td data-astro-cid-xsosvpj5>${comp.asistencias}</td> <td data-astro-cid-xsosvpj5> ${comp.goles_asistencias} </td> ${playerStats.jugadora.es_portera && renderTemplate`<td data-astro-cid-xsosvpj5> ${comp.porterias_cero} </td>`} <td data-astro-cid-xsosvpj5> ${comp.tarjetas_amarillas} </td> <td data-astro-cid-xsosvpj5> ${comp.tarjetas_rojas} </td> <td data-astro-cid-xsosvpj5>${comp.capitanias}</td> </tr>`
  )}` })}`)}  <tr class="career-total-row" data-astro-cid-xsosvpj5> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5>TOTAL</strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.convocatorias} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.partidos} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.titularidades} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.minutos} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.cambio_entrada} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.cambio_salida} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.goles} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.asistencias} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.goles_asistencias} </strong> </td> ${playerStats.jugadora.es_portera && renderTemplate`<td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.porterias_cero} </strong> </td>`} <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.tarjetas_amarillas} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.tarjetas_rojas} </strong> </td> <td data-astro-cid-xsosvpj5> <strong data-astro-cid-xsosvpj5> ${playerStats.total_carrera.capitanias} </strong> </td> </tr> </tbody> </table>` : renderTemplate`<p class="no-data" data-astro-cid-xsosvpj5>
No hay estadísticas disponibles para esta jugadora.
</p>`) })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/jugadoras/[slug].astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/jugadoras/[slug].astro";
const $$url = "/jugadoras/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$slug,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
