// ── Escudos por nombre de club (trayectorias) ───────────────────────────────
// Coincidencia estricta: mismas palabras significativas, sin siglas genéricas
// ni marcas de filial o cantera (así «Real Madrid B» usa el escudo del Real
// Madrid, pero «Sporting CP» no toma el del Sporting de Huelva).
const SHIELD_STOPWORDS = new Set(['fc', 'cf', 'cd', 'ud', 'sd', 'club', 'de', 'del', 'la', 'el', 'futbol', 'femenino', 'femenina',
    'women', 'ladies', 'sad', 'sc', 'afc', 'cfc', 'the', 'rcd', 'ffc', 'bk', 'if', 'ik', 'fk', 'ff', 'sv', 'vfl', 'real']);
const cleanClubName = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/categorias inferiores( del| de)?/g, ' ')
    // Filiales, categorías y cargos («Castilla», «Ilicitano», «(entrenador asistente)»…)
    // usan el escudo del club principal.
    .replace(/\b(cadete|juvenil|infantil|youth|academy|cantera|castilla|ilicitano|reserves?|asistente|entrenador|sub ?\d+|u ?\d+)\b/g, ' ')
    .replace(/[^a-z0-9ø]+/g, ' ').replace(/\b(a|b|c|ii)\b/g, ' ').replace(/\s+/g, ' ').trim();
const clubTokens = (name: string) => [...new Set(cleanClubName(name).split(' ').filter((t) => t && !SHIELD_STOPWORDS.has(t)))];
const shieldFileSlug = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/**
 * Devuelve una función que da el escudo de un club por su nombre. Si no está
 * en `clubes`, propone `escudos/<nombre>.webp` en R2 (misma convención que los
 * escudos actuales): la imagen debe ocultarse si ese archivo aún no existe.
 */
// Mismo club con otro nombre en las trayectorias o el mercado → nombre en `clubes`.
const CLUB_ALIASES: Record<string, string> = {
    'paris saint-germain': 'PSG', 'paris saint germain': 'PSG',
    'vfl wolfsburg': 'Wolfsburgo', 'wolfsburg': 'Wolfsburgo',
    'b. k. häcken': 'Häcken', 'bk häcken': 'Häcken', 'b.k. häcken': 'Häcken',
    'roma': 'AS Roma',
    'sporting cp': 'Sporting de Portugal',
    'osasuna': 'Fundación Osasuna', 'ca osasuna': 'Fundación Osasuna',
    'deportivo alavés': 'Alavés',
    'deportivo la coruña': 'Deportivo Abanca', 'deportivo de la coruña': 'Deportivo Abanca',
    'udg tenerife': 'Costa Adeje Tenerife', 'udg tenerife b': 'Costa Adeje Tenerife',
    // Un único escudo por club: filiales, categorías y grafías alternativas
    // usan el archivo del club principal (escudos/<club>.webp).
    'bordeaux': 'Girondins de Bordeaux',
    'categorías inferiores montpellier': 'Montpellier', 'san pascual montpellier': 'San Pascual Montpellier',
    'elche ilicitano': 'Elche CF',
    'toluca femenil': 'Toluca',
    'olympique lyon': 'OL Lyonnes', 'olympique lyonnais': 'OL Lyonnes',
    'brøndby': 'Brøndby IF',
    'fortuna hjøorring': 'Fortuna Hjørring',
    'rosengard': 'FC Rosengård',
    'linköpings': 'Linköpings FC',
    'fermaguín': 'CD Femarguín',
    'olympia las rozas': 'CFF Olympia Las Rozas',
    'ciudad del fútbol las rozas': 'Ciudad del Fútbol',
    'albacete juvenil a': 'Albacete Balompié (cantera)',
    'as saint-étienne (categorías inferiores)': 'AS Saint-Étienne',
    'hammarby youth': 'Hammarby',
    'sky blue fc': 'Gotham FC',
    'cd tacón b': 'CD Tacón',
    'pozuelo de alarcón': 'CF Pozuelo de Alarcón',
    'são josé': 'Sao José', 'sao josé': 'Sao José',
};

export function createClubShieldResolver(shields: Record<string, string>) {
    const index = Object.entries(shields).filter(([, url]) => Boolean(url))
        .map(([name, url]) => ({ url, key: cleanClubName(name), tokens: clubTokens(name) }));
    return (club: string | null | undefined): { url: string; known: boolean } | null => {
        if (!club) return null;
        club = CLUB_ALIASES[club.trim().toLowerCase()] ?? club;
        const key = cleanClubName(club);
        const tokens = clubTokens(club);
        const hit = index.find((entry) => entry.key === key)
            ?? index.find((entry) => entry.tokens.length > 0 && entry.tokens.length === tokens.length && entry.tokens.every((t) => tokens.includes(t)));
        if (hit) return { url: hit.url, known: true };
        const slug = shieldFileSlug(club);
        return slug ? { url: `https://media.madridfemeninoxtra.com/escudos/${slug}.webp`, known: false } : null;
    };
}
