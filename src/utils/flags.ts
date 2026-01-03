
export const getFlagCdnCode = (code: string | undefined): string => {
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
        'eng': 'gb-eng', // England often uses gb-eng or gb
        'sco': 'gb-sct',
        'wal': 'gb-wls',
        'nir': 'gb-nir',
        'ger': 'de',
        'den': 'dk',
        'ned': 'nl',
        'por': 'pt',
        'prt': 'pt', // Portugal
        'ita': 'it', // Italy
        // Add others as needed
    };
    return map[c] || c;
};
