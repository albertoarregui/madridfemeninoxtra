const PRIMERA_IBERDROLA_TEMPORADAS = new Set([1, 2]);
const PRIMERA_IBERDROLA_SEASONS = new Set(["2020/21", "2021/22"]);

export function competitionDisplayName(
    competicion: string | null | undefined,
    opts?: { idTemporada?: number | string | null; temporada?: string | null },
): string {
    const comp = competicion ?? "";
    if (comp !== "Liga F") return comp;
    const id = Number(opts?.idTemporada);
    if (PRIMERA_IBERDROLA_TEMPORADAS.has(id)) return "Primera Iberdrola";
    if (opts?.temporada && PRIMERA_IBERDROLA_SEASONS.has(opts.temporada)) return "Primera Iberdrola";
    return comp;
}
