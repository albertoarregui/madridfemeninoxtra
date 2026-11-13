const HOUR_MS = 60 * 60 * 1000;
const FRESH_BEFORE_MS = 6 * HOUR_MS;
const FRESH_AFTER_DATE_START_MS = 72 * HOUR_MS;
const MATCH_DATE_SUFFIX = /-(\d{4}-\d{2}-\d{2})$/;

export function isFreshMatchSlug(slug: string, now = new Date()): boolean {
    const date = slug.match(MATCH_DATE_SUFFIX)?.[1];
    if (!date) return false;

    const dateStart = Date.parse(`${date}T00:00:00Z`);
    if (Number.isNaN(dateStart)) return false;

    const current = now.getTime();
    return current >= dateStart - FRESH_BEFORE_MS &&
        current < dateStart + FRESH_AFTER_DATE_START_MS;
}

export function isFreshMatchPath(pathname: string, now = new Date()): boolean {
    const slug = pathname.match(/^\/partidos\/([^/]+)\/?$/)?.[1];
    return slug ? isFreshMatchSlug(slug, now) : false;
}
