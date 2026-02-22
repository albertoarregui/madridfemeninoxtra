
/**
 * Parses a match date string (YYYY-MM-DD) and time string (HH:MM or HH:MMh CEST)
 * and returns a Date object strictly in Madrid time (CET/CEST).
 * Correctly handles Daylight Saving Time transitions.
 */
export function parseMatchDate(dateStr: string, timeStr: string): Date {
    let hours = "00";
    let minutes = "00";

    const cleanTime = (timeStr || "").replace(/[^0-9:]/g, "");
    if (cleanTime.includes(":")) {
        const parts = cleanTime.split(":");
        hours = parts[0].padStart(2, "0");
        minutes = (parts[1] || "00").padStart(2, "0");
    } else if (cleanTime.length >= 1) {
        // Handle cases like "12h" or "12"
        hours = cleanTime.padStart(2, "0");
        minutes = "00";
    }

    // Default to midnight if we still have issues
    if (isNaN(parseInt(hours))) hours = "00";
    if (isNaN(parseInt(minutes))) minutes = "00";

    // Calculate DST for Europe/Madrid (CET/CEST)
    // Summer time starts last Sunday of March (02:00 -> 03:00)
    // Summer time ends last Sunday of October (03:00 -> 02:00)
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const year = y;

    const march31 = new Date(Date.UTC(year, 2, 31));
    const lastSundayMarch = 31 - march31.getUTCDay();

    const oct31 = new Date(Date.UTC(year, 9, 31));
    const lastSundayOct = 31 - oct31.getUTCDay();

    const monthNum = date.getUTCMonth(); // 0-indexed
    const dayNum = date.getUTCDate();

    let isSummer = false;
    if (monthNum > 2 && monthNum < 9) {
        isSummer = true;
    } else if (monthNum === 2 && dayNum >= lastSundayMarch) {
        isSummer = true;
    } else if (monthNum === 9 && dayNum < lastSundayOct) {
        isSummer = true;
    }

    const offset = isSummer ? "+02:00" : "+01:00";

    // Ensure hours and minutes are valid numbers for the ISO string
    const finalHours = hours.slice(0, 2);
    const finalMinutes = minutes.slice(0, 2);

    const isoString = `${dateStr}T${finalHours}:${finalMinutes}:00${offset}`;
    const result = new Date(isoString);

    if (isNaN(result.getTime())) {
        // Ultimate fallback
        return new Date(`${dateStr}T00:00:00${offset}`);
    }

    return result;
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
