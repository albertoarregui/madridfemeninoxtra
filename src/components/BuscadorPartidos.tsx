import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronUp, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface MatchRow {
    id_partido: number;
    slug: string;
    fecha: string;
    jornada: string;
    temporada: string;
    competicion: string;
    condicion: string;
    resultado: string;
    rival: string;
    rival_foto: string | null;
    id_rival: number;
    goles_rm: number;
    goles_rival: number;
    diferencia: number;
    [key: string]: any;
}

interface Rival { id: number; nombre: string; }

interface BuscadorProps {
    seasons: string[];
    competitions: string[];
    rivals: Rival[];
}

type SortDir = "asc" | "desc";

interface ColumnDef {
    key: string;
    label: string;
    title: string;
    isPercent?: boolean;
    decimals?: number;
    alwaysNumber?: boolean;
}

const STAT_GROUPS: { id: string; label: string; columns: ColumnDef[] }[] = [
    {
        id: "resultado",
        label: "Resultado",
        columns: [
            { key: "goles_rm",     label: "GF",   title: "Goles a favor",   alwaysNumber: true },
            { key: "diferencia",   label: "DG",   title: "Diferencia de goles", alwaysNumber: true },
            { key: "posesion",     label: "POS",  title: "Posesión (%)", isPercent: true },
            { key: "xg",           label: "xG",   title: "Goles esperados a favor", decimals: 2 },
            { key: "xa",           label: "xA",   title: "Asistencias esperadas", decimals: 2 },
        ],
    },
    {
        id: "ataque",
        label: "Ataque",
        columns: [
            { key: "tiros",             label: "TIROS",  title: "Tiros totales" },
            { key: "tiros_puerta",      label: "T.PTA",  title: "Tiros a puerta" },
            { key: "tiros_palo",        label: "T.PALO", title: "Tiros al palo" },
            { key: "grandes_ocasiones", label: "G.OCA",  title: "Grandes ocasiones" },
            { key: "corners",           label: "CÓR",    title: "Córners" },
            { key: "tiros_libres",      label: "T.LIB",  title: "Tiros libres" },
            { key: "toques_area",       label: "T.ÁREA", title: "Toques en área rival" },
            { key: "regates",           label: "REG",    title: "Regates completados" },
            { key: "xg",                label: "xG",     title: "Goles esperados a favor", decimals: 2 },
            { key: "xa",                label: "xA",     title: "Asistencias esperadas", decimals: 2 },
        ],
    },
    {
        id: "pases",
        label: "Pases",
        columns: [
            { key: "pases_completados",        label: "PASES",  title: "Pases completados" },
            { key: "pct_pases",                label: "%PASES", title: "% Pases completados", isPercent: true },
            { key: "pases_largo_completados",  label: "P.LRG",  title: "Pases en largo completados" },
            { key: "pct_pases_largo",          label: "%P.LRG", title: "% Pases en largo", isPercent: true },
            { key: "pases_tercio_completados", label: "ULT.T",  title: "Pases al último tercio" },
            { key: "pct_pases_tercio",         label: "%ULT.T", title: "% Pases al último tercio", isPercent: true },
            { key: "centros_completados",      label: "CENT",   title: "Centros completados" },
            { key: "pct_centros",              label: "%CENT",  title: "% Centros completados", isPercent: true },
        ],
    },
    {
        id: "defensa",
        label: "Defensa",
        columns: [
            { key: "paradas",               label: "PAR",    title: "Paradas" },
            { key: "entradas_ganadas",      label: "ENT",    title: "Entradas ganadas" },
            { key: "pct_entradas",          label: "%ENT",   title: "% Entradas ganadas", isPercent: true },
            { key: "intercepciones",        label: "INT",    title: "Intercepciones" },
            { key: "recuperaciones",        label: "REC",    title: "Recuperaciones" },
            { key: "despejes",              label: "DESP",   title: "Despejes" },
            { key: "duelos_suelo_ganados",  label: "D.SUE",  title: "Duelos en el suelo ganados" },
            { key: "pct_duelos_suelo",      label: "%D.SUE", title: "% Duelos en el suelo ganados", isPercent: true },
            { key: "duelos_aereos_ganados", label: "D.AÉR",  title: "Duelos aéreos ganados" },
            { key: "pct_duelos_aereos",     label: "%D.AÉR", title: "% Duelos aéreos ganados", isPercent: true },
            { key: "fueras_juego",          label: "F.JUE",  title: "Fueras de juego" },
        ],
    },
];

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 100) : 0; }

function enrich(m: MatchRow): MatchRow {
    return {
        ...m,
        pct_pases:         pct(m.pases_completados, m.pases_totales),
        pct_pases_largo:   pct(m.pases_largo_completados, m.pases_largo_totales),
        pct_pases_tercio:  pct(m.pases_tercio_completados, m.pases_tercio_totales),
        pct_centros:       pct(m.centros_completados, m.centros_totales),
        pct_entradas:      pct(m.entradas_ganadas, m.entradas_totales),
        pct_duelos_suelo:  pct(m.duelos_suelo_ganados, m.duelos_suelo_totales),
        pct_duelos_aereos: pct(m.duelos_aereos_ganados, m.duelos_aereos_totales),
    };
}

function fmtDate(iso: string): string {
    if (!iso) return "";
    const [y, mo, d] = iso.split("-");
    if (!y || !mo || !d) return iso;
    return `${d}/${mo}/${y}`;
}

function useDebounce<T>(val: T, ms: number): T {
    const [d, setD] = useState(val);
    useEffect(() => {
        const t = setTimeout(() => setD(val), ms);
        return () => clearTimeout(t);
    }, [val, ms]);
    return d;
}

const RESULT_CLASS: Record<string, string> = { V: "bus-res-v", E: "bus-res-e", D: "bus-res-d" };

export default function BuscadorPartidos({ seasons, competitions, rivals }: BuscadorProps) {
    const [data,    setData]    = useState<MatchRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);
    const isInitial = useRef(true);

    const [searchText,    setSearchText]    = useState("");
    const [selectedSeason, setSelectedSeason] = useState("todos");
    const [selectedComp,   setSelectedComp]   = useState("oficiales");
    const [selectedCond,   setSelectedCond]   = useState("todos");
    const [selectedResult, setSelectedResult] = useState("todos");
    const [selectedRival,  setSelectedRival]  = useState("todos");
    const [fechaDesde,     setFechaDesde]     = useState("");
    const [fechaHasta,     setFechaHasta]     = useState("");
    const [activeGroup,    setActiveGroup]    = useState("resultado");
    const [sortKey,        setSortKey]        = useState("");
    const [sortDir,        setSortDir]        = useState<SortDir>("desc");
    const [filtersOpen,    setFiltersOpen]    = useState(false);
    const tableRef = useRef<HTMLDivElement>(null);

    const debouncedApiFilters = useDebounce(
        { selectedSeason, selectedComp, selectedCond, selectedResult, selectedRival, fechaDesde, fechaHasta },
        400
    );

    useEffect(() => {
        setLoading(true);
        setError(false);
        const f = debouncedApiFilters;
        const p = new URLSearchParams();
        if (f.selectedSeason !== 'todos') p.set('temporada',   f.selectedSeason);
        if (f.selectedComp  !== 'todos')  p.set('competicion', f.selectedComp);
        if (f.selectedCond  !== 'todos')  p.set('condicion',   f.selectedCond);
        if (f.selectedResult !== 'todos') p.set('resultado',   f.selectedResult);
        if (f.selectedRival !== 'todos')  p.set('id_rival',    f.selectedRival);
        if (f.fechaDesde)                 p.set('fecha_desde', f.fechaDesde);
        if (f.fechaHasta)                 p.set('fecha_hasta', f.fechaHasta);

        fetch(`/api/buscador-partidos?${p}`)
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then((rows: MatchRow[]) => {
                setData(rows);
                setLoading(false);
                isInitial.current = false;
            })
            .catch(() => { setError(true); setLoading(false); isInitial.current = false; });
    }, [debouncedApiFilters]);

    const seasonOptions = useMemo(() => [
        { value: "todos", label: "Todas las temporadas" },
        ...seasons.map(s => ({ value: s, label: s })),
    ], [seasons]);

    const compOptions = useMemo(() => [
        { value: "todos",     label: "Todas las competiciones" },
        { value: "oficiales", label: "Partidos Oficiales" },
        ...competitions.map(c => ({ value: c, label: c })),
    ], [competitions]);

    const condOptions = [
        { value: "todos",     label: "Local y visitante" },
        { value: "local",     label: "Como local" },
        { value: "visitante", label: "Como visitante" },
    ];

    const resultOptions = [
        { value: "todos", label: "Todos los resultados" },
        { value: "V",     label: "Victorias" },
        { value: "E",     label: "Empates" },
        { value: "D",     label: "Derrotas" },
    ];

    const rivalOptions = useMemo(() => [
        { value: "todos", label: "Todos los rivales" },
        ...rivals.map(r => ({ value: String(r.id), label: r.nombre })),
    ], [rivals]);

    const activeColumns = useMemo(
        () => STAT_GROUPS.find(g => g.id === activeGroup)?.columns ?? [],
        [activeGroup]
    );

    const displayData = useMemo(() => {
        let rows = data.map(enrich);

        if (searchText.trim()) {
            const term = searchText.trim().toLowerCase();
            rows = rows.filter(m => m.rival.toLowerCase().includes(term));
        }
        if (sortKey) {
            rows = [...rows].sort((a, b) => {
                const av = a[sortKey] ?? 0;
                const bv = b[sortKey] ?? 0;
                return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
            });
        }
        return rows;
    }, [data, searchText, sortKey, sortDir]);

    function handleSort(key: string) {
        if (sortKey === key) { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }
        else { setSortKey(key); setSortDir('desc'); }
    }

    function handleGroupChange(groupId: string) {
        setActiveGroup(groupId);
        setSortKey('');
        tableRef.current?.scrollTo({ left: 0 });
    }

    function resetFilters() {
        setSearchText('');
        setSelectedSeason('todos');
        setSelectedComp('oficiales');
        setSelectedCond('todos');
        setSelectedResult('todos');
        setSelectedRival('todos');
        setFechaDesde('');
        setFechaHasta('');
        setSortKey('');
    }

    function getDisplayValue(m: MatchRow, col: ColumnDef): string {
        const raw = m[col.key];
        if (raw == null) return '—';
        if (col.isPercent) return raw === 0 ? '—' : `${raw}%`;
        if (col.decimals != null) return raw === 0 ? '—' : Number(raw).toFixed(col.decimals);
        if (raw === 0 && !col.alwaysNumber) return '—';
        return String(raw);
    }

    const hasFilters =
        searchText || selectedSeason !== 'todos' || selectedComp !== 'oficiales' ||
        selectedCond !== 'todos' || selectedResult !== 'todos' || selectedRival !== 'todos' ||
        fechaDesde || fechaHasta;

    const extraFiltersActive =
        selectedCond !== 'todos' || selectedResult !== 'todos' || selectedRival !== 'todos' ||
        fechaDesde || fechaHasta;

    return (
        <div className="bus-root">
            <div className="bus-filters-panel">
                <div className="bus-search-row">
                    <div className="bus-search-wrap">
                        <Search size={15} className="bus-search-icon" />
                        <input
                            className="bus-search-input"
                            type="text"
                            placeholder="Buscar rival…"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                        {searchText && (
                            <button className="bus-search-clear" onClick={() => setSearchText('')} aria-label="Borrar">
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <button
                        className={`bus-filter-toggle${filtersOpen ? ' open' : ''}`}
                        onClick={() => setFiltersOpen(o => !o)}
                        aria-expanded={filtersOpen}
                    >
                        <SlidersHorizontal size={14} />
                        Filtros
                        {extraFiltersActive && <span className="bus-filter-badge" />}
                    </button>

                    {hasFilters && (
                        <button className="bus-reset-btn" onClick={resetFilters}>
                            <X size={12} /> Limpiar
                        </button>
                    )}
                </div>

                {filtersOpen && (
                    <div className="bus-filters-grid">
                        <div className="bus-filter-group">
                            <span className="bus-filter-label">Temporada</span>
                            <CustomSelect id="busp-temporada" value={selectedSeason} onChange={setSelectedSeason} options={seasonOptions} />
                        </div>
                        <div className="bus-filter-group">
                            <span className="bus-filter-label">Competición</span>
                            <CustomSelect id="busp-competicion" value={selectedComp} onChange={setSelectedComp} options={compOptions} />
                        </div>
                        <div className="bus-filter-group">
                            <span className="bus-filter-label">Condición</span>
                            <CustomSelect id="busp-condicion" value={selectedCond} onChange={setSelectedCond} options={condOptions} />
                        </div>
                        <div className="bus-filter-group">
                            <span className="bus-filter-label">Resultado</span>
                            <CustomSelect id="busp-resultado" value={selectedResult} onChange={setSelectedResult} options={resultOptions} />
                        </div>
                        <div className="bus-filter-group bus-date-group">
                            <span className="bus-filter-label">Fecha desde</span>
                            <div className="bus-date-wrap">
                                <input type="date" className="bus-date-input" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                                {fechaDesde && (
                                    <button className="bus-date-clear" onClick={() => setFechaDesde('')} aria-label="Limpiar fecha">
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="bus-filter-group bus-date-group">
                            <span className="bus-filter-label">Fecha hasta</span>
                            <div className="bus-date-wrap">
                                <input type="date" className="bus-date-input" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                                {fechaHasta && (
                                    <button className="bus-date-clear" onClick={() => setFechaHasta('')} aria-label="Limpiar fecha">
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="bus-filter-group bus-filter-partido">
                            <span className="bus-filter-label">Rival</span>
                            <CustomSelect id="busp-rival" value={selectedRival} onChange={setSelectedRival} options={rivalOptions} />
                        </div>
                    </div>
                )}
            </div>

            <div className="bus-groups-row">
                {STAT_GROUPS.map(g => (
                    <button
                        key={g.id}
                        className={`bus-group-btn${activeGroup === g.id ? ' active' : ''}`}
                        onClick={() => handleGroupChange(g.id)}
                    >
                        {g.label}
                    </button>
                ))}
            </div>

            <div className="bus-meta-row">
                {!error && (
                    <span className="bus-results-count">
                        {loading && isInitial.current ? '…' : `${displayData.length} partido${displayData.length !== 1 ? 's' : ''}`}
                    </span>
                )}
                {loading && !isInitial.current && <span className="bus-loading-inline" />}
            </div>

            <div className="bus-table-wrap" ref={tableRef}>
                {error ? (
                    <div className="bus-empty">Error al cargar los datos.</div>
                ) : loading && isInitial.current ? (
                    <div className="bus-loading-state">
                        <span className="bus-spinner" />
                        <span>Cargando partidos…</span>
                    </div>
                ) : displayData.length === 0 ? (
                    <div className="bus-empty">No se encontraron partidos con los filtros seleccionados.</div>
                ) : (
                    <table className="bus-table">
                        <thead>
                            <tr>
                                <th className="bus-th bus-th-num">#</th>
                                <th className="bus-th bus-th-player">Partido</th>
                                {activeColumns.map(col => (
                                    <th
                                        key={col.key}
                                        className={`bus-th bus-th-stat${sortKey === col.key ? ' sorted' : ''}`}
                                        onClick={() => handleSort(col.key)}
                                        title={col.title}
                                    >
                                        <span className="bus-th-inner">
                                            {col.label}
                                            {sortKey === col.key
                                                ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />)
                                                : <span className="bus-sort-neutral">⇅</span>
                                            }
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.map((m, idx) => (
                                <tr key={m.id_partido} className={`bus-tr${idx % 2 !== 0 ? ' alt' : ''}`}>
                                    <td className="bus-td bus-td-num">{idx + 1}</td>
                                    <td className="bus-td bus-td-player">
                                        <a href={`/partidos/${m.slug}`} className="bus-player-link">
                                            <span className={`bus-res-dot ${RESULT_CLASS[m.resultado] ?? ''}`}>{m.resultado}</span>
                                            {m.rival_foto
                                                ? <img src={m.rival_foto} alt={m.rival} className="bus-player-img bus-shield" loading="lazy" />
                                                : <div className="bus-player-img-ph" />
                                            }
                                            <span className="bus-player-info">
                                                <span className="bus-player-name">RM {m.goles_rm}–{m.goles_rival} {m.rival}</span>
                                                <span className="bus-player-pos">{fmtDate(m.fecha)} · {m.competicion} · {m.condicion === 'local' ? 'Local' : 'Visitante'}</span>
                                            </span>
                                        </a>
                                    </td>
                                    {activeColumns.map(col => {
                                        const display = getDisplayValue(m, col);
                                        const isSorted = sortKey === col.key;
                                        const isTop = isSorted && idx < 3 && display !== '—';
                                        return (
                                            <td key={col.key}
                                                className={`bus-td bus-td-stat${isSorted ? ' sorted' : ''}${isTop ? ' top3' : ''}`}
                                            >
                                                {display}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="bus-hint">
                Clic en columna para ordenar · Las estadísticas avanzadas pueden no estar disponibles en partidos antiguos
            </p>
        </div>
    );
}
