export function nowInMadrid(at: Date = new Date()): { year: number; month: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(at);
    const year = Number(parts.find((p) => p.type === 'year')!.value);
    const month = Number(parts.find((p) => p.type === 'month')!.value);
    return { year, month };
}

export function getCurrentSeasonStartYear(at: Date = new Date()): number {
    const { year, month } = nowInMadrid(at);
    return month >= 7 ? year : year - 1;
}

export function getCurrentSeason(at: Date = new Date()): string {
    const startYear = getCurrentSeasonStartYear(at);
    const endYearAbbrev = (startYear + 1).toString().slice(-2);
    return `${startYear}/${endYearAbbrev}`;
}

/** Seconds the CDN can safely cache a season page before July 1, 00:00 in Madrid. */
export function secondsUntilNextSeason(at: Date = new Date()): number {
    const nextYear = getCurrentSeasonStartYear(at) + 1;
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const isNextSeason = (ms: number) => {
        const parts = formatter.formatToParts(new Date(ms));
        const year = Number(parts.find((part) => part.type === 'year')!.value);
        const month = Number(parts.find((part) => part.type === 'month')!.value);
        return year > nextYear || (year === nextYear && month >= 7);
    };

    // Locate the Madrid midnight without assuming a fixed UTC offset or DST rule.
    let before = Date.UTC(nextYear, 5, 30);
    let after = Date.UTC(nextYear, 6, 2);
    while (after - before > 1) {
        const middle = Math.floor((before + after) / 2);
        if (isNextSeason(middle)) after = middle;
        else before = middle;
    }
    // Floor prevents a response cached in the final second from crossing midnight.
    return Math.max(0, Math.floor((after - at.getTime()) / 1000));
}
