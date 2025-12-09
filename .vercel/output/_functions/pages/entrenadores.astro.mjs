import { e as createComponent, r as renderTemplate, n as defineScriptVars, h as addAttribute, m as maybeRenderHead, k as renderComponent } from '../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../chunks/Layout_CTgb0INN.mjs';
/* empty css                                       */
import { f as fetchCoachesDirectly } from '../chunks/entrenadores_CEWS4xox.mjs';
import { _ as __vite_glob_0_2, b as __vite_glob_0_1, c as __vite_glob_0_0 } from '../chunks/pau_quesada_BWeVdSVJ.mjs';
import { C as COUNTRIES } from '../chunks/countries_DZLs-gpP.mjs';
/* empty css                                        */
export { renderers } from '../renderers.mjs';

const COACHES = [
  {
    id: "david-aznar",
    name: "David Aznar",
    city: "Talavera de la Reina",
    country: "es",
    date_birth: "1980-03-09"
  },
  {
    id: "alberto-toril",
    name: "Alberto Toril",
    city: "Peñarroya-Pueblonuevo",
    country: "es",
    date_birth: "1973-07-07"
  },
  {
    id: "pau-quesada",
    name: "Pau Quesada",
    city: "Cullera",
    country: "es",
    date_birth: "1992-10-31"
  }
];

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Coaches = createComponent(($$result, $$props, $$slots) => {
  const listofCoaches = COACHES.map((coach) => {
    const { country } = coach;
    const countryName = COUNTRIES[country]?.name || "";
    return { ...coach, countryName };
  });
  const coachImages = /* #__PURE__ */ Object.assign({"/src/assets/entrenadores/alberto_toril.png": __vite_glob_0_0,"/src/assets/entrenadores/david_aznar.png": __vite_glob_0_1,"/src/assets/entrenadores/pau_quesada.png": __vite_glob_0_2


});
  function getCoachImageSrc(coachId) {
    const imageId = coachId.replace(/-/g, "_");
    const imagePath = `/src/assets/entrenadores/${imageId}.png`;
    return coachImages[imagePath]?.default;
  }
  function calculateAge(birthDateString) {
    const birthDate = new Date(birthDateString);
    const today = /* @__PURE__ */ new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birthDate.getDate()) {
      age--;
    }
    return age;
  }
  return renderTemplate(_a || (_a = __template(["", '<section class="coach-selector" data-astro-cid-dv4kc57w> <div class="coach-container" data-astro-cid-dv4kc57w> <div class="main-coach-display" data-astro-cid-dv4kc57w> <div class="coach-main-image-container" data-astro-cid-dv4kc57w> <img id="coach-main-image"', "", ' class="coach-main-image" data-astro-cid-dv4kc57w> </div> <h2 class="coach-name" id="coach-name" data-astro-cid-dv4kc57w> ', ' </h2> <div class="coach-country" data-astro-cid-dv4kc57w> <img id="coach-flag"', "", ' class="country-flag" data-astro-cid-dv4kc57w> </div> <div class="coach-stats" data-astro-cid-dv4kc57w> <div class="stat-item" data-astro-cid-dv4kc57w> <span class="stat-label" data-astro-cid-dv4kc57w>Edad</span> <span class="stat-value" id="coach-age" data-astro-cid-dv4kc57w>', '</span> </div> </div> <div class="coach-actions" data-astro-cid-dv4kc57w> <a', ' id="coach-profile-link" class="btn-profile" data-astro-cid-dv4kc57w>\nVer perfil\n</a> </div> </div> <div class="coach-thumbnails-container" data-astro-cid-dv4kc57w> <button class="carousel-arrow left" id="carousel-prev" aria-label="Previous coach" data-astro-cid-dv4kc57w> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-dv4kc57w><path d="m15 18-6-6 6-6" data-astro-cid-dv4kc57w></path></svg> </button> <div class="coach-thumbnails-wrapper" data-astro-cid-dv4kc57w> <div class="coach-thumbnails" id="coach-thumbnails-track" data-astro-cid-dv4kc57w> ', ' </div> </div> <button class="carousel-arrow right" id="carousel-next" aria-label="Next coach" data-astro-cid-dv4kc57w> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-dv4kc57w><path d="m9 18 6-6-6-6" data-astro-cid-dv4kc57w></path></svg> </button> </div> </div> </section> <script>(function(){', '\n    function calculateAge(birthDateString) {\n        const birthDate = new Date(birthDateString);\n        const today = new Date();\n        let age = today.getFullYear() - birthDate.getFullYear();\n        const monthDiff = today.getMonth() - birthDate.getMonth();\n        if (\n            monthDiff < 0 ||\n            (monthDiff === 0 && today.getDate() < birthDate.getDate())\n        ) {\n            age--;\n        }\n        return age;\n    }\n\n    let selectedIndex = 0;\n\n    function updateCoachDisplay(index, isSelection = false) {\n        const coach = coaches[index];\n        if (!coach) return;\n\n        if (isSelection) {\n            selectedIndex = index;\n        }\n\n        const setContent = (id, text) => {\n            const el = document.getElementById(id);\n            if (el) el.textContent = text;\n        };\n\n        setContent("coach-name", coach.name);\n        setContent("coach-city", coach.city);\n        setContent("coach-age", calculateAge(coach.date_birth));\n\n        const flag = document.getElementById("coach-flag");\n        if (flag) {\n            flag.src = `https://flagcdn.com/w40/${coach.country}.png`;\n            flag.alt = coach.countryName;\n        }\n\n        const imgElement = document.getElementById("coach-main-image");\n        if (imgElement) {\n            const thumbButton = document.querySelector(\n                `button[data-coach-id="${coach.id}"]`,\n            );\n            if (thumbButton && thumbButton.dataset.coachImage) {\n                imgElement.src = thumbButton.dataset.coachImage;\n            }\n            imgElement.alt = coach.name;\n        }\n\n        const link = document.getElementById("coach-profile-link");\n        if (link) {\n            link.href = `/entrenadores/${coach.id}`;\n        }\n\n        document.querySelectorAll(".coach-thumbnail").forEach((thumb) => {\n            const thumbIndex = parseInt(thumb.dataset.coachIndex || "-1");\n            thumb.classList.toggle("active", thumbIndex === selectedIndex);\n        });\n    }\n\n    // Carousel Logic\n    const wrapper = document.querySelector(".coach-thumbnails-wrapper");\n    const prevBtn = document.getElementById("carousel-prev");\n    const nextBtn = document.getElementById("carousel-next");\n\n    function scrollCarousel(direction) {\n        if (!wrapper) return;\n\n        // On mobile, scroll by item width + gap\n        // On desktop, this function isn\'t used as arrows are hidden, but good to have logic\n        const itemSize = 120 + 16; // approx width + gap\n        const scrollAmount = direction * itemSize;\n\n        wrapper.scrollBy({ left: scrollAmount, behavior: "smooth" });\n    }\n\n    if (prevBtn) {\n        prevBtn.addEventListener("click", () => scrollCarousel(-1));\n    }\n\n    if (nextBtn) {\n        nextBtn.addEventListener("click", () => scrollCarousel(1));\n    }\n\n    document.querySelectorAll(".coach-thumbnail").forEach((thumb) => {\n        thumb.addEventListener("mouseenter", (e) => {\n            // Only on desktop\n            if (window.innerWidth > 768) {\n                const target = e.currentTarget;\n                if (target && target.dataset.coachIndex) {\n                    const index = parseInt(target.dataset.coachIndex);\n                    updateCoachDisplay(index, false);\n                }\n            }\n        });\n\n        thumb.addEventListener("click", (e) => {\n            const target = e.currentTarget;\n            if (target && target.dataset.coachIndex) {\n                const index = parseInt(target.dataset.coachIndex);\n                updateCoachDisplay(index, true);\n            }\n        });\n    });\n\n    if (wrapper) {\n        wrapper.addEventListener("mouseleave", () => {\n            // Only on desktop\n            if (window.innerWidth > 768) {\n                updateCoachDisplay(selectedIndex, false);\n            }\n        });\n    }\n})();<\/script> '], ["", '<section class="coach-selector" data-astro-cid-dv4kc57w> <div class="coach-container" data-astro-cid-dv4kc57w> <div class="main-coach-display" data-astro-cid-dv4kc57w> <div class="coach-main-image-container" data-astro-cid-dv4kc57w> <img id="coach-main-image"', "", ' class="coach-main-image" data-astro-cid-dv4kc57w> </div> <h2 class="coach-name" id="coach-name" data-astro-cid-dv4kc57w> ', ' </h2> <div class="coach-country" data-astro-cid-dv4kc57w> <img id="coach-flag"', "", ' class="country-flag" data-astro-cid-dv4kc57w> </div> <div class="coach-stats" data-astro-cid-dv4kc57w> <div class="stat-item" data-astro-cid-dv4kc57w> <span class="stat-label" data-astro-cid-dv4kc57w>Edad</span> <span class="stat-value" id="coach-age" data-astro-cid-dv4kc57w>', '</span> </div> </div> <div class="coach-actions" data-astro-cid-dv4kc57w> <a', ' id="coach-profile-link" class="btn-profile" data-astro-cid-dv4kc57w>\nVer perfil\n</a> </div> </div> <div class="coach-thumbnails-container" data-astro-cid-dv4kc57w> <button class="carousel-arrow left" id="carousel-prev" aria-label="Previous coach" data-astro-cid-dv4kc57w> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-dv4kc57w><path d="m15 18-6-6 6-6" data-astro-cid-dv4kc57w></path></svg> </button> <div class="coach-thumbnails-wrapper" data-astro-cid-dv4kc57w> <div class="coach-thumbnails" id="coach-thumbnails-track" data-astro-cid-dv4kc57w> ', ' </div> </div> <button class="carousel-arrow right" id="carousel-next" aria-label="Next coach" data-astro-cid-dv4kc57w> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-dv4kc57w><path d="m9 18 6-6-6-6" data-astro-cid-dv4kc57w></path></svg> </button> </div> </div> </section> <script>(function(){', '\n    function calculateAge(birthDateString) {\n        const birthDate = new Date(birthDateString);\n        const today = new Date();\n        let age = today.getFullYear() - birthDate.getFullYear();\n        const monthDiff = today.getMonth() - birthDate.getMonth();\n        if (\n            monthDiff < 0 ||\n            (monthDiff === 0 && today.getDate() < birthDate.getDate())\n        ) {\n            age--;\n        }\n        return age;\n    }\n\n    let selectedIndex = 0;\n\n    function updateCoachDisplay(index, isSelection = false) {\n        const coach = coaches[index];\n        if (!coach) return;\n\n        if (isSelection) {\n            selectedIndex = index;\n        }\n\n        const setContent = (id, text) => {\n            const el = document.getElementById(id);\n            if (el) el.textContent = text;\n        };\n\n        setContent("coach-name", coach.name);\n        setContent("coach-city", coach.city);\n        setContent("coach-age", calculateAge(coach.date_birth));\n\n        const flag = document.getElementById("coach-flag");\n        if (flag) {\n            flag.src = \\`https://flagcdn.com/w40/\\${coach.country}.png\\`;\n            flag.alt = coach.countryName;\n        }\n\n        const imgElement = document.getElementById("coach-main-image");\n        if (imgElement) {\n            const thumbButton = document.querySelector(\n                \\`button[data-coach-id="\\${coach.id}"]\\`,\n            );\n            if (thumbButton && thumbButton.dataset.coachImage) {\n                imgElement.src = thumbButton.dataset.coachImage;\n            }\n            imgElement.alt = coach.name;\n        }\n\n        const link = document.getElementById("coach-profile-link");\n        if (link) {\n            link.href = \\`/entrenadores/\\${coach.id}\\`;\n        }\n\n        document.querySelectorAll(".coach-thumbnail").forEach((thumb) => {\n            const thumbIndex = parseInt(thumb.dataset.coachIndex || "-1");\n            thumb.classList.toggle("active", thumbIndex === selectedIndex);\n        });\n    }\n\n    // Carousel Logic\n    const wrapper = document.querySelector(".coach-thumbnails-wrapper");\n    const prevBtn = document.getElementById("carousel-prev");\n    const nextBtn = document.getElementById("carousel-next");\n\n    function scrollCarousel(direction) {\n        if (!wrapper) return;\n\n        // On mobile, scroll by item width + gap\n        // On desktop, this function isn\'t used as arrows are hidden, but good to have logic\n        const itemSize = 120 + 16; // approx width + gap\n        const scrollAmount = direction * itemSize;\n\n        wrapper.scrollBy({ left: scrollAmount, behavior: "smooth" });\n    }\n\n    if (prevBtn) {\n        prevBtn.addEventListener("click", () => scrollCarousel(-1));\n    }\n\n    if (nextBtn) {\n        nextBtn.addEventListener("click", () => scrollCarousel(1));\n    }\n\n    document.querySelectorAll(".coach-thumbnail").forEach((thumb) => {\n        thumb.addEventListener("mouseenter", (e) => {\n            // Only on desktop\n            if (window.innerWidth > 768) {\n                const target = e.currentTarget;\n                if (target && target.dataset.coachIndex) {\n                    const index = parseInt(target.dataset.coachIndex);\n                    updateCoachDisplay(index, false);\n                }\n            }\n        });\n\n        thumb.addEventListener("click", (e) => {\n            const target = e.currentTarget;\n            if (target && target.dataset.coachIndex) {\n                const index = parseInt(target.dataset.coachIndex);\n                updateCoachDisplay(index, true);\n            }\n        });\n    });\n\n    if (wrapper) {\n        wrapper.addEventListener("mouseleave", () => {\n            // Only on desktop\n            if (window.innerWidth > 768) {\n                updateCoachDisplay(selectedIndex, false);\n            }\n        });\n    }\n})();<\/script> '])), maybeRenderHead(), addAttribute(getCoachImageSrc(listofCoaches[0].id)?.src, "src"), addAttribute(listofCoaches[0].name, "alt"), listofCoaches[0].name, addAttribute(`https://flagcdn.com/w40/${listofCoaches[0].country}.png`, "src"), addAttribute(listofCoaches[0].countryName, "alt"), calculateAge(listofCoaches[0].date_birth), addAttribute(`/entrenadores/${listofCoaches[0].id}`, "href"), listofCoaches.map((coach, index) => {
    const coachImgSrc = getCoachImageSrc(coach.id)?.src;
    return renderTemplate`<button${addAttribute(`coach-thumbnail ${index === 0 ? "active" : ""}`, "class")}${addAttribute(coach.id, "data-coach-id")}${addAttribute(index, "data-coach-index")}${addAttribute(coachImgSrc, "data-coach-image")}${addAttribute(`Select ${coach.name}`, "aria-label")} data-astro-cid-dv4kc57w> <div class="thumbnail-image-wrapper" data-astro-cid-dv4kc57w> <img${addAttribute(coachImgSrc, "src")}${addAttribute(coach.name, "alt")} class="thumbnail-image" data-astro-cid-dv4kc57w> </div> </button>`;
  }), defineScriptVars({ coaches: listofCoaches }));
}, "C:/Users/PC/madridfemeninoxtra/src/sections/Coaches.astro", void 0);

const $$Entrenadores = createComponent(async ($$result, $$props, $$slots) => {
  await fetchCoachesDirectly();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Entrenadores del Real Madrid Femenino | Madrid Femenino Xtra", "description": "Todos los entrenadores del Real Madrid a lo largo de su historia: datos, estad\xEDsticas, partidos y porcentaje de victorias. " }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"> <h1 class="page-title text-4xl font-bold text-center text-gray-900 mb-2">
ENTRENADORES
</h1> <h2 class="content-h2">
Todos los entrenadores del Real Madrid a lo largo de su historia:
            datos, estadísticas, partidos y porcentaje de victorias. Sigue toda
            la actualidad del Real Madrid en Madrid Femenino Xtra.
</h2> ${renderComponent($$result2, "Coaches", $$Coaches, {})} </main> ` })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/entrenadores.astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/entrenadores.astro";
const $$url = "/entrenadores";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Entrenadores,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
