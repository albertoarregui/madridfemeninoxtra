import { getAssetUrl } from './assets';

/**
 * Maps 3-letter ISO codes (and some special cases like gb-eng) to 2-letter codes
 * used by flagcdn.com. This list does NOT need to be extended for new countries —
 * if the 3-letter code is not here and the 2-letter code is not working,
 * flagcdn uses the code as-is (most 2-letter codes work directly).
 */
export const getFlagCdnCode = (code: string | undefined): string => {
    if (!code) return 'unknown';
    const c = code.toLowerCase().trim();
    const threeToTwo: Record<string, string> = {
        'cze': 'cz',
        'aut': 'at',
        'alb': 'al',
        'mex': 'mx',
        'ukr': 'ua',
        'isl': 'is',
        'nor': 'no',
        'sui': 'ch',
        'swe': 'se',
        'eng': 'gb-eng',
        'sco': 'gb-sct',
        'wal': 'gb-wls',
        'nir': 'gb-nir',
        'ger': 'de',
        'den': 'dk',
        'ned': 'nl',
        'por': 'pt',
        'prt': 'pt',
        'ita': 'it',
        'bra': 'br',
        'esp': 'es',
        'fra': 'fr',
        'col': 'co',
        'aus': 'au',
        'pry': 'py',
        'par': 'py',
        'arg': 'ar',
        'usa': 'us',
        'jpn': 'jp',
        'kor': 'kr',
        'chn': 'cn',
        'nzl': 'nz',
        'zaf': 'za',
        'nga': 'ng',
        'cmr': 'cm',
        'mar': 'ma',
        'sen': 'sn',
        'gha': 'gh',
        'jam': 'jm',
        'tto': 'tt',
        'ven': 've',
        'uru': 'uy',
        'chl': 'cl',
        'per': 'pe',
        'ecu': 'ec',
        'bol': 'bo',
        'pan': 'pa',
        'cri': 'cr',
        'hnd': 'hn',
        'gtm': 'gt',
        'slv': 'sv',
        'nic': 'ni',
        'dom': 'do',
        'cub': 'cu',
        'hat': 'ht',
        'rus': 'ru',
        'pol': 'pl',
        'hun': 'hu',
        'rom': 'ro',
        'srb': 'rs',
        'cro': 'hr',
        'svk': 'sk',
        'svn': 'si',
        'bih': 'ba',
        'gre': 'gr',
        'tur': 'tr',
        'bel': 'be',
        'fin': 'fi',
        'irl': 'ie',
    };
    return threeToTwo[c] || c;
};

/**
 * Returns the URL of a flag image for a given ISO country code or country name.
 * - First tries to find a local SVG asset in /src/assets/banderas/
 * - Falls back to flagcdn.com using the ISO code automatically
 * No need to update any list when a new country is added to the DB.
 */
export function getFlagSrc(codeOrName: string | undefined): string {
    if (!codeOrName) return "";

    const raw = codeOrName.trim();
    const cdnCode = getFlagCdnCode(raw);

    // Try local asset using the raw value (could be a name like "España" or code like "es")
    const local = getAssetUrl('banderas', raw);
    if (local && !local.includes('placeholder') && !local.startsWith('https://media.')) return local;

    // Fallback: use flagcdn with resolved code
    return `https://flagcdn.com/w40/${cdnCode}.png`;
}
