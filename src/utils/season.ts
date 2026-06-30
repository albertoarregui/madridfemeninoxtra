export function nowInMadrid(): { year: number; month: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(new Date());
    const year = Number(parts.find((p) => p.type === 'year')!.value);
    const month = Number(parts.find((p) => p.type === 'month')!.value);
    return { year, month };
}

export function getCurrentSeasonStartYear(): number {
    const { year, month } = nowInMadrid();
    return month >= 7 ? year : year - 1;
}

export function getCurrentSeason(): string {
    const startYear = getCurrentSeasonStartYear();
    const endYearAbbrev = (startYear + 1).toString().slice(-2);
    return `${startYear}/${endYearAbbrev}`;
}
