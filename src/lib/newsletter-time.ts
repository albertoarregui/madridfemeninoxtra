const FORM_ZONE = 'Europe/Madrid';

export function madridDate(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: FORM_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const v = (t: string) => parts.find(x => x.type === t)?.value;
  return `${v('year')}-${v('month')}-${v('day')}`;
}
export function madridClock(d: Date): number {
  return Number(new Intl.DateTimeFormat('en-GB',{ timeZone:FORM_ZONE, hour:'2-digit', hourCycle:'h23'}).format(d));
}
export function isoDays(date: string, shift: number) {
  const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+shift); return d.toISOString().slice(0,10);
}
export function mondayAt10Madrid(ymd: string): string {
  const guess = new Date(ymd + 'T10:00:00Z');
  const formatter = new Intl.DateTimeFormat('en-GB',{timeZone:FORM_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const parts = formatter.formatToParts(guess);
  const read = (k: string) => Number(parts.find(x=>x.type===k)?.value);
  const localAsUTC = Date.UTC(read('year'),read('month')-1,read('day'),read('hour'),read('minute'));
  return new Date(guess.getTime() - (localAsUTC - guess.getTime())).toISOString();
}
export const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
