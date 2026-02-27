import { getAssetUrl } from './assets';
import { COUNTRIES } from '../consts/countries';

export const getFlagCdnCode = (code: string | undefined): string => {
    // ... preserved for backward compatibility if needed, but we'll use local flags mostly
    if (!code) return 'unknown';
    const c = code.toLowerCase().trim();
    const map: Record<string, string> = {
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
    };
    return map[c] || c;
};

export function getFlagSrc(codeOrName: string | undefined): string {
    if (!codeOrName) return "";

    const lowerValue = codeOrName.toLowerCase().trim();

    // Try as code first
    let countryEntry = COUNTRIES[lowerValue as keyof typeof COUNTRIES];
    let countryCode = lowerValue;

    // If not found as code, try as name
    if (!countryEntry) {
        const found = Object.entries(COUNTRIES).find(([k, v]) => (v as any).name.toLowerCase() === lowerValue);
        if (found) {
            countryCode = found[0];
            countryEntry = found[1] as any;
        }
    } else {
        // If found as key, check if it's a 3-letter code and try to find its 2-letter equivalent for CDN
        if (lowerValue.length === 3) {
            const found2Letter = Object.entries(COUNTRIES).find(([k, v]) => k.length === 2 && (v as any).name === (countryEntry as any).name);
            if (found2Letter) countryCode = found2Letter[0];
        }
    }

    const nameForAsset = countryEntry ? (countryEntry as any).name : codeOrName;

    // Try local asset first
    const local = getAssetUrl('banderas', nameForAsset);
    if (local && !local.includes('placeholder')) return local;

    // Fallback to flagcdn using the resolved code
    return `https://flagcdn.com/w40/${getFlagCdnCode(countryCode)}.png`;
}
