import { cacheTags } from './cache-tags';

const HOUR_MS = 60 * 60 * 1000;
const OPEN_AFTER_DATE_START_MS = 72 * HOUR_MS;
const MATCH_DATE_SUFFIX = /-(\d{4}-\d{2}-\d{2})$/;

const OPEN_MATCH_TAGS = [
    cacheTags.matches, cacheTags.calendar, cacheTags.goals, cacheTags.lineups,
    cacheTags.statistics, cacheTags.players, cacheTags.stadiums, cacheTags.coaches,
    cacheTags.referees,
];

export function matchDateFromSlug(slug: string): string | null {
    return slug.match(MATCH_DATE_SUFFIX)?.[1] ?? null;
}

export function isOpenMatchDate(date: string | null | undefined, now = new Date()): boolean {
    const day = String(date ?? '').slice(0, 10);
    const dateStart = Date.parse(`${day}T00:00:00Z`);
    if (Number.isNaN(dateStart)) return true;
    return now.getTime() < dateStart + OPEN_AFTER_DATE_START_MS;
}

export function isOpenMatchSlug(slug: string, now = new Date()): boolean {
    const date = matchDateFromSlug(slug);
    return date ? isOpenMatchDate(date, now) : false;
}

export function matchOpenUntil(date: string | null | undefined): number | null {
    const dateStart = Date.parse(`${String(date ?? '').slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(dateStart) ? null : dateStart + OPEN_AFTER_DATE_START_MS;
}

export function ownMatchTags(match: { id_partido?: unknown; slug?: unknown }): string[] {
    const own = [match.id_partido, match.slug]
        .map((value) => String(value ?? '').trim())
        .filter((value) => /^[a-zA-Z0-9_-]+$/.test(value))
        .map((value) => cacheTags.match(value));
    return [...new Set([cacheTags.database, ...own])];
}

export function matchCacheTags(
    match: { id_partido?: unknown; slug?: unknown; fecha?: unknown },
    now = new Date(),
): string[] {
    const tags = ownMatchTags(match);
    if (isOpenMatchDate(match.fecha as string | null | undefined, now)) tags.push(...OPEN_MATCH_TAGS);
    return [...new Set(tags)];
}
