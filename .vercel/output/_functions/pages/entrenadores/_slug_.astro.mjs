import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, l as Fragment, h as addAttribute, m as maybeRenderHead } from '../../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../../chunks/Layout_CTgb0INN.mjs';
import { f as fetchCoachesDirectly, a as fetchCoachStats } from '../../chunks/entrenadores_CEWS4xox.mjs';
import { p as pauQuesadaPhoto, d as davidAznarPhoto, a as albertoTorilPhoto } from '../../chunks/pau_quesada_BWeVdSVJ.mjs';
import { s as supercopaLogo, c as copaLogo, l as ligaFLogo } from '../../chunks/supercopa_de_espana_2BQWYr8Z.mjs';
import { u as uwclLogo } from '../../chunks/uwcl_DIYEy1cM.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

async function fetchCoachRecords(coachId) {
  try {
    const { createClient } = await import('@libsql/client');
    const url = undefined                                  ;
    const authToken = undefined                                ;
    if (!url || !authToken) {
      console.error("Credenciales de Turso no configuradas");
      return null;
    }
    const db = createClient({
      url,
      authToken
    });
    console.log("Fetching coach records for coach ID:", coachId);
    const mostFacedResult = await db.execute({
      sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    COUNT(*) as partidos
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso'
                GROUP BY rival
                ORDER BY partidos DESC
                LIMIT 1
            `,
      args: [coachId]
    });
    console.log("Most faced:", mostFacedResult.rows[0]);
    const mostWinsResult = await db.execute({
      sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    COUNT(*) as victorias
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso' AND p.goles_rm > p.goles_rival
                GROUP BY rival
                ORDER BY victorias DESC
                LIMIT 1
            `,
      args: [coachId]
    });
    console.log("Most wins:", mostWinsResult.rows[0]);
    const mostDrawsResult = await db.execute({
      sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    COUNT(*) as empates
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso' AND p.goles_rm = p.goles_rival
                GROUP BY rival
                ORDER BY empates DESC
                LIMIT 1
            `,
      args: [coachId]
    });
    console.log("Most draws:", mostDrawsResult.rows[0]);
    const biggestWinResult = await db.execute({
      sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    p.goles_rm, 
                    p.goles_rival,
                    (p.goles_rm - p.goles_rival) as diferencia
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso' AND p.goles_rm > p.goles_rival
                ORDER BY diferencia DESC, p.goles_rm DESC
                LIMIT 1
            `,
      args: [coachId]
    });
    console.log("Biggest win:", biggestWinResult.rows[0]);
    const biggestLossResult = await db.execute({
      sql: `
                SELECT 
                    CASE 
                        WHEN p.id_club_local = 1 THEN cv.nombre
                        ELSE cl.nombre
                    END as rival,
                    p.goles_rm, 
                    p.goles_rival,
                    (p.goles_rival - p.goles_rm) as diferencia
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN clubes cl ON p.id_club_local = cl.id_club
                LEFT JOIN clubes cv ON p.id_club_visitante = cv.id_club
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso' AND p.goles_rm < p.goles_rival
                ORDER BY diferencia DESC, p.goles_rival DESC
                LIMIT 1
            `,
      args: [coachId]
    });
    console.log("Biggest loss:", biggestLossResult.rows[0]);
    const mostRepeatedResult = await db.execute({
      sql: `
                SELECT p.goles_rm || '-' || p.goles_rival as resultado, COUNT(*) as veces
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso'
                GROUP BY resultado
                ORDER BY veces DESC
                LIMIT 1
            `,
      args: [coachId]
    });
    console.log("Most repeated:", mostRepeatedResult.rows[0]);
    const records = {
      mas_partido: mostFacedResult.rows[0] || null,
      mas_victorias: mostWinsResult.rows[0] || null,
      mas_empates: mostDrawsResult.rows[0] || null,
      mayor_victoria: biggestWinResult.rows[0] || null,
      mayor_derrota: biggestLossResult.rows[0] || null,
      mas_repetido: mostRepeatedResult.rows[0] || null
    };
    console.log("Final records object:", records);
    return records;
  } catch (error) {
    console.error("Error fetching coach records:", error);
    return null;
  }
}

async function fetchCoachStreaks(coachId) {
  try {
    const { createClient } = await import('@libsql/client');
    const url = undefined                                  ;
    const authToken = undefined                                ;
    if (!url || !authToken) {
      console.error("Credenciales de Turso no configuradas");
      return null;
    }
    const db = createClient({
      url,
      authToken
    });
    const matchesResult = await db.execute({
      sql: `
                SELECT p.goles_rm, p.goles_rival, p.fecha
                FROM partidos p
                INNER JOIN competiciones c ON p.id_competicion = c.id_competicion
                WHERE p.id_entrenador = ? AND c.competicion != 'Amistoso'
                ORDER BY p.fecha DESC
            `,
      args: [coachId]
    });
    const matches = matchesResult.rows.map((row) => ({
      goles_rm: Number(row.goles_rm),
      goles_rival: Number(row.goles_rival),
      fecha: row.fecha
    }));
    if (matches.length === 0) {
      return null;
    }
    const isWin = (m) => m.goles_rm > m.goles_rival;
    const isDraw = (m) => m.goles_rm === m.goles_rival;
    const isLoss = (m) => m.goles_rm < m.goles_rival;
    const isUnbeaten = (m) => m.goles_rm >= m.goles_rival;
    const isWinless = (m) => m.goles_rm <= m.goles_rival;
    const isScoring = (m) => m.goles_rm > 0;
    const isNotScoring = (m) => m.goles_rm === 0;
    const isConceding = (m) => m.goles_rival > 0;
    const isCleanSheet = (m) => m.goles_rival === 0;
    const isNoGoals = (m) => m.goles_rm === 0 && m.goles_rival === 0;
    const calculateCurrentStreak = (condition) => {
      let count = 0;
      for (const match of matches) {
        if (condition(match)) {
          count++;
        } else {
          break;
        }
      }
      return count;
    };
    const calculateBestStreak = (condition) => {
      let maxStreak = 0;
      let currentStreak = 0;
      const chronologicalMatches = [...matches].reverse();
      for (const match of chronologicalMatches) {
        if (condition(match)) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      return maxStreak;
    };
    return {
      current: {
        ganando: calculateCurrentStreak(isWin),
        empatando: calculateCurrentStreak(isDraw),
        perdiendo: calculateCurrentStreak(isLoss),
        sin_perder: calculateCurrentStreak(isUnbeaten),
        sin_ganar: calculateCurrentStreak(isWinless),
        sin_marcar: calculateCurrentStreak(isNotScoring),
        marcando: calculateCurrentStreak(isScoring),
        encajando: calculateCurrentStreak(isConceding),
        sin_encajar: calculateCurrentStreak(isCleanSheet),
        sin_goles: calculateCurrentStreak(isNoGoals)
      },
      best: {
        ganando: calculateBestStreak(isWin),
        empatando: calculateBestStreak(isDraw),
        perdiendo: calculateBestStreak(isLoss),
        sin_perder: calculateBestStreak(isUnbeaten),
        sin_ganar: calculateBestStreak(isWinless),
        sin_marcar: calculateBestStreak(isNotScoring),
        marcando: calculateBestStreak(isScoring),
        encajando: calculateBestStreak(isConceding),
        sin_encajar: calculateBestStreak(isCleanSheet),
        sin_goles: calculateBestStreak(isNoGoals)
      }
    };
  } catch (error) {
    console.error("Error fetching coach streaks:", error);
    return null;
  }
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const coachPhotos = {
    "Alberto Toril": albertoTorilPhoto,
    "David Aznar": davidAznarPhoto,
    "Pau Quesada": pauQuesadaPhoto
  };
  const competitionLogos = {
    "Liga F": ligaFLogo,
    UWCL: uwclLogo,
    "Copa de la Reina": copaLogo,
    "Supercopa de Espa\xF1a": supercopaLogo
  };
  const { slug } = Astro2.params;
  const allCoaches = await fetchCoachesDirectly();
  const coach = allCoaches.find((c) => c.slug === slug);
  if (!coach) {
    return Astro2.redirect("/404");
  }
  const coachStats = await fetchCoachStats(coach.id_entrenador);
  const coachRecords = await fetchCoachRecords(coach.id_entrenador);
  const coachStreaks = await fetchCoachStreaks(coach.id_entrenador);
  let flagImage;
  try {
    const flags = /* #__PURE__ */ Object.assign({"/src/assets/banderas/alemania.svg": () => import('../../chunks/alemania_BwexC0ei.mjs'),"/src/assets/banderas/australia.svg": () => import('../../chunks/australia_VpSuLwKi.mjs'),"/src/assets/banderas/austria.svg": () => import('../../chunks/austria_avJTJful.mjs'),"/src/assets/banderas/azerbaiyan.svg": () => import('../../chunks/azerbaiyan_BYvs3h3G.mjs'),"/src/assets/banderas/brasil.svg": () => import('../../chunks/brasil_UYRooQvg.mjs'),"/src/assets/banderas/colombia.svg": () => import('../../chunks/colombia_CMI8uVu4.mjs'),"/src/assets/banderas/dinamarca.svg": () => import('../../chunks/dinamarca_CwHXtM4S.mjs'),"/src/assets/banderas/escocia.svg": () => import('../../chunks/escocia_DZ6FTHuy.mjs'),"/src/assets/banderas/espana.svg": () => import('../../chunks/espana_CXM6K5Gb.mjs'),"/src/assets/banderas/francia.svg": () => import('../../chunks/francia_5Z-sSpSJ.mjs'),"/src/assets/banderas/inglaterra.svg": () => import('../../chunks/inglaterra_1RQbzEWT.mjs'),"/src/assets/banderas/islandia.svg": () => import('../../chunks/islandia_AJk3E9In.mjs'),"/src/assets/banderas/italia.svg": () => import('../../chunks/italia_B3bvGEt0.mjs'),"/src/assets/banderas/mexico.svg": () => import('../../chunks/mexico_C4bw5jAu.mjs'),"/src/assets/banderas/noruega.svg": () => import('../../chunks/noruega_B-lKfTt4.mjs'),"/src/assets/banderas/paises_bajos.svg": () => import('../../chunks/paises_bajos_CZgfOHr1.mjs'),"/src/assets/banderas/paraguay.svg": () => import('../../chunks/paraguay_D0lQxrjp.mjs'),"/src/assets/banderas/portugal.svg": () => import('../../chunks/portugal_BUF0W8UN.mjs'),"/src/assets/banderas/republica_checa.svg": () => import('../../chunks/republica_checa_DUnSRyKl.mjs'),"/src/assets/banderas/suecia.svg": () => import('../../chunks/suecia_D4Ppb6wZ.mjs'),"/src/assets/banderas/ucrania.svg": () => import('../../chunks/ucrania_JNemUslr.mjs')

});
    const flagSlug = coach.pais?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    const flagPath = `/src/assets/banderas/${flagSlug}.svg`;
    if (flags[flagPath]) {
      flagImage = (await flags[flagPath]()).default;
    }
  } catch (error) {
    console.error(`Error loading flag for ${coach.pais}:`, error);
  }
  const formatDate = (dateString) => {
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
  const fechaNacimiento = formatDate(coach.fecha_nacimiento);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${coach.nombre} - Entrenador | Madrid Femenino Xtra`, "description": `Perfil completo de ${coach.nombre}, entrenador del Real Madrid Femenino. Estad\xEDsticas, r\xE9cords y trayectoria.`, "data-astro-cid-v644gnrz": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="coach-details-page" data-astro-cid-v644gnrz> <a href="/entrenadores" class="back-link" data-astro-cid-v644gnrz> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" data-astro-cid-v644gnrz> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-astro-cid-v644gnrz></path> </svg>\nVolver al resto de entrenadores\n</a> <div class="coach-grid-layout" data-astro-cid-v644gnrz> <section class="ficha-section" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>Ficha de ', '</h2> <div class="ficha-content" data-astro-cid-v644gnrz> <div class="player-photo-container" data-astro-cid-v644gnrz> ', ' </div> <div class="player-info" data-astro-cid-v644gnrz> <div class="info-row" data-astro-cid-v644gnrz> <span class="info-label" data-astro-cid-v644gnrz>Nombre completo:</span> <span class="info-value" data-astro-cid-v644gnrz>', '</span> </div> <div class="info-row" data-astro-cid-v644gnrz> <span class="info-label" data-astro-cid-v644gnrz>Fecha de nacimiento:</span> <span class="info-value" data-astro-cid-v644gnrz>', '</span> </div> <div class="info-row" data-astro-cid-v644gnrz> <span class="info-label" data-astro-cid-v644gnrz>Lugar de nacimiento:</span> <span class="info-value" data-astro-cid-v644gnrz>-</span> </div> <div class="info-row" data-astro-cid-v644gnrz> <span class="info-label" data-astro-cid-v644gnrz>Nacionalidad:</span> <span class="info-value" data-astro-cid-v644gnrz> ', " ", ' </span> </div> </div> </div> </section> <div class="middle-section" data-astro-cid-v644gnrz> <section class="teams-card" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>TRAYECTORIA</h2> <div class="teams-content" data-astro-cid-v644gnrz> <p class="no-data" data-astro-cid-v644gnrz>Sin datos disponibles</p> </div> </section> <section class="records-card" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>R\xC9CORDS</h2> <div class="records-list" data-astro-cid-v644gnrz> ', ' </div> </section> <section class="streaks-card" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>RACHAS</h2> <div class="streaks-content" data-astro-cid-v644gnrz> ', ' </div> </section> </div> <section class="stats-card full-width" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>ESTAD\xCDSTICAS</h2> <div class="table-wrapper" data-astro-cid-v644gnrz> ', ' </div> </section> </div> </main> <script>\n        (function () {\n            const seasonRows = document.querySelectorAll(\n                ".season-total-row.clickable",\n            );\n\n            seasonRows.forEach((row) => {\n                row.addEventListener("click", function () {\n                    const season = this.getAttribute("data-season");\n                    const competitionRows = document.querySelectorAll(\n                        `.competition-row.season-${season}`,\n                    );\n                    const icon = this.querySelector(".toggle-icon");\n\n                    competitionRows.forEach((compRow) => {\n                        if (\n                            compRow.style.display === "none" ||\n                            compRow.style.display === ""\n                        ) {\n                            compRow.style.display = "table-row";\n                        } else {\n                            compRow.style.display = "none";\n                        }\n                    });\n\n                    if (icon) {\n                        icon.innerHTML =\n                            icon.innerHTML.trim() === "\u25BC" ? "\u25B2" : "\u25BC";\n                    }\n                });\n            });\n        })();\n    <\/script>  '], [" ", '<main class="coach-details-page" data-astro-cid-v644gnrz> <a href="/entrenadores" class="back-link" data-astro-cid-v644gnrz> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" data-astro-cid-v644gnrz> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-astro-cid-v644gnrz></path> </svg>\nVolver al resto de entrenadores\n</a> <div class="coach-grid-layout" data-astro-cid-v644gnrz> <section class="ficha-section" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>Ficha de ', '</h2> <div class="ficha-content" data-astro-cid-v644gnrz> <div class="player-photo-container" data-astro-cid-v644gnrz> ', ' </div> <div class="player-info" data-astro-cid-v644gnrz> <div class="info-row" data-astro-cid-v644gnrz> <span class="info-label" data-astro-cid-v644gnrz>Nombre completo:</span> <span class="info-value" data-astro-cid-v644gnrz>', '</span> </div> <div class="info-row" data-astro-cid-v644gnrz> <span class="info-label" data-astro-cid-v644gnrz>Fecha de nacimiento:</span> <span class="info-value" data-astro-cid-v644gnrz>', '</span> </div> <div class="info-row" data-astro-cid-v644gnrz> <span class="info-label" data-astro-cid-v644gnrz>Lugar de nacimiento:</span> <span class="info-value" data-astro-cid-v644gnrz>-</span> </div> <div class="info-row" data-astro-cid-v644gnrz> <span class="info-label" data-astro-cid-v644gnrz>Nacionalidad:</span> <span class="info-value" data-astro-cid-v644gnrz> ', " ", ' </span> </div> </div> </div> </section> <div class="middle-section" data-astro-cid-v644gnrz> <section class="teams-card" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>TRAYECTORIA</h2> <div class="teams-content" data-astro-cid-v644gnrz> <p class="no-data" data-astro-cid-v644gnrz>Sin datos disponibles</p> </div> </section> <section class="records-card" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>R\xC9CORDS</h2> <div class="records-list" data-astro-cid-v644gnrz> ', ' </div> </section> <section class="streaks-card" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>RACHAS</h2> <div class="streaks-content" data-astro-cid-v644gnrz> ', ' </div> </section> </div> <section class="stats-card full-width" data-astro-cid-v644gnrz> <h2 class="section-header" data-astro-cid-v644gnrz>ESTAD\xCDSTICAS</h2> <div class="table-wrapper" data-astro-cid-v644gnrz> ', ' </div> </section> </div> </main> <script>\n        (function () {\n            const seasonRows = document.querySelectorAll(\n                ".season-total-row.clickable",\n            );\n\n            seasonRows.forEach((row) => {\n                row.addEventListener("click", function () {\n                    const season = this.getAttribute("data-season");\n                    const competitionRows = document.querySelectorAll(\n                        \\`.competition-row.season-\\${season}\\`,\n                    );\n                    const icon = this.querySelector(".toggle-icon");\n\n                    competitionRows.forEach((compRow) => {\n                        if (\n                            compRow.style.display === "none" ||\n                            compRow.style.display === ""\n                        ) {\n                            compRow.style.display = "table-row";\n                        } else {\n                            compRow.style.display = "none";\n                        }\n                    });\n\n                    if (icon) {\n                        icon.innerHTML =\n                            icon.innerHTML.trim() === "\u25BC" ? "\u25B2" : "\u25BC";\n                    }\n                });\n            });\n        })();\n    <\/script>  '])), maybeRenderHead(), coach.nombre, coachPhotos[coach.nombre] ? renderTemplate`<img${addAttribute(coachPhotos[coach.nombre].src, "src")}${addAttribute(`Foto de ${coach.nombre}`, "alt")} class="player-photo" data-astro-cid-v644gnrz>` : renderTemplate`<img src="/images/placeholder.png"${addAttribute(`Foto de ${coach.nombre}`, "alt")} class="player-photo" data-astro-cid-v644gnrz>`, coach.nombre, fechaNacimiento, coach.pais || "-", flagImage && renderTemplate`<img${addAttribute(flagImage.src, "src")}${addAttribute(`Bandera de ${coach.pais}`, "alt")} class="country-flag" data-astro-cid-v644gnrz>`, coachRecords ? renderTemplate`<div class="records-grid" data-astro-cid-v644gnrz> ${coachRecords.mas_partido && renderTemplate`<div class="record-item" data-astro-cid-v644gnrz> <span class="record-label" data-astro-cid-v644gnrz>
Más partidos:
</span> <span class="record-value" data-astro-cid-v644gnrz> ${coachRecords.mas_partido.rival}${" "}
-${" "} ${coachRecords.mas_partido.partidos} </span> </div>`} ${coachRecords.mas_victorias && renderTemplate`<div class="record-item" data-astro-cid-v644gnrz> <span class="record-label" data-astro-cid-v644gnrz>
Más victorias:
</span> <span class="record-value" data-astro-cid-v644gnrz> ${coachRecords.mas_victorias.rival}${" "}
-${" "} ${coachRecords.mas_victorias.victorias} </span> </div>`} ${coachRecords.mas_empates && renderTemplate`<div class="record-item" data-astro-cid-v644gnrz> <span class="record-label" data-astro-cid-v644gnrz>
Más empates:
</span> <span class="record-value" data-astro-cid-v644gnrz> ${coachRecords.mas_empates.rival}${" "}
-${" "} ${coachRecords.mas_empates.empates} </span> </div>`} ${coachRecords.mayor_victoria && renderTemplate`<div class="record-item" data-astro-cid-v644gnrz> <span class="record-label" data-astro-cid-v644gnrz>
Mayor victoria:
</span> <span class="record-value" data-astro-cid-v644gnrz> ${coachRecords.mayor_victoria.goles_rm}
-
${coachRecords.mayor_victoria.goles_rival}${" "}
vs${" "} ${coachRecords.mayor_victoria.rival} </span> </div>`} ${coachRecords.mayor_derrota && renderTemplate`<div class="record-item" data-astro-cid-v644gnrz> <span class="record-label" data-astro-cid-v644gnrz>
Mayor derrota:
</span> <span class="record-value" data-astro-cid-v644gnrz> ${coachRecords.mayor_derrota.goles_rm}
-
${coachRecords.mayor_derrota.goles_rival}${" "}
vs${" "} ${coachRecords.mayor_derrota.rival} </span> </div>`} ${coachRecords.mas_repetido && renderTemplate`<div class="record-item" data-astro-cid-v644gnrz> <span class="record-label" data-astro-cid-v644gnrz>
Más repetido:
</span> <span class="record-value" data-astro-cid-v644gnrz> ${coachRecords.mas_repetido.resultado}${" "}
-${" "} ${coachRecords.mas_repetido.veces}${" "}
veces
</span> </div>`} </div>` : renderTemplate`<p class="no-data" data-astro-cid-v644gnrz>Sin datos disponibles</p>`, coachStreaks ? renderTemplate`<div class="streaks-list" data-astro-cid-v644gnrz> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Ganando
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.ganando} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Empatando
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.empatando} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Perdiendo
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.perdiendo} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Sin perder
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.sin_perder} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Sin ganar
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.sin_ganar} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Sin marcar
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.sin_marcar} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Marcando
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.marcando} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Encajando
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.encajando} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Sin encajar
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.sin_encajar} </span> </div> <div class="streak-item" data-astro-cid-v644gnrz> <span class="streak-label" data-astro-cid-v644gnrz>
Sin goles
</span> <span class="streak-value" data-astro-cid-v644gnrz> ${coachStreaks.best.sin_goles} </span> </div> </div>` : renderTemplate`<p class="no-data" data-astro-cid-v644gnrz>Sin datos disponibles</p>`, coachStats && coachStats.estadisticas && coachStats.estadisticas.length > 0 ? renderTemplate`<table class="stats-table" data-astro-cid-v644gnrz> <thead data-astro-cid-v644gnrz> <tr data-astro-cid-v644gnrz> <th data-astro-cid-v644gnrz>Temporada</th> <th title="Partidos" data-astro-cid-v644gnrz>PJ</th> <th title="Victorias" data-astro-cid-v644gnrz>V</th> <th title="% Victorias" data-astro-cid-v644gnrz>%V</th> <th title="Empates" data-astro-cid-v644gnrz>E</th> <th title="% Empates" data-astro-cid-v644gnrz>%E</th> <th title="Derrotas" data-astro-cid-v644gnrz>D</th> <th title="% Derrotas" data-astro-cid-v644gnrz>%D</th> <th title="Goles a Favor" data-astro-cid-v644gnrz>GF</th> <th title="Goles en Contra" data-astro-cid-v644gnrz>GC</th> <th title="Diferencia" data-astro-cid-v644gnrz>Dif</th> <th title="Porterías a Cero" data-astro-cid-v644gnrz>PC</th> </tr> </thead> <tbody data-astro-cid-v644gnrz> ${coachStats.estadisticas.map(
    (season) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-v644gnrz": true }, { "default": async ($$result3) => renderTemplate`<tr class="season-total-row clickable"${addAttribute(season.temporada.replace(
      /\//g,
      "-"
    ), "data-season")} data-astro-cid-v644gnrz> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.temporada} </strong> <span class="toggle-icon" data-astro-cid-v644gnrz>
&#9660;
</span> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.partidos} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.victorias} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.porcentaje_victorias}
%
</strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.empates} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.porcentaje_empates}
%
</strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.derrotas} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.porcentaje_derrotas}
%
</strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.goles_favor} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.goles_contra} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.goles_favor - season.total.goles_contra} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${season.total.porterias_cero} </strong> </td> </tr> ${season.competiciones.map(
      (comp) => renderTemplate`<tr${addAttribute(`competition-row season-${season.temporada.replace(/\//g, "-")}`, "class")} style="display: none;" data-astro-cid-v644gnrz> <td class="competition-name" data-astro-cid-v644gnrz> ${competitionLogos[comp.competicion] && renderTemplate`<img${addAttribute(
        competitionLogos[comp.competicion].src,
        "src"
      )}${addAttribute(
        comp.competicion,
        "alt"
      )} class="competition-logo" data-astro-cid-v644gnrz>`} ${comp.competicion} </td> <td data-astro-cid-v644gnrz> ${comp.partidos} </td> <td data-astro-cid-v644gnrz> ${comp.victorias} </td> <td data-astro-cid-v644gnrz> ${comp.porcentaje_victorias}
%
</td> <td data-astro-cid-v644gnrz> ${comp.empates} </td> <td data-astro-cid-v644gnrz> ${comp.porcentaje_empates}
%
</td> <td data-astro-cid-v644gnrz> ${comp.derrotas} </td> <td data-astro-cid-v644gnrz> ${comp.porcentaje_derrotas}
%
</td> <td data-astro-cid-v644gnrz> ${comp.goles_favor} </td> <td data-astro-cid-v644gnrz> ${comp.goles_contra} </td> <td data-astro-cid-v644gnrz> ${comp.goles_favor - comp.goles_contra} </td> <td data-astro-cid-v644gnrz> ${comp.porterias_cero} </td> </tr>`
    )}` })}`
  )}  <tr class="career-total-row" data-astro-cid-v644gnrz> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz>TOTAL</strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.partidos} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.victorias} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.porcentaje_victorias}
%
</strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.empates} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.porcentaje_empates}
%
</strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.derrotas} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.porcentaje_derrotas}
%
</strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.goles_favor} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.goles_contra} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.goles_favor - coachStats.total_carrera.goles_contra} </strong> </td> <td data-astro-cid-v644gnrz> <strong data-astro-cid-v644gnrz> ${coachStats.total_carrera.porterias_cero} </strong> </td> </tr> </tbody> </table>` : renderTemplate`<table class="stats-table" data-astro-cid-v644gnrz> <thead data-astro-cid-v644gnrz> <tr data-astro-cid-v644gnrz> <th data-astro-cid-v644gnrz>Temporada</th> <th data-astro-cid-v644gnrz>PJ</th> <th data-astro-cid-v644gnrz>V</th> <th data-astro-cid-v644gnrz>E</th> <th data-astro-cid-v644gnrz>D</th> <th data-astro-cid-v644gnrz>GF</th> <th data-astro-cid-v644gnrz>GC</th> <th data-astro-cid-v644gnrz>Dif</th> </tr> </thead> <tbody data-astro-cid-v644gnrz> <tr data-astro-cid-v644gnrz> <td colspan="8" class="no-data-cell" data-astro-cid-v644gnrz>
Sin datos disponibles
</td> </tr> </tbody> </table>`) })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/entrenadores/[slug].astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/entrenadores/[slug].astro";
const $$url = "/entrenadores/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$slug,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
