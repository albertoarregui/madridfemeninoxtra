import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../../chunks/Layout_CTgb0INN.mjs';
import { f as fetchGamesDirectly } from '../../chunks/partidos_DovfxgXg.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const allGames = await fetchGamesDirectly();
  const game = allGames.find((g) => g.slug === slug);
  if (!game) {
    return Astro2.redirect("/404");
  }
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
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
  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5);
  };
  const mockLineup = [];
  const mockSubs = [];
  const mockTimeline = [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${game.club_local} vs ${game.club_visitante} - Partido | Madrid Femenino Xtra`, "description": `Resultado y estad\xEDsticas del partido ${game.club_local} vs ${game.club_visitante}. Alineaciones, goles y cr\xF3nica completa.`, "data-astro-cid-74czde43": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="match-details-page" data-astro-cid-74czde43> <a href="/partidos" class="back-link" data-astro-cid-74czde43> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" data-astro-cid-74czde43> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-astro-cid-74czde43></path> </svg>
Volver al listado
</a> <div class="match-grid" data-astro-cid-74czde43> <!-- LEFT COLUMN --> <div class="left-column" data-astro-cid-74czde43> <!-- FICHA DE PARTIDO --> <section class="match-card" data-astro-cid-74czde43> <h2 class="section-header" data-astro-cid-74czde43>Ficha de partido</h2> <div class="match-result" data-astro-cid-74czde43> <div class="team-info" data-astro-cid-74czde43> <div class="team-badge" data-astro-cid-74czde43> <div class="badge-placeholder" data-astro-cid-74czde43></div> </div> <span class="team-name" data-astro-cid-74czde43>${game.club_local}</span> </div> <div class="score" data-astro-cid-74czde43> <span class="score-number" data-astro-cid-74czde43>${game.goles_rm}</span> <span class="score-separator" data-astro-cid-74czde43>-</span> <span class="score-number" data-astro-cid-74czde43>${game.goles_rival}</span> </div> <div class="team-info" data-astro-cid-74czde43> <span class="team-name" data-astro-cid-74czde43>${game.club_visitante}</span> <div class="team-badge" data-astro-cid-74czde43> <div class="badge-placeholder" data-astro-cid-74czde43></div> </div> </div> </div> <div class="match-info-grid" data-astro-cid-74czde43> <div class="info-item" data-astro-cid-74czde43> <span class="info-icon" data-astro-cid-74czde43>🏆</span> <span class="info-text" data-astro-cid-74czde43>${game.competicion_nombre} (J${game.jornada})</span> </div> <div class="info-item" data-astro-cid-74czde43> <span class="info-icon" data-astro-cid-74czde43>📅</span> <span class="info-text" data-astro-cid-74czde43>${formatDate(game.fecha)} - ${formatTime(game.hora)}</span> </div> <div class="info-item" data-astro-cid-74czde43> <span class="info-icon" data-astro-cid-74czde43>🏟️</span> <span class="info-text" data-astro-cid-74czde43>${game.estadio || "Stadium"}</span> </div> <div class="info-item" data-astro-cid-74czde43> <span class="info-icon" data-astro-cid-74czde43>👔</span> <span class="info-text" data-astro-cid-74czde43>${game.arbitra_nombre || "\xC1rbitro"}</span> </div> </div> </section> <!-- EQUIPOS TITULARES --> <section class="lineup-card" data-astro-cid-74czde43> <h2 class="section-header" data-astro-cid-74czde43>Equipos titulares</h2> <div class="lineup-list" data-astro-cid-74czde43> ${mockLineup.map((player) => renderTemplate`<div class="lineup-row" data-astro-cid-74czde43> <span class="player-pos" data-astro-cid-74czde43>${player.pos}</span> <div class="team-badge-small" data-astro-cid-74czde43> <div class="badge-placeholder-small" data-astro-cid-74czde43></div> </div> <span class="player-name" data-astro-cid-74czde43> ${player.name} </span> <div class="player-photo-small" data-astro-cid-74czde43> <div class="photo-placeholder" data-astro-cid-74czde43></div> </div> <span class="player-number" data-astro-cid-74czde43> ${player.number} </span> </div>`)} </div> </section> <section class="subs-card" data-astro-cid-74czde43> <h2 class="section-header" data-astro-cid-74czde43>Sustituciones</h2> <div class="lineup-list" data-astro-cid-74czde43> ${mockSubs.map((player) => renderTemplate`<div class="lineup-row" data-astro-cid-74czde43> <span class="player-pos" data-astro-cid-74czde43>${player.pos}</span> <div class="team-badge-small" data-astro-cid-74czde43> <div class="badge-placeholder-small" data-astro-cid-74czde43></div> </div> <span class="player-name" data-astro-cid-74czde43> ${player.name} </span> <div class="player-photo-small" data-astro-cid-74czde43> <div class="photo-placeholder" data-astro-cid-74czde43></div> </div> <span class="player-number" data-astro-cid-74czde43> ${player.number} </span> </div>`)} </div> </section> <section class="timeline-card" data-astro-cid-74czde43> <h2 class="section-header" data-astro-cid-74czde43>Timeline del partido</h2> <div class="timeline-container" data-astro-cid-74czde43> <div class="timeline-left-badge" data-astro-cid-74czde43> <div class="badge-placeholder-small" data-astro-cid-74czde43></div> </div> <div class="timeline-track" data-astro-cid-74czde43> ${mockTimeline.map((event, index) => renderTemplate`<div class="timeline-event" data-astro-cid-74czde43> <div class="event-time" data-astro-cid-74czde43> <span class="minute-badge" data-astro-cid-74czde43> ${event.minute}'
</span> </div> <div class="event-content" data-astro-cid-74czde43> <div${addAttribute(`event-icon ${event.type}`, "class")} data-astro-cid-74czde43></div> <span class="event-text" data-astro-cid-74czde43> ${event.text} </span> </div> </div>`)} </div> <div class="timeline-right-badge" data-astro-cid-74czde43> <div class="badge-placeholder-small" data-astro-cid-74czde43></div> </div> </div> </section> </div> <div class="right-column" data-astro-cid-74czde43> <section class="stadium-card" data-astro-cid-74czde43> <h2 class="section-header" data-astro-cid-74czde43>Estadio</h2> <div class="stadium-content" data-astro-cid-74czde43> <div class="stadium-photo" data-astro-cid-74czde43> <div class="photo-placeholder-large" data-astro-cid-74czde43></div> </div> <div class="stadium-info" data-astro-cid-74czde43> <p data-astro-cid-74czde43> <strong data-astro-cid-74czde43>Nombre:</strong> ${game.estadio || "Vallecas"} </p> <p data-astro-cid-74czde43><strong data-astro-cid-74czde43>Aforo:</strong> 14,708 espectadores</p> <p data-astro-cid-74czde43> <strong data-astro-cid-74czde43>Ubicación:</strong> Madrid (Madrid) 🇪🇸
</p> <p data-astro-cid-74czde43><strong data-astro-cid-74czde43>Inauguración:</strong> 10/05/1976</p> </div> <div class="stadium-stats" data-astro-cid-74czde43> <div class="stat-bar" data-astro-cid-74czde43> <div class="bar-label" data-astro-cid-74czde43>Ganados</div> <div class="bar-fill" style="width: 60%; background: #ffcccc;" data-astro-cid-74czde43></div> </div> <div class="stat-bar" data-astro-cid-74czde43> <div class="bar-label" data-astro-cid-74czde43>Empatados</div> <div class="bar-fill" style="width: 30%; background: #cce5ff;" data-astro-cid-74czde43></div> </div> <div class="stat-bar" data-astro-cid-74czde43> <div class="bar-label" data-astro-cid-74czde43>Perdidos</div> <div class="bar-fill" style="width: 10%; background: #ffffcc;" data-astro-cid-74czde43></div> </div> </div> </div> </section> </div> </div> </main>  ` })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/partidos/[slug].astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/partidos/[slug].astro";
const $$url = "/partidos/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$slug,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
