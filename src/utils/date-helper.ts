
/**
 * Parses a match date string (YYYY-MM-DD) and time string (HH:MM or HH:MMh CEST)
 * and returns a Date object strictly in Madrid time (CET/CEST).
 * Correctly handles Daylight Saving Time transitions.
 */
export function parseMatchDate(dateStr: string, timeStr: string): Date {
    const [hours, minutes] = timeStr.replace(/[^0-9:]/g, "").split(":");

    // Calculate DST for Europe/Madrid (CET/CEST)
    // Standard: UTC+1, Summer: UTC+2
    // Summer time starts last Sunday of March, ends last Sunday of October
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const year = y;

    // Find last Sunday of March
    const march31 = new Date(Date.UTC(year, 2, 31));
    const lastSundayMarch = 31 - march31.getUTCDay(); // 0 is Sunday

    // Find last Sunday of October
    const oct31 = new Date(Date.UTC(year, 9, 31));
    const lastSundayOct = 31 - oct31.getUTCDay();

    const month = date.getUTCMonth(); // 0-indexed
    const day = date.getUTCDate();

    let isSummer = false;
    if (month > 2 && month < 9) {
        isSummer = true;
    } else if (month === 2 && day >= lastSundayMarch) {
        isSummer = true;
    } else if (month === 9 && day < lastSundayOct) {
        isSummer = true;
    }

    const offset = isSummer ? "+02:00" : "+01:00";

    return new Date(`${dateStr}T${hours}:${minutes}:00${offset}`);
}

/**
 * Returns true if the match is still "active" (date < now + 2 hours)
 */
export function isMatchActive(dateStr: string, timeStr: string): boolean {
    const now = new Date();
    const twoHours = 2 * 60 * 60 * 1000;
    const matchDate = parseMatchDate(dateStr, timeStr);
    const matchEndTime = new Date(matchDate.getTime() + twoHours);
    return matchEndTime > now;
}
