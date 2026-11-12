import React, { useEffect, useState } from "react";
import CustomSelect from "./CustomSelect";
import ScrollPills from "./ScrollPills";

// «Más X en un solo partido» dentro de /rankings. Los datos llegan de
// /api/rankings-partido, que el CDN guarda un día por combinación de filtros.

const STATS = [
    { value: "goles", label: "Goles" },
    { value: "asistencias", label: "Asistencias" },
    { value: "goles_generados", label: "Goles + Asist." },
    { value: "tiros_totales", label: "Tiros" },
    { value: "tiros_puerta", label: "Tiros a puerta" },
    { value: "pases_clave", label: "Pases clave" },
    { value: "pases_completados", label: "Pases completados" },
    { value: "regates_completados", label: "Regates" },
    { value: "toques", label: "Toques" },
    { value: "duelos_ganados", label: "Duelos ganados" },
    { value: "recuperaciones", label: "Recuperaciones" },
    { value: "entradas", label: "Entradas" },
    { value: "intercepciones", label: "Intercepciones" },
    { value: "despejes", label: "Despejes" },
    { value: "valoracion", label: "Valoración" },
];
const COMP_ORDER = ["Primera Iberdrola", "Liga F", "UWCL", "Copa de la Reina", "Supercopa de España", "Amistosos"];

interface MatchInfo { slug: string; fecha: string; rival: string; local: boolean; gf: number; gc: number; competicion: string; temporada: string }
interface Record { nombre: string; slug: string; value: number; match: MatchInfo }

interface Props {
    initialStat?: string;
    playerImageMap: { [slug: string]: string };
    playerFlagMap?: { [slug: string]: string };
    competitionLogos?: { [name: string]: string };
}

const ratingTone = (v: number) => (v >= 8 ? "is-top" : v >= 7 ? "is-good" : v >= 6 ? "is-ok" : "is-low");

const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return d && m && y ? `${d}/${m}/${y}` : iso;
};

export default function MatchRecordsRanking({ initialStat = "goles", playerImageMap, playerFlagMap = {}, competitionLogos = {} }: Props) {
    const [stat, setStat] = useState(STATS.some((s) => s.value === initialStat) ? initialStat : "goles");
    const [competition, setCompetition] = useState("oficiales");
    const [season, setSeason] = useState("todos");
    const [records, setRecords] = useState<Record[] | null>(null);
    const [seasons, setSeasons] = useState<string[]>([]);
    const [competitions, setCompetitions] = useState<string[]>([]);
    const [visible, setVisible] = useState(25);
    const [error, setError] = useState(false);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (stat === "goles") url.searchParams.delete("estadistica"); else url.searchParams.set("estadistica", stat);
        window.history.replaceState(window.history.state, "", url);
    }, [stat]);

    useEffect(() => {
        const controller = new AbortController();
        setRecords(null);
        setError(false);
        setVisible(25);
        const params = new URLSearchParams({ estadistica: stat, competicion: competition, temporada: season });
        fetch(`/api/rankings-partido?${params}`, { signal: controller.signal })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((data) => {
                setRecords(data.records || []);
                if (data.seasons?.length) setSeasons(data.seasons);
                if (data.competitions?.length) setCompetitions(data.competitions);
            })
            .catch((e) => { if (e?.name !== "AbortError") { setError(true); setRecords([]); } });
        return () => controller.abort();
    }, [stat, competition, season]);

    const compPills = [
        { value: "todos", label: "Todas" },
        { value: "oficiales", label: "Oficiales" },
        ...COMP_ORDER.filter((c) => competitions.includes(c)).map((c) => ({ value: c, label: c === "Amistosos" ? "Amistoso" : c })),
    ];
    const statLabel = STATS.find((s) => s.value === stat)?.label || "";
    const shown = (records || []).slice(0, visible);
    const fmt = (v: number) => (stat === "valoracion" ? v.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : v.toLocaleString("es-ES"));
    const seasonLabel = season === "todos" ? "Todas las temporadas" : season;
    const compLabel = compPills.find((c) => c.value === competition)?.label || competition;

    return (
        <>
            <div className="rk-actions">
                <p className="rk-intro">Las mejores actuaciones individuales en un solo partido.</p>
                <div className="rk-season">
                    <span className="rk-label">Temporada</span>
                    <CustomSelect
                        id="rk-match-season"
                        options={[{ value: "todos", label: "Todas las temporadas" }, ...seasons.map((s) => ({ value: s, label: s }))]}
                        value={season}
                        onChange={setSeason}
                    />
                </div>
            </div>

            <div className="rk-filter">
                <span className="rk-label">Competición</span>
                <div className="pt-pills" role="group" aria-label="Competición">
                    {compPills.map((option) => (
                        <button key={option.value} type="button" className={`pt-pill${competition === option.value ? " is-active" : ""}`}
                            aria-pressed={competition === option.value} onClick={() => setCompetition(option.value)}>
                            {competitionLogos[option.value] && <img src={competitionLogos[option.value]} alt="" width={16} height={16} loading="lazy" />}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rk-filter">
                <span className="rk-label">Estadística en un partido</span>
                <ScrollPills label="Estadística en un partido" value={stat} onChange={setStat} options={STATS} />
            </div>

            <div className="rk-card mfx-corners">
                <div className="rk-head">
                    <h2>Más {statLabel.toLowerCase()} en un partido</h2>
                    <p>{seasonLabel} · {compLabel}</p>
                </div>
                {records === null ? (
                    <p className="rk-empty">Cargando…</p>
                ) : shown.length === 0 ? (
                    <p className="rk-empty">{error ? "No se pudieron cargar los datos." : "No hay datos para estos filtros."}</p>
                ) : (
                    <table className="rk-table rk-match-table">
                        <thead>
                            <tr>
                                <th className="rk-pos">#</th>
                                <th className="rk-player">Jugadora</th>
                                <th className="rk-match">Partido</th>
                                <th className="rk-value"><span className="rk-hide-sm">{statLabel} </span>↓</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((r, index) => {
                                const photo = playerImageMap[r.slug];
                                const flag = playerFlagMap[r.slug];
                                const logo = competitionLogos[r.match.competicion];
                                return (
                                    <tr key={`${r.slug}-${r.match.slug}`}>
                                        <td className="rk-pos"><span className={`rk-rank${index === 0 ? " is-first" : ""}`}>{index + 1}</span></td>
                                        <td className="rk-player">
                                            <a className="rk-person" href={`/jugadoras/${r.slug}`}>
                                                <span className="rk-photo">{photo && <img src={photo} alt="" width={52} height={52} loading="lazy" />}</span>
                                                <span className="rk-name">
                                                    <strong>{r.nombre}{flag && <img className="rk-flag" src={flag} alt="" width={20} height={14} loading="lazy" />}</strong>
                                                    {/* En móvil el partido va debajo del nombre. */}
                                                    <small className="rk-match-inline">{r.match.local ? "vs" : "en"} {r.match.rival} · {r.match.gf}-{r.match.gc}</small>
                                                </span>
                                            </a>
                                        </td>
                                        <td className="rk-match">
                                            <a href={`/partidos/${r.match.slug}`}>
                                                {logo && <img src={logo} alt="" width={18} height={18} loading="lazy" />}
                                                <span>
                                                    <strong>{r.match.local ? "vs" : "en"} {r.match.rival} <em>{r.match.gf}-{r.match.gc}</em></strong>
                                                    <small>{formatDate(r.match.fecha)} · {r.match.competicion === "Amistosos" ? "Amistoso" : r.match.competicion}</small>
                                                </span>
                                            </a>
                                        </td>
                                        <td className="rk-value"><b className={stat === "valoracion" ? `rk-rating ${ratingTone(r.value)}` : undefined}>{fmt(r.value)}</b></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {records && visible < records.length && (
                    <button type="button" className="btn-more rk-more-btn" onClick={() => setVisible((v) => v + 25)}>
                        Cargar más ({records.length - visible} restantes)
                    </button>
                )}
            </div>
        </>
    );
}
