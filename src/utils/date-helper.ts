
export function parseMatchDate(dateStr: string, timeStr: string): Date {
    let hours = "00";
    let minutes = "00";

    const cleanTime = (timeStr || "").replace(/[^0-9:]/g, "");
    if (cleanTime.includes(":")) {
        const parts = cleanTime.split(":");
        hours = parts[0].padStart(2, "0");
        minutes = (parts[1] || "00").padStart(2, "0");
    } else if (cleanTime.length >= 1) {

        hours = cleanTime.padStart(2, "0");
        minutes = "00";
    }

    if (isNaN(parseInt(hours))) hours = "00";
    if (isNaN(parseInt(minutes))) minutes = "00";



    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const year = y;

    const march31 = new Date(Date.UTC(year, 2, 31));
    const lastSundayMarch = 31 - march31.getUTCDay();

    const oct31 = new Date(Date.UTC(year, 9, 31));
    const lastSundayOct = 31 - oct31.getUTCDay();

    const monthNum = date.getUTCMonth();
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

    const finalHours = hours.slice(0, 2);
    const finalMinutes = minutes.slice(0, 2);

    const isoString = `${dateStr}T${finalHours}:${finalMinutes}:00${offset}`;
    const result = new Date(isoString);

    if (isNaN(result.getTime())) {

        return new Date(`${dateStr}T00:00:00${offset}`);
    }

    return result;
}
export function isMatchActive(dateStr: string, timeStr: string): boolean {
    const now = new Date();
    const twoHours = 2 * 60 * 60 * 1000;
    const matchDate = parseMatchDate(dateStr, timeStr);
    const matchEndTime = new Date(matchDate.getTime() + twoHours);
    return matchEndTime > now;
}

export function getMatchStatus(
    dateStr: string,
    timeStr: string,
    isPlayed?: boolean,
    currentMinute?: string
): {
    status: 'not-started' | 'in-progress' | 'finished';
    label: string;
    color: string; // Pastel color
} {
    const now = new Date();
    const matchDate = parseMatchDate(dateStr, timeStr);
    const matchDuration = 90 * 60 * 1000;
    const matchEndTime = new Date(matchDate.getTime() + matchDuration);
    
    if (isPlayed) {
        return {
            status: 'finished',
            label: 'Partido finalizado',
            color: '#FFE5D9', // Pastel peach
        };
    }
    
    if (now >= matchDate && now <= matchEndTime) {
        // Calculate current minute
        const minutesElapsed = Math.floor((now.getTime() - matchDate.getTime()) / (60 * 1000));
        return {
            status: 'in-progress',
            label: `En vivo: ${minutesElapsed}'`,
            color: '#D9E8F5', // Pastel blue
        };
    }
    
    if (now < matchDate) {
        return {
            status: 'not-started',
            label: 'Partido no comenzado',
            color: '#E8D9F5', // Pastel purple
        };
    }
    
    return {
        status: 'finished',
        label: 'Partido finalizado',
        color: '#FFE5D9', // Pastel peach
    };
}


