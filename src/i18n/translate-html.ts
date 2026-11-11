import { translateText } from "./translate-core";

export { interfaceReplacements } from "./translate-html-legacy";

const decode = (value: string) => value
  .replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const encodeText = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const encodeAttr = (value: string) => encodeText(value).replace(/"/g, "&quot;");

function translateSegment(html: string): string {
  // Etiquetas ambiguas (V/E/D, días de la semana) llevan su traducción en data-en.
  html = html.replace(/(<[a-z][^>]*\sdata-en="([^"]*)"[^>]*>)\s*[^<]*</gi, (_m, open: string, en: string) => `${open}${en}<`);
  // Texto entre etiquetas.
  html = html.replace(/>([^<>]+)</g, (match, text: string) => {
    const translated = translateText(decode(text));
    return translated === decode(text) ? match : `>${encodeText(translated)}<`;
  });
  // Atributos visibles para el usuario y lectores de pantalla.
  html = html.replace(/(\s(?:placeholder|title|aria-label|alt|data-label-light|data-label-dark)=")([^"]*)"/g, (match, start: string, value: string) => {
    const translated = translateText(decode(value));
    return translated === decode(value) ? match : `${start}${encodeAttr(translated)}"`;
  });
  // Metadatos (descripción y redes sociales).
  html = html.replace(/(<meta\b[^>]*\scontent=")([^"]*)("[^>]*>)/g, (match, start: string, value: string, end: string) => {
    if (!/(?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description)"/.test(match)) return match;
    const translated = translateText(decode(value));
    return translated === decode(value) ? match : `${start}${encodeAttr(translated)}${end}`;
  });
  return html;
}

/**
 * Traduce la interfaz del HTML ya renderizado. Scripts, estilos y bloques de
 * código no se tocan: los datos serializados de los componentes conservan sus
 * valores originales.
 */
export function translateInterfaceHtml(input: string): string {
  const parts = input.split(/(<(script|style|pre|code|textarea)\b[\s\S]*?<\/\2>)/i);
  let html = "";
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (index % 3 === 1) { html += part; index++; continue; }
    html += translateSegment(part);
  }
  html = html.replace(/href="\/(?!en(?:\/|\")|api\/|_astro\/|assets\/|icon|site\.webmanifest|rss\.xml|sitemap\.xml)([^"]*)"/g, 'href="/en/$1"');
  return html;
}
