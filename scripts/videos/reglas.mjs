// Reglas comunes para reconocer el vídeo resumen de un partido del Real Madrid Femenino.
export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&amp;/g, '&').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const VACIAS = new Set(['club', 'futbol', 'femenino', 'fc', 'cf', 'cd', 'sd', 'ud', 'rcd', 'de', 'del', 'la', 'el', 'women', 'feminas', 'sad', 'real', 'deportivo', 'atletico']);
const ALIAS = { 'valencia cf': ['valencia', 'vcf'], 'levante ud': ['levante'], 'sevilla fc': ['sevilla'], 'granada cf': ['granada'], 'madrid cff': ['madrid cff', 'cff'], 'rcd espanyol': ['espanyol'], 'espanyol': ['espanyol'], 'sporting de huelva': ['huelva'], 'badalona women': ['badalona'], 'bayern munich': ['bayern'], 'bayern munchen': ['bayern'], 'eintracht de frankfurt': ['frankfurt', 'eintracht'], 'atletico de madrid': ['atletico', 'atleti'], 'fc barcelona': ['barcelona', 'barca'], 'deportivo abanca': ['deportivo', 'depor'], 'costa adeje tenerife': ['tenerife'], 'athletic club': ['athletic'], 'real sociedad': ['real sociedad'], 'real betis': ['betis'], 'paris saint germain': ['psg'], 'psg': ['psg', 'paris'], 'manchester city': ['city'] };
export const rivalTokens = rival => {
    const n = norm(rival);
    const toks = n.split(' ').filter(t => t.length >= 4 && !VACIAS.has(t));
    return [...new Set([...(ALIAS[n] || []), ...toks])];
};
// Puntuación de un vídeo para un partido; null si no encaja
export function puntuar(titulo, rival, canal = '', goles = null) {
    const t = norm(titulo);
    if (!/real madrid|madrid cf|r madrid/.test(t)) return null;
    // Excluir otros equipos del club y vídeos que no son resúmenes
    if (/real madrid b\b|madrid b cf|\bjuvenil\b|cadete|castilla|primera federacion|entrenamiento|rueda de prensa|previa|en vivo|en directo|\blive\b|shorts?|exclusivos/.test(t)) return null;
    const femenino = /femenin|women|womens|liga f\b|ligaf|uwcl|frauen|feminin|\bfem\b|copa de la reina|copadelareina|supercopa iberdrola|supercopaiberdrola|supercopa femenina|iberdrola/.test(t);
    const canalFemenino = /women|femen|liga f|frauen/i.test(canal);
    if (!femenino && !canalFemenino) return null;           // evita los resúmenes del equipo masculino
    const toks = rivalTokens(rival);
    if (!toks.some(k => t.includes(k))) return null;
    // Si el título trae marcador, tiene que coincidir con el del partido (en cualquier orden)
    if (goles) {
        const marcadores = [...titulo.matchAll(/(\d{1,2})\s*(?:\(\d+\))?\s*-\s*(\d{1,2})/g)].map(m => [Number(m[1]), Number(m[2])]);
        // El primer número es del equipo que aparece primero en el título
        const iRm = t.search(/real madrid|madrid cf|r madrid/); const iRiv = Math.min(...toks.map(k => t.indexOf(k)).filter(i => i >= 0));
        const esperado = iRm <= iRiv ? [goles[0], goles[1]] : [goles[1], goles[0]];
        if (marcadores.length && !marcadores.some(([a, b]) => a === esperado[0] && b === esperado[1])) return null;
    }
    let p = 1;
    if (/resumen|highlights|resumo|melhores momentos|zusammenfassung/.test(t)) p += 4;
    else if (/golazo|jugadon|casi cae|pone el|el gol de|asistencia/.test(t)) p -= 1;   // clips sueltos
    if (/goles|gols/.test(t)) p += 1;
    if (femenino) p += 1;
    return p;
}
