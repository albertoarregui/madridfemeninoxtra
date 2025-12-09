import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, u as unescapeHTML, h as addAttribute } from '../../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../../chunks/Layout_CTgb0INN.mjs';
/* empty css                                          */
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  let post;
  try {
    const response = await fetch(
      `https://cms.madridfemeninoxtra.com/wp-json/wp/v2/posts?slug=${slug}&_embed=true`
    );
    const posts = await response.json();
    post = posts[0];
  } catch (error) {
    console.error("Error fetching post:", error);
  }
  if (!post) {
    return Astro2.redirect("/404");
  }
  function formatDate(dateString) {
    const date2 = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date2);
  }
  const title = post.title.rendered;
  const content = post.content.rendered;
  const date = formatDate(post.date);
  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const featuredImageAlt = post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text || title;
  const categories = post._embedded?.["wp:term"]?.[0]?.map((cat) => cat.name).join(", ") || "";
  let subtitle = "";
  if (post.meta && post.meta.subtitulo) {
    subtitle = post.meta.subtitulo;
  } else if (post.meta && post.meta._subtitulo) {
    subtitle = post.meta._subtitulo;
  } else if (post.acf && post.acf.subtitulo) {
    subtitle = post.acf.subtitulo;
  } else if (post.excerpt && post.excerpt.rendered) {
    subtitle = post.excerpt.rendered;
  }
  const currentUrl = `https://www.madridfemeninoxtra.com/noticias/${post.slug}`;
  const shareTitle = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(currentUrl);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${title} | Madrid Femenino Xtra`, "description": subtitle ? subtitle.replace(/<[^>]*>/g, "").substring(0, 160) : `Noticia del Real Madrid Femenino`, "data-astro-cid-se4o7pmu": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="news-detail-page" data-astro-cid-se4o7pmu> <article class="news-article" data-astro-cid-se4o7pmu> <header class="article-header" data-astro-cid-se4o7pmu> <!-- Category above title, centered --> ${categories && renderTemplate`<div class="article-category-container" data-astro-cid-se4o7pmu> <span class="article-category" data-astro-cid-se4o7pmu>${categories}</span> </div>`} <h1 class="article-title" data-astro-cid-se4o7pmu>${unescapeHTML(title)}</h1> <!-- Subtitle below title --> ${subtitle && renderTemplate`<div class="article-subtitle" data-astro-cid-se4o7pmu>${unescapeHTML(subtitle)}</div>`} <!-- Separator Line --> <div class="header-separator" data-astro-cid-se4o7pmu></div> </header> ${featuredImage && renderTemplate`<div class="article-image-container" data-astro-cid-se4o7pmu> <img class="article-image"${addAttribute(featuredImage, "src")}${addAttribute(featuredImageAlt, "alt")} data-astro-cid-se4o7pmu> </div>`} <!-- Social Share Buttons --> <div class="share-container" data-astro-cid-se4o7pmu> <span class="share-label" data-astro-cid-se4o7pmu>Compartir:</span> <div class="share-buttons" data-astro-cid-se4o7pmu> <a${addAttribute(`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`, "href")} class="share-btn twitter" target="_blank" aria-label="Compartir en X" data-astro-cid-se4o7pmu> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-se4o7pmu><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" data-astro-cid-se4o7pmu></path></svg> </a> <a${addAttribute(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, "href")} class="share-btn facebook" target="_blank" aria-label="Compartir en Facebook" data-astro-cid-se4o7pmu> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-se4o7pmu><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.594v.418h3.837l-.51 3.667h-3.327v7.98h-4.843Z" data-astro-cid-se4o7pmu></path></svg> </a> <a${addAttribute(`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`, "href")} class="share-btn whatsapp" target="_blank" aria-label="Compartir en WhatsApp" data-astro-cid-se4o7pmu> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-se4o7pmu><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" data-astro-cid-se4o7pmu></path></svg> </a> <a href="https://www.instagram.com/" class="share-btn instagram" target="_blank" aria-label="Compartir en Instagram" data-astro-cid-se4o7pmu> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-se4o7pmu><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" data-astro-cid-se4o7pmu></path></svg> </a> </div> </div> <!-- Date and Time above content --> <div class="article-meta-date" data-astro-cid-se4o7pmu> <span class="article-date" data-astro-cid-se4o7pmu>${date}</span> </div> <div class="article-content" data-astro-cid-se4o7pmu>${unescapeHTML(content)}</div> <a href="/noticias" class="article-footer" data-astro-cid-se4o7pmu>← Más noticias</a> </article> </main>  ` })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/noticias/[slug].astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/noticias/[slug].astro";
const $$url = "/noticias/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$slug,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
