import { getAssetUrl } from './assets';
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
