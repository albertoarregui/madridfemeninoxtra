/**
 * Pestañas de la ficha de jugadora (Info, Estadísticas, Rendimiento, Partidos,
 * Trayectoria). Todo se calcula en el navegador a partir del JSON que la página
 * incluye en #player-insights-data, sin más peticiones.
 */

type Match = Record<string, any> & {
    slug: string; fecha: string; season: string; comp: string; compLabel: string; compLogo: string;
    official: boolean; home: boolean; rival: string; result: "V" | "E" | "D"; minutos: number;
};
type PickerPlayer = { slug: string; name: string; position: string; group: string; photo: string; squad: boolean; number: number | null; g: number | null; a: number | null };
type Data = {
    picker?: { current: string; players: PickerPlayer[] };
    isGoalkeeper: boolean;
    seasons: string[];
    competitions: Array<{ key: string; label: string; logo: string; official: boolean }>;
    matches: Match[];
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const SEASON_MONTHS = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
const ALL = "";
const OFFICIAL = "__oficiales";

// ── Utilidades ───────────────────────────────────────────────────────────────
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string | number) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
};
const num = (value: unknown) => Number(value) || 0;
const fmt = (value: number, digits = 0) =>
    Number.isFinite(value) ? value.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : "–";
const pct = (a: number, b: number) => (b > 0 ? `${fmt((a / b) * 100, 1)}%` : "–");
const sum = (matches: Match[], field: string) => matches.reduce((acc, m) => acc + num(m[field]), 0);
const avgRating = (matches: Match[]) => {
    const rated = matches.filter((m) => m.valoracion != null && num(m.valoracion) > 0);
    return rated.length ? rated.reduce((acc, m) => acc + num(m.valoracion), 0) / rated.length : null;
};
const ratingClass = (rating: number | null) =>
    rating === null ? "r-none" : rating >= 8 ? "r-top" : rating >= 7 ? "r-good" : rating >= 6.5 ? "r-ok" : rating >= 6 ? "r-mid" : "r-low";
const shortDate = (fecha: string) => {
    const [y, m, d] = fecha.split("-").map(Number);
    return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : "";
};
const numericDate = (fecha: string) => {
    const [y, m, d] = fecha.split("-");
    return y && m && d ? `${d}/${m}/${y}` : "";
};
const monthOf = (fecha: string) => Number(fecha.slice(5, 7));
const resultLabel = { V: "Victoria", E: "Empate", D: "Derrota" } as const;

/** Desplegable con el estilo de la web (botón + lista). */
function dropdown(label: string, options: Array<[string, string]>, value: string, onChange: (value: string) => void) {
    const wrap = el("div", "pt-select");
    const caption = el("span", "pt-filter-label", label);
    const button = el("button", "pt-select-trigger");
    button.type = "button";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    const text = el("span", "", options.find(([v]) => v === value)?.[1] ?? options[0]?.[1] ?? "");
    button.append(text);
    button.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>');
    const list = el("ul", "pt-select-list");
    list.setAttribute("role", "listbox");
    list.hidden = true;
    const close = () => { list.hidden = true; button.setAttribute("aria-expanded", "false"); };
    options.forEach(([optionValue, optionLabel]) => {
        const item = el("li", optionValue === value ? "is-active" : "", optionLabel);
        item.setAttribute("role", "option");
        item.tabIndex = -1;
        item.addEventListener("click", () => {
            list.querySelectorAll("li").forEach((li) => li.classList.toggle("is-active", li === item));
            text.textContent = optionLabel;
            close();
            onChange(optionValue);
        });
        item.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); item.click(); } });
        list.append(item);
    });
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        document.querySelectorAll<HTMLElement>(".pt-select-list").forEach((other) => { if (other !== list) other.hidden = true; });
        list.hidden = !list.hidden;
        button.setAttribute("aria-expanded", String(!list.hidden));
        if (!list.hidden) (list.querySelector<HTMLElement>("li.is-active") ?? list.querySelector("li"))?.focus();
    });
    document.addEventListener("click", (event) => { if (!wrap.contains(event.target as Node)) close(); });
    wrap.addEventListener("keydown", (event) => { if (event.key === "Escape") { close(); button.focus(); } });
    wrap.append(caption, button, list);
    return wrap;
}

/** Grupo de pastillas (competiciones). */
function pills(label: string, options: Array<{ value: string; label: string; logo?: string }>, value: string, onChange: (value: string) => void) {
    const wrap = el("div", "pt-filter pt-filter-grow");
    wrap.append(el("span", "pt-filter-label", label));
    const box = el("div", "pt-pills");
    options.forEach((option) => {
        const pill = el("button", `pt-pill${option.value === value ? " is-active" : ""}`);
        pill.type = "button";
        if (option.logo) {
            const img = el("img");
            img.src = option.logo; img.alt = ""; img.width = 16; img.height = 16; img.loading = "lazy";
            pill.append(img);
        }
        pill.append(document.createTextNode(option.label));
        pill.addEventListener("click", () => {
            box.querySelectorAll(".pt-pill").forEach((p) => p.classList.toggle("is-active", p === pill));
            onChange(option.value);
        });
        box.append(pill);
    });
    wrap.append(box);
    return wrap;
}

const framed = (tag: "section" | "div", className: string) => {
    const card = el(tag, `profile-card ${className} mfx-framed`);
    const frame = el("span", "mfx-frame");
    frame.setAttribute("aria-hidden", "true");
    card.append(frame);
    return card;
};

const byCompetition = (matches: Match[], comp: string) =>
    matches.filter((m) => (comp === OFFICIAL ? m.official : comp === ALL ? true : m.comp === comp));

function competitionPills(data: Data, matches: Match[], value: string, onChange: (v: string) => void) {
    const present = new Set(matches.map((m) => m.comp));
    return pills("Competición", [
        { value: OFFICIAL, label: "Oficiales" },
        ...data.competitions.filter((c) => present.has(c.key)).map((c) => ({ value: c.key, label: c.label, logo: c.logo })),
    ], value, onChange);
}

// ── Info ─────────────────────────────────────────────────────────────────────
function radarSvg(axes: Array<{ label: string; display: string; ratio: number }>) {
    const size = 320, center = size / 2, radius = 105;
    const point = (i: number, r: number) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
    };
    const rings = [0.25, 0.5, 0.75, 1].map((k) =>
        `<polygon points="${axes.map((_, i) => point(i, radius * k).join(",")).join(" ")}" class="pt-radar-ring"/>`).join("");
    const spokes = axes.map((_, i) => { const [x, y] = point(i, radius); return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" class="pt-radar-spoke"/>`; }).join("");
    const shape = axes.map((a, i) => point(i, radius * Math.max(0.04, Math.min(1, a.ratio))).join(",")).join(" ");
    const labels = axes.map((a, i) => {
        const [x, y] = point(i, radius + 30);
        const anchor = Math.abs(x - center) < 8 ? "middle" : x > center ? "start" : "end";
        return `<text x="${x}" y="${y - 6}" text-anchor="${anchor}" class="pt-radar-label">${a.label}</text>` +
            `<text x="${x}" y="${y + 10}" text-anchor="${anchor}" class="pt-radar-value">${a.display}</text>`;
    }).join("");
    return `<svg viewBox="-40 -10 ${size + 80} ${size + 20}" role="img" aria-label="Perfil de rendimiento">${rings}${spokes}<polygon points="${shape}" class="pt-radar-shape"/>${labels}</svg>`;
}

function radarAxes(data: Data, matches: Match[]) {
    const minutes = sum(matches, "minutos");
    const per90 = (field: string) => (minutes > 0 ? (sum(matches, field) / minutes) * 90 : 0);
    if (data.isGoalkeeper) {
        const keeper = matches.filter((m) => m.mainKeeper);
        const saves = sum(keeper, "paradas"), conceded = sum(keeper, "encajados");
        const keeperMinutes = sum(keeper, "minutos");
        const savePct = saves + conceded > 0 ? saves / (saves + conceded) : 0;
        const concededPer90 = keeperMinutes > 0 ? (conceded / keeperMinutes) * 90 : 0;
        const savesPer90 = keeperMinutes > 0 ? (saves / keeperMinutes) * 90 : 0;
        const cleanRate = keeper.length ? sum(keeper, "porteriaCero") / keeper.length : 0;
        const longPct = sum(matches, "pases_largo_totales") ? sum(matches, "pases_largo_completados") / sum(matches, "pases_largo_totales") : 0;
        const rating = avgRating(matches) ?? 0;
        return [
            { label: "% PARADAS", display: `${fmt(savePct * 100)}%`, ratio: savePct },
            { label: "ENCAJADOS/90", display: fmt(concededPer90, 2), ratio: 1 - Math.min(concededPer90, 3) / 3 },
            { label: "PARADAS/90", display: fmt(savesPer90, 2), ratio: savesPer90 / 5 },
            { label: "P. A CERO", display: fmt(cleanRate, 2), ratio: cleanRate },
            { label: "% PASE LARGO", display: `${fmt(longPct * 100)}%`, ratio: longPct },
            { label: "VALORACIÓN", display: rating ? fmt(rating, 2) : "–", ratio: rating / 10 },
        ];
    }
    const passPct = sum(matches, "pases_totales") ? sum(matches, "pases_completados") / sum(matches, "pases_totales") : 0;
    return [
        { label: "GOLES/90", display: fmt(per90("goles"), 2), ratio: per90("goles") / 1 },
        { label: "ASIST./90", display: fmt(per90("asistencias"), 2), ratio: per90("asistencias") / 0.6 },
        { label: "TIROS/90", display: fmt(per90("tiros_totales"), 2), ratio: per90("tiros_totales") / 4 },
        { label: "P. CLAVE/90", display: fmt(per90("pases_clave"), 2), ratio: per90("pases_clave") / 3 },
        { label: "% PASE", display: `${fmt(passPct * 100)}%`, ratio: passPct },
        { label: "REGATES/90", display: fmt(per90("regates_completados"), 2), ratio: per90("regates_completados") / 3 },
        { label: "RECUP./90", display: fmt(per90("recuperaciones"), 2), ratio: per90("recuperaciones") / 8 },
    ];
}

function setupInfo(root: HTMLElement, data: Data) {
    const bar = root.querySelector<HTMLElement>('[data-filters="info"]');
    const kpis = root.querySelector<HTMLElement>("[data-info-kpis]");
    const radar = root.querySelector<HTMLElement>("[data-info-radar]");
    if (!bar || !kpis) return;
    const state = { season: data.seasons[0] ?? ALL, comp: OFFICIAL };
    const render = () => {
        const inSeason = data.matches.filter((m) => !state.season || m.season === state.season);
        const matches = byCompetition(inSeason, state.comp);
        bar.replaceChildren(
            dropdown("Temporada", [[ALL, "Todas las temporadas"], ...data.seasons.map((s) => [s, s] as [string, string])], state.season, (v) => { state.season = v; render(); }),
            competitionPills(data, inSeason, state.comp, (v) => { state.comp = v; render(); }),
        );
        const rating = avgRating(matches);
        const keeper = matches.filter((m) => m.mainKeeper);
        const items: Array<[string, string, string?]> = data.isGoalkeeper
            ? [["Partidos", fmt(matches.length)], ["Minutos", fmt(sum(matches, "minutos"))], ["Valoración", rating ? fmt(rating, 2) : "–", ratingClass(rating)],
                ["% Paradas", pct(sum(keeper, "paradas"), sum(keeper, "paradas") + sum(keeper, "encajados"))],
                ["Goles encajados", fmt(sum(keeper, "encajados"))], ["Porterías a cero", fmt(sum(keeper, "porteriaCero"))]]
            : [["Partidos", fmt(matches.length)], ["Minutos", fmt(sum(matches, "minutos"))], ["Valoración", rating ? fmt(rating, 2) : "–", ratingClass(rating)],
                ["Goles", fmt(sum(matches, "goles"))], ["Asistencias", fmt(sum(matches, "asistencias"))], ["G+A", fmt(sum(matches, "goles") + sum(matches, "asistencias"))]];
        kpis.replaceChildren(...items.map(([label, value, cls]) => {
            const item = el("div", "pt-kpi-big");
            item.append(el("strong", cls ? `is-${cls}` : "", value), el("span", "", label));
            return item;
        }));
        if (radar) radar.innerHTML = matches.length ? radarSvg(radarAxes(data, matches)) : '<p class="pt-empty">Sin partidos en esta selección.</p>';
    };
    render();
}

// ── Rendimiento ──────────────────────────────────────────────────────────────
type Stat = { label: string; field?: string; value?: (m: Match[]) => string; count?: boolean };
const ratio = (a: string, b: string) => (m: Match[]) => pct(sum(m, a), sum(m, b));

function categories(isGoalkeeper: boolean): Array<{ title: string; stats: Stat[] }> {
    const cats: Array<{ title: string; stats: Stat[] }> = [
        { title: "Ataque", stats: [
            { label: "Goles", field: "goles", count: true },
            { label: "Goles sin penalti", value: (m) => fmt(sum(m, "goles") - sum(m, "golesPenalti")), count: true, field: "__npg" },
            { label: "Asistencias", field: "asistencias", count: true },
            { label: "Goles + asistencias", field: "__ga", count: true },
            { label: "Fueras de juego", field: "fueras_juego", count: true },
        ] },
        { title: "Disparo", stats: [
            { label: "Tiros", field: "tiros_totales", count: true },
            { label: "Tiros a puerta", field: "tiros_puerta", count: true },
            { label: "% tiros a puerta", value: ratio("tiros_puerta", "tiros_totales") },
            { label: "Toques en el área rival", field: "toques_area_rival", count: true },
        ] },
        { title: "Pase", stats: [
            { label: "Pases clave", field: "pases_clave", count: true },
            { label: "Pases completados", field: "pases_completados", count: true },
            { label: "Pases intentados", field: "pases_totales", count: true },
            { label: "Precisión de pase", value: ratio("pases_completados", "pases_totales") },
            { label: "Pases al último tercio", field: "pases_ultimo_tercio_completados", count: true },
            { label: "Precisión en el último tercio", value: ratio("pases_ultimo_tercio_completados", "pases_ultimo_tercio_totales") },
            { label: "Centros completados", field: "centros_completados", count: true },
            { label: "Centros intentados", field: "centros_totales", count: true },
            { label: "Balones largos completados", field: "pases_largo_completados", count: true },
            { label: "Balones largos intentados", field: "pases_largo_totales", count: true },
            { label: "Precisión en balón largo", value: ratio("pases_largo_completados", "pases_largo_totales") },
        ] },
        { title: "Posesión", stats: [
            { label: "Regates completados", field: "regates_completados", count: true },
            { label: "Regates intentados", field: "regates_totales", count: true },
            { label: "% regates", value: ratio("regates_completados", "regates_totales") },
            { label: "Toques", field: "toques", count: true },
            { label: "Pérdidas", field: "perdidas", count: true },
        ] },
        { title: "Defensa", stats: [
            { label: "Recuperaciones", field: "recuperaciones", count: true },
            { label: "Entradas", field: "entradas", count: true },
            { label: "Intercepciones", field: "intercepciones", count: true },
            { label: "Bloqueos", field: "bloqueos", count: true },
            { label: "Despejes", field: "despejes", count: true },
            { label: "Duelos en suelo ganados", field: "duelos_suelo_ganados", count: true },
            { label: "% duelos en suelo", value: ratio("duelos_suelo_ganados", "duelos_suelo_totales") },
            { label: "Duelos aéreos ganados", field: "duelos_aereos_ganados", count: true },
            { label: "% duelos aéreos", value: ratio("duelos_aereos_ganados", "duelos_aereos_totales") },
            { label: "Veces regateada", field: "regateada", count: true },
        ] },
    ];
    if (isGoalkeeper) {
        cats.push({ title: "Portería", stats: [
            { label: "Paradas", field: "paradas", count: true },
            { label: "% paradas", value: (m) => pct(sum(m, "paradas"), sum(m, "paradas") + sum(m, "encajados")) },
            { label: "Porterías a cero", field: "porteriaCero", count: true },
            { label: "Goles encajados", field: "encajados", count: true },
        ] });
    }
    cats.push({ title: "Disciplina", stats: [
        { label: "Tarjetas amarillas", field: "amarillas", count: true },
        { label: "Tarjetas rojas", field: "rojas", count: true },
        { label: "Faltas recibidas", field: "faltas_recibidas", count: true },
        { label: "Faltas cometidas", field: "faltas_cometidas", count: true },
    ] });
    return cats;
}

function statValue(stat: Stat, matches: Match[], per90: boolean) {
    const minutes = sum(matches, "minutos");
    if (stat.value && !stat.count) return stat.value(matches);
    let total: number;
    if (stat.field === "__ga") total = sum(matches, "goles") + sum(matches, "asistencias");
    else if (stat.field === "__npg") total = sum(matches, "goles") - sum(matches, "golesPenalti");
    else total = sum(matches, stat.field ?? "");
    return per90 ? (minutes > 0 ? fmt((total / minutes) * 90, 2) : "–") : fmt(total);
}

function setupPerformance(root: HTMLElement, data: Data) {
    const bar = root.querySelector<HTMLElement>('[data-filters="perf"]');
    const extra = root.querySelector<HTMLElement>('[data-filters="perf-extra"]');
    const monthsBox = root.querySelector<HTMLElement>("[data-perf-months]");
    const summary = root.querySelector<HTMLElement>("[data-perf-summary]");
    const summaryTitle = root.querySelector<HTMLElement>("[data-perf-summary-title]");
    const rangeBox = root.querySelector<HTMLElement>("[data-perf-range]");
    const cats = root.querySelector<HTMLElement>("[data-perf-cats]");
    const table = root.querySelector<HTMLTableElement>("[data-perf-table]");
    const tableCount = root.querySelector<HTMLElement>("[data-perf-table-count]");
    if (!bar || !extra || !monthsBox || !summary || !cats || !table) return;
    const state = { season: data.seasons[0] ?? ALL, comp: OFFICIAL, per90: false, month: 0, venue: ALL };

    const render = () => {
        const inSeason = data.matches.filter((m) => !state.season || m.season === state.season);
        const base = byCompetition(inSeason, state.comp).filter((m) => !state.venue || (state.venue === "home") === m.home);
        const matches = base.filter((m) => !state.month || monthOf(m.fecha) === state.month);

        // Barra principal: temporada, competición y Totales / Por 90
        const toggle = el("label", "pt-toggle");
        const input = el("input");
        input.type = "checkbox";
        input.checked = state.per90;
        input.addEventListener("change", () => { state.per90 = input.checked; render(); });
        toggle.append(el("span", state.per90 ? "" : "is-on", "Totales"), input, el("span", "pt-toggle-track"), el("span", state.per90 ? "is-on" : "", "Por 90'"));
        toggle.title = "Cambiar entre datos totales y por 90 minutos";
        bar.replaceChildren(
            dropdown("Temporada", [[ALL, "Todas las temporadas"], ...data.seasons.map((s) => [s, s] as [string, string])], state.season, (v) => { state.season = v; state.month = 0; render(); }),
            competitionPills(data, inSeason, state.comp, (v) => { state.comp = v; render(); }),
            toggle,
        );
        // Periodo y sede
        const monthsPresent = SEASON_MONTHS.filter((month) => base.some((m) => monthOf(m.fecha) === month));
        extra.replaceChildren(
            dropdown("Periodo", [["0", "Temporada completa"], ...monthsPresent.map((m) => [String(m), MONTHS[m - 1].toUpperCase()] as [string, string])], String(state.month), (v) => { state.month = Number(v); render(); }),
            dropdown("Sede", [[ALL, "Local y visitante"], ["home", "Local"], ["away", "Visitante"]], state.venue, (v) => { state.venue = v; render(); }),
        );

        // Temporada por meses
        monthsBox.replaceChildren(...SEASON_MONTHS.map((month) => {
            const inMonth = base.filter((m) => monthOf(m.fecha) === month);
            const rating = avgRating(inMonth);
            const cell = el("button", `pt-month${state.month === month ? " is-active" : ""}`);
            cell.type = "button";
            cell.disabled = inMonth.length === 0;
            cell.append(el("span", "pt-month-name", MONTHS[month - 1].toUpperCase()), el("span", `pt-month-chip ${ratingClass(rating)}`),
                el("strong", "", rating ? fmt(rating, 2) : "–"), el("small", "", `${inMonth.length} ${inMonth.length === 1 ? "partido" : "partidos"}`));
            cell.addEventListener("click", () => { state.month = state.month === month ? 0 : month; render(); });
            return cell;
        }));

        // Resumen de la selección
        const rating = avgRating(matches);
        const dates = matches.map((m) => m.fecha).sort();
        if (summaryTitle) summaryTitle.textContent = `${state.month ? MONTHS[state.month - 1].toUpperCase() : "TEMPORADA COMPLETA"} · ${matches.length} ${matches.length === 1 ? "PARTIDO" : "PARTIDOS"}`;
        if (rangeBox) rangeBox.textContent = dates.length ? `${shortDate(dates[0])} – ${shortDate(dates[dates.length - 1])}` : "";
        const minutesTotal = sum(matches, "minutos");
        const shown = (total: number) => state.per90 ? (minutesTotal > 0 ? fmt((total / minutesTotal) * 90, 2) : "–") : fmt(total);
        const suffix = state.per90 ? " /90" : "";
        const summaryItems: Array<[string, string, string?]> = [
            ["Partidos", fmt(matches.length)], ["Minutos", fmt(minutesTotal)],
            ["Valoración media", rating ? fmt(rating, 2) : "–", ratingClass(rating)],
            [`Goles${suffix}`, shown(sum(matches, "goles"))], [`Asistencias${suffix}`, shown(sum(matches, "asistencias"))],
            data.isGoalkeeper ? [`Paradas${suffix}`, shown(sum(matches, "paradas"))] : [`G+A${suffix}`, shown(sum(matches, "goles") + sum(matches, "asistencias"))],
        ];
        summary.replaceChildren(...summaryItems.map(([label, value, cls]) => {
            const item = el("div", "pt-summary-stat");
            item.append(el("span", "", label), el("strong", cls ? `is-${cls}` : "", value));
            return item;
        }));

        // Tarjetas por categoría
        cats.replaceChildren(...categories(data.isGoalkeeper).map((cat) => {
            const card = framed("section", "pt-cat-card");
            card.append(el("h2", "card-title", cat.title.toUpperCase()));
            const list = el("dl", "pt-cat-list");
            cat.stats.forEach((stat) => {
                const row = el("div", "pt-cat-row");
                row.append(el("dt", "", stat.label), el("dd", "", statValue(stat, matches, state.per90 && Boolean(stat.count))));
                list.append(row);
            });
            card.append(list);
            return card;
        }));

        // Partidos de esta selección
        if (tableCount) tableCount.textContent = `${matches.length} ${matches.length === 1 ? "partido" : "partidos"} · más recientes primero`;
        const head = data.isGoalkeeper ? ["Partido", "Sede", "Resultado", "Min", "Paradas", "Encajados", "Valoración"] : ["Partido", "Sede", "Resultado", "Min", "Goles", "Asist.", "Tiros", "Valoración"];
        const thead = el("thead");
        const headRow = el("tr");
        head.forEach((h) => headRow.append(el("th", "", h)));
        thead.append(headRow);
        const tbody = el("tbody");
        matches.forEach((m) => {
            const tr = el("tr");
            const cell = el("td", "pt-table-match");
            const link = el("a");
            link.href = `/partidos/${m.slug}`;
            const shield = m.home ? m.visitorShield : m.localShield;
            if (shield) { const img = el("img"); img.src = shield; img.alt = ""; img.width = 26; img.height = 26; img.loading = "lazy"; link.append(img); }
            const text = el("span");
            text.append(el("strong", "", `${m.rival} →`));
            const meta = el("small");
            meta.append(document.createTextNode(`${shortDate(m.fecha)} · `));
            if (m.compLogo) { const logo = el("img"); logo.src = m.compLogo; logo.alt = ""; logo.width = 14; logo.height = 14; logo.loading = "lazy"; meta.append(logo); }
            meta.append(document.createTextNode(` ${m.compLabel}`));
            text.append(meta);
            link.append(text);
            cell.append(link);
            const rating = m.valoracion != null && num(m.valoracion) > 0 ? num(m.valoracion) : null;
            const score = el("td");
            score.append(document.createTextNode(`${m.localGoals}–${m.visitorGoals} `), el("b", `is-${m.result}`, m.result));
            const ratingCell = el("td");
            ratingCell.append(el("span", `pt-rating ${ratingClass(rating)}`, rating ? fmt(rating, 1) : "–"));
            tr.append(cell, el("td", "", m.home ? "L" : "V"), score, el("td", "", m.minutos));
            (data.isGoalkeeper ? [m.mainKeeper ? m.paradas : "–", m.mainKeeper ? m.encajados : "–"] : [m.goles, m.asistencias, m.tiros_totales ?? "–"])
                .forEach((v) => tr.append(el("td", "", v)));
            tr.append(ratingCell);
            tbody.append(tr);
        });
        table.replaceChildren(thead, tbody);
    };
    render();
}

// ── Partidos ─────────────────────────────────────────────────────────────────
const MATCH_PAGE = 30;
function setupMatches(root: HTMLElement, data: Data) {
    const bar = root.querySelector<HTMLElement>('[data-filters="matches"]');
    const list = root.querySelector<HTMLElement>("[data-match-cards]");
    const empty = root.querySelector<HTMLElement>("[data-match-empty]");
    if (!bar || !list) return;
    const state = { comp: ALL, season: ALL, rival: ALL, limit: MATCH_PAGE };
    const render = () => {
        const inSeason = data.matches.filter((m) => !state.season || m.season === state.season);
        const rivals = [...new Set(inSeason.map((m) => m.rival))].sort((a, b) => a.localeCompare(b, "es"));
        if (state.rival && !rivals.includes(state.rival)) state.rival = ALL;
        const present = new Set(inSeason.map((m) => m.comp));
        if (state.comp && !present.has(state.comp)) state.comp = ALL;
        bar.replaceChildren(
            pills("Competición", [{ value: ALL, label: "Todas" }, ...data.competitions.filter((c) => present.has(c.key)).map((c) => ({ value: c.key, label: c.label, logo: c.logo }))],
                state.comp, (v) => { state.comp = v; state.limit = MATCH_PAGE; render(); }),
            dropdown("Temporada", [[ALL, "Todas las temporadas"], ...data.seasons.map((s) => [s, s] as [string, string])], state.season, (v) => { state.season = v; state.limit = MATCH_PAGE; render(); }),
            dropdown("Rival", [[ALL, "Todos los rivales"], ...rivals.map((r) => [r, r] as [string, string])], state.rival, (v) => { state.rival = v; state.limit = MATCH_PAGE; render(); }),
        );
        const matches = inSeason.filter((m) => (!state.comp || m.comp === state.comp) && (!state.rival || m.rival === state.rival));
        if (empty) empty.hidden = matches.length > 0;
        const cards = matches.slice(0, state.limit).map((m) => {
            const card = el("a", "pt-mcard");
            card.href = `/partidos/${m.slug}`;
            const head = el("div", "pt-mcard-head");
            if (m.compLogo) { const logo = el("img"); logo.src = m.compLogo; logo.alt = ""; logo.width = 22; logo.height = 22; logo.loading = "lazy"; head.append(logo); }
            head.append(el("span", "", m.compLabel));
            const body = el("div", "pt-mcard-body");
            const when = el("div", "pt-mcard-when");
            const status = el("small");
            status.append(document.createTextNode("Final · "), el("b", `is-${m.result}`, resultLabel[m.result as "V" | "E" | "D"]));
            when.append(el("strong", "", numericDate(m.fecha)), status);
            const teams = el("div", "pt-mcard-teams");
            [[m.localName, m.localShield, m.localGoals, m.home], [m.visitorName, m.visitorShield, m.visitorGoals, !m.home]].forEach(([name, shield, goals, isRm]) => {
                const row = el("div", `pt-mcard-team${isRm ? " is-rm" : ""}`);
                if (shield) { const img = el("img"); img.src = String(shield); img.alt = ""; img.width = 24; img.height = 24; img.loading = "lazy"; row.append(img); }
                row.append(el("span", "", String(name)), el("b", "", String(goals)));
                teams.append(row);
            });
            const rating = m.valoracion != null && num(m.valoracion) > 0 ? num(m.valoracion) : null;
            const side = el("div", "pt-mcard-side");
            side.append(el("span", `pt-rating ${ratingClass(rating)}`, rating ? fmt(rating, 1) : "–"), el("small", "", `${m.titular ? "Titular" : "Suplente"} · ${m.minutos}'`));
            const chevron = el("span", "pt-mcard-chevron", "›");
            chevron.setAttribute("aria-hidden", "true");
            body.append(when, teams, side, chevron);
            card.append(head, body);
            return card;
        });
        list.replaceChildren(...cards);
        if (matches.length > state.limit) {
            const more = el("button", "btn-more pt-more", `Cargar más partidos (${matches.length - state.limit} restantes)`);
            more.type = "button";
            more.addEventListener("click", () => { state.limit += MATCH_PAGE; render(); });
            list.append(more);
        }
    };
    render();
}

// ── Estadísticas: línea de temporadas ───────────────────────────────────────
function setupStatsRange(root: HTMLElement) {
    const card = root.querySelector<HTMLElement>("[data-stats-range]");
    if (!card) return;
    const seasons: string[] = JSON.parse(card.dataset.seasons || "[]");
    const from = card.querySelector<HTMLInputElement>("[data-range-from]");
    const to = card.querySelector<HTMLInputElement>("[data-range-to]");
    const label = card.querySelector<HTMLElement>("[data-range-label]");
    const fill = card.querySelector<HTMLElement>("[data-range-fill]");
    const table = root.querySelector<HTMLTableElement>(".stats-table");
    if (!from || !to || !table) return;
    const totalRow = table.querySelector<HTMLTableRowElement>(".career-total-row");
    const update = () => {
        let a = Number(from.value), b = Number(to.value);
        if (a > b) [a, b] = [b, a];
        const selected = new Set(seasons.slice(a, b + 1));
        const count = b - a + 1;
        if (label) label.textContent = `${seasons[a]} – ${seasons[b]} · ${count} ${count === 1 ? "temporada" : "temporadas"}`;
        if (fill && seasons.length > 1) {
            fill.style.left = `${(a / (seasons.length - 1)) * 100}%`;
            fill.style.width = `${((b - a) / (seasons.length - 1)) * 100}%`;
        }
        table.querySelectorAll<HTMLTableRowElement>("tr[data-season]").forEach((row) => {
            row.classList.toggle("pt-out-of-range", !selected.has(row.dataset.season || ""));
        });
        // Recalcula la fila de totales con las temporadas visibles.
        if (totalRow) {
            const seasonRows = [...table.querySelectorAll<HTMLTableRowElement>("tr.season-total-row")].filter((row) => selected.has(row.dataset.season || ""));
            [...totalRow.cells].forEach((cell, index) => {
                if (index === 0) return;
                if (!cell.dataset.original) cell.dataset.original = cell.textContent ?? "";
                const values = seasonRows.map((row) => Number((row.cells[index]?.textContent || "").trim()));
                cell.textContent = values.length && values.every((v) => Number.isFinite(v)) ? String(values.reduce((acc, v) => acc + v, 0)) : cell.dataset.original;
            });
        }
    };
    from.addEventListener("input", update);
    to.addEventListener("input", update);
    update();
}

// ── Selector de jugadoras del encabezado ─────────────────────────────────────
// Misma lógica que el buscador de la web (el nombre contiene lo escrito; antes
// los que empiezan por ello), sin tildes y sin peticiones: la lista va en la página.
const GROUP_ORDER = ["Porteras", "Defensas", "Centrocampistas", "Delanteras", "Otras"];
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function setupPlayerPicker(data: Data) {
    const root = document.querySelector<HTMLElement>("[data-player-picker]");
    if (!root || !data.picker || root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const trigger = root.querySelector<HTMLButtonElement>("[data-picker-trigger]");
    const panel = root.querySelector<HTMLElement>("[data-picker-panel]");
    const search = root.querySelector<HTMLInputElement>("[data-picker-search]");
    const list = root.querySelector<HTMLElement>("[data-picker-list]");
    if (!trigger || !panel || !search || !list) return;
    const { current, players } = data.picker;

    const item = (p: PickerPlayer) => {
        const link = el("a", `pc-item${p.slug === current ? " is-current" : ""}`);
        link.href = `/jugadoras/${p.slug}`;
        link.setAttribute("role", "option");
        link.setAttribute("aria-selected", String(p.slug === current));
        const photo = el("span", "pc-photo");
        if (p.photo) { const img = el("img"); img.src = p.photo; img.alt = ""; img.width = 40; img.height = 40; img.loading = "lazy"; photo.append(img); }
        const text = el("span", "pc-text");
        const stats = p.g != null ? ` · ${p.g}G ${p.a ?? 0}A` : "";
        text.append(el("strong", "", p.name), el("small", "", `${p.position || "Jugadora"}${stats}`));
        link.append(photo, text);
        if (p.number != null) link.append(el("span", "pc-number", p.number));
        return link;
    };
    const render = () => {
        const query = normalize(search.value);
        list.replaceChildren();
        if (!query) {
            const squad = players.filter((p) => p.squad).sort((a, b) => (a.number ?? 99) - (b.number ?? 99));
            GROUP_ORDER.forEach((group) => {
                const inGroup = squad.filter((p) => p.group === group);
                if (!inGroup.length) return;
                list.append(el("p", "pc-group", group), ...inGroup.map(item));
            });
            return;
        }
        const results = players
            .map((p) => ({ p, name: normalize(p.name) }))
            .filter(({ name }) => name.includes(query))
            .sort((x, y) => Number(y.name.startsWith(query)) - Number(x.name.startsWith(query))
                || Number(y.p.squad) - Number(x.p.squad) || x.p.name.localeCompare(y.p.name, "es"))
            .slice(0, 30);
        if (!results.length) { list.append(el("p", "pc-empty", "Sin resultados")); return; }
        list.append(el("p", "pc-group", "Resultados"), ...results.map(({ p }) => item(p)));
    };
    const open = (show: boolean) => {
        panel.hidden = !show;
        trigger.setAttribute("aria-expanded", String(show));
        if (show) { search.value = ""; render(); search.focus(); list.querySelector(".is-current")?.scrollIntoView({ block: "nearest" }); }
    };
    trigger.addEventListener("click", (event) => { event.stopPropagation(); open(panel.hidden); });
    search.addEventListener("input", render);
    const items = () => [...list.querySelectorAll<HTMLAnchorElement>(".pc-item")];
    root.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) { open(false); trigger.focus(); return; }
        if (panel.hidden || (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter")) return;
        const all = items();
        const index = all.indexOf(document.activeElement as HTMLAnchorElement);
        if (event.key === "Enter" && document.activeElement === search && all[0]) { event.preventDefault(); all[0].click(); return; }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const next = event.key === "ArrowDown" ? Math.min(all.length - 1, index + 1) : index - 1;
            if (next < 0) search.focus(); else all[next]?.focus();
        }
    });
    document.addEventListener("click", (event) => { if (!root.contains(event.target as Node)) open(false); });
}

// ── Pestañas ────────────────────────────────────────────────────────────────
function setupTabs(root: HTMLElement) {
    const tabs = [...root.querySelectorAll<HTMLElement>("[data-tab]")];
    const panels = [...root.querySelectorAll<HTMLElement>("[data-panel]")];
    const show = (key: string, updateUrl: boolean) => {
        if (!panels.some((panel) => panel.dataset.panel === key)) key = "info";
        tabs.forEach((tab) => {
            const active = tab.dataset.tab === key;
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
        });
        panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== key; });
        if (updateUrl) {
            const url = new URL(location.href);
            if (key === "info") url.searchParams.delete("seccion"); else url.searchParams.set("seccion", key);
            history.replaceState(history.state, "", url);
        }
    };
    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => show(tab.dataset.tab || "info", true));
        tab.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            const next = tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
            next.focus();
            show(next.dataset.tab || "info", true);
        });
    });
    show(new URLSearchParams(location.search).get("seccion") || "info", false);
}

export function initPlayerInsights() {
    const root = document.querySelector<HTMLElement>(".player-content");
    if (!root || root.dataset.insightsReady === "true") return;
    root.dataset.insightsReady = "true";
    setupTabs(root);
    setupStatsRange(root);
    const source = document.getElementById("player-insights-data");
    if (!source) return;
    const data: Data = JSON.parse(source.textContent || "{}");
    setupInfo(root, data);
    setupPerformance(root, data);
    setupMatches(root, data);
    setupPlayerPicker(data);
}
