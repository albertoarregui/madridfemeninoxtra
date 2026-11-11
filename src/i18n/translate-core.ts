/**
 * Traducción al inglés por nodo completo. Lo usan el middleware (HTML del
 * servidor) y el script del navegador (contenido que pintan los componentes).
 * Solo se traduce un texto cuando coincide entero con una entrada o con una
 * plantilla; el resto (noticias, biografías) se deja intacto, así nunca
 * aparecen frases a medio traducir.
 */
import { EN_COUNTRIES, EN_EXACT, EN_MONTHS, EN_MONTHS_SHORT, EN_PATTERNS } from "./en-dictionary";
import { interfaceReplacements } from "./translate-html-legacy";

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const exact = new Map<string, string>();
for (const [source, target] of interfaceReplacements) exact.set(normalize(source), target);
for (const [source, target] of Object.entries(EN_COUNTRIES)) exact.set(source, target);
for (const [source, target] of Object.entries(EN_EXACT)) exact.set(normalize(source), target);

const lower = new Map<string, string>();
for (const [source, target] of exact) if (!lower.has(source.toLowerCase())) lower.set(source.toLowerCase(), target);

const patterns = EN_PATTERNS.map(([source, target]) => [new RegExp(source), target] as const);

const monthNames = Object.keys(EN_MONTHS).join("|");
const shortMonths = Object.keys(EN_MONTHS_SHORT).join("|");
const longDate = new RegExp(`^(\\d{1,2}) de (${monthNames}) de (\\d{4})$`, "i");
const monthYear = new RegExp(`^(${monthNames}) de (\\d{4})$`, "i");
const shortDate = new RegExp(`^(\\d{1,2}) (${shortMonths})\\.? (\\d{4})$`, "i");
const shortDateRange = new RegExp(`^(\\d{1,2}) (${shortMonths})\\.? (\\d{4}) – (\\d{1,2}) (${shortMonths})\\.? (\\d{4}) · (\\d+) partidos?$`, "i");

/** Aplica la capitalización del original (MAYÚSCULAS o Inicial). */
function matchCase(source: string, target: string): string {
  const letters = source.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length > 1 && letters === letters.toUpperCase()) return target.toUpperCase();
  return target;
}

function translateCore(text: string): string | null {
  const direct = exact.get(text);
  if (direct !== undefined) return direct;
  const insensitive = lower.get(text.toLowerCase());
  if (insensitive !== undefined) return matchCase(text, insensitive);

  let m = text.match(longDate);
  if (m) return `${m[1]} ${EN_MONTHS[m[2].toLowerCase()]} ${m[3]}`;
  m = text.match(monthYear);
  if (m) return `${EN_MONTHS[m[1].toLowerCase()]} ${m[2]}`;
  m = text.match(shortDate);
  if (m) return matchCase(text, `${m[1]} ${EN_MONTHS_SHORT[m[2].toLowerCase()]} ${m[3]}`);
  m = text.match(shortDateRange);
  if (m) return `${m[1]} ${EN_MONTHS_SHORT[m[2].toLowerCase()]} ${m[3]} – ${m[4]} ${EN_MONTHS_SHORT[m[5].toLowerCase()]} ${m[6]} · ${m[7]} ${m[7] === "1" ? "match" : "matches"}`;

  const stats = translateStatList(text);
  if (stats) return stats;

  for (const [regex, target] of patterns) {
    const match = text.match(regex);
    if (!match) continue;
    // {t:N} traduce la captura N (p. ej. «Última actualización: octubre de 2026»).
    return text.replace(regex, target).replace(/\{t:(\d)\}/g, (_m, n: string) => {
      const capture = match[Number(n)] ?? "";
      return translateCore(capture) ?? capture;
    });
  }

  // Los textos del servidor dicen «Real Madrid Femenino»; el diccionario usa «Women».
  if (/Real Madrid Femenino/.test(text)) {
    const variant = text.replace(/Real Madrid Femenino/g, "Real Madrid Women");
    return translateCore(variant) ?? null;
  }
  return null;
}

const STAT_WORDS: Record<string, [string, string]> = {
  partido: ["match", "matches"], partidos: ["match", "matches"], gol: ["goal", "goals"], goles: ["goal", "goals"],
  asistencia: ["assist", "assists"], asistencias: ["assist", "assists"], parada: ["save", "saves"], paradas: ["save", "saves"],
  "portería a cero": ["clean sheet", "clean sheets"], "porterías a cero": ["clean sheet", "clean sheets"],
  minuto: ["minute", "minutes"], minutos: ["minute", "minutes"], tarjeta: ["card", "cards"], tarjetas: ["card", "cards"],
};
const STAT_ITEM = new RegExp(`^(\\d+) (${Object.keys(STAT_WORDS).sort((a, b) => b.length - a.length).join("|")})$`);

/** «Nombre: 12 partidos, 1 gol, 1 asistencia» con singular y plural correctos. */
function translateStatList(text: string): string | null {
  const match = text.match(/^(.+?): (\d+ [^,]+(?:, \d+ [^,]+)+)$/);
  if (!match) return null;
  const items = match[2].split(", ").map((item) => {
    const parts = item.match(STAT_ITEM);
    if (!parts) return null;
    const [singular, plural] = STAT_WORDS[parts[2]];
    return `${parts[1]} ${parts[1] === "1" ? singular : plural}`;
  });
  if (items.some((item) => item === null)) return null;
  return `${match[1]}: ${items.join(", ")}`;
}

/** Traduce un texto conservando los espacios de los extremos. */
export function translateText(value: string): string {
  const text = normalize(value);
  if (!text || !/[A-Za-zÀ-ÿ]/.test(text)) return value;
  const translated = translateCore(text);
  if (translated === null || translated === text) return value;
  const lead = value.match(/^\s*/)?.[0] ?? "";
  const trail = value.match(/\s*$/)?.[0] ?? "";
  return lead + translated + trail;
}
