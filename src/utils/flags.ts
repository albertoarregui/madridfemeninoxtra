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
    let country = COUNTRIES[lowerValue as keyof typeof COUNTRIES];

    // If not found, try as name
    if (!country) {
        country = Object.values(COUNTRIES).find(c => (c as any).name.toLowerCase() === lowerValue) as any;
    }

    const nameForAsset = country ? (country as any).name : codeOrName;

    // Try local asset first
    const local = getAssetUrl('banderas', nameForAsset);
    if (local && !local.includes('placeholder')) return local;

    // Fallback to flagcdn using the code
    const cdnCode = country ? (Object.keys(COUNTRIES).find(k => (COUNTRIES[k as keyof typeof COUNTRIES] as any).name === (country as any).name) || lowerValue) : lowerValue;
    return `https://flagcdn.com/w40/${getFlagCdnCode(cdnCode)}.png`;
}
