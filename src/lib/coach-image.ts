const COACH_IMAGE_CACHE_VERSION = '20260917';

export function versionCoachImageUrl(
    photoUrl: unknown,
    version: string | number = COACH_IMAGE_CACHE_VERSION,
    replace = false,
): string {
    if (typeof photoUrl !== 'string') return '';

    const cleanUrl = photoUrl.trim();
    if (!cleanUrl) return '';

    try {
        const url = new URL(cleanUrl);
        if (
            url.hostname === 'media.madridfemeninoxtra.com' &&
            url.pathname.startsWith('/entrenadores/') &&
            (replace || !url.searchParams.has('mfxv'))
        ) {
            url.searchParams.set('mfxv', String(version));
        }
        return url.toString();
    } catch {
        return cleanUrl;
    }
}
