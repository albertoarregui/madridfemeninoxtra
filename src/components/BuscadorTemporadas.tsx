import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface SeasonRow {
    temporada: string;
    pj: number;
    victorias: number;
    empates: number;
    derrotas: number;
    gf: number;
    gc: number;
    dg: number;
    puntos: number;
    pct_victorias: number;
    porterias_cero: number;
    posesion: number;
    xg: number;
    xg_contra: number;
    xa: number;
    tiros: number;
    tiros_puerta: number;
    corners: number;
    paradas: number;
    grandes_ocasiones: number;
    pases_completados: number;
    regates: number;
    entradas_ganadas: number;
    intercepciones: number;
    recuperaciones: number;
    despejes: number;
    duelos_suelo_ganados: number;
    duelos_aereos_ganados: number;
    [key: string]: any;
}

interface BuscadorProps {
    competitions: string[];
}

type SortDir = "asc" | "desc";
type Mode = "totales" | "promedios";

interface ColumnDef {
    key: string;
    label: string;
    title: string;
    isPercent?: boolean;
    decimals?: number;
    noAvg?: boolean;
    allowZero?: boolean;
}

const STAT_GROUPS: { id: string; label: string; columns: ColumnDef[] }[] = [
    {
        id: "resumen",
        label: "Resumen",
        columns: [
            { key: "pj",        label: "PJ", title: "Partidos jugados", noAvg: true, allowZero: true },
            { key: "victorias", label: "V",  title: "Victorias", allowZero: true },
            { key: "empates",   label: "E",  title: "Empates", allowZero: true },
            { key: "derrotas",  label: "D",  title: "Derrotas", allowZero: true },
            { key: "gf",        label: "GF", title: "Goles a favor", allowZero: true },
            { key: "dg",        label: "DG", title: "Diferencia de goles", allowZero: true },
        ],
    },
    {
        id: "rendimiento",
        label: "Rendimiento",
        columns: [
            { key: "puntos",         label: "PTS",  title: "Puntos (3·V + E)", allowZero: true },
            { key: "pct_victorias",  label: "%VIC", title: "% de victorias", isPercent: true },
            { key: "porterias_cero", label: "P.0",  title: "Porterías a cero", allowZero: true },
            { key: "posesion",       label: "POS",  title: "Posesión media (%)", isPercent: true },
            { key: "xg",             label: "xG",   title: "Goles esperados a favor", decimals: 2 },
            { key: "xa",             label: "xA",   title: "Asistencias esperadas", decimals: 2 },
        ],
    },
    {
        id: "ataque",
        label: "Ataque",
        columns: [
            { key: "gf",                label: "GF",    title: "Goles a favor", allowZero: true },
            { key: "tiros",             label: "TIROS", title: "Tiros totales" },
            { key: "tiros_puerta",      label: "T.PTA", title: "Tiros a puerta" },
            { key: "grandes_ocasiones", label: "G.OCA", title: "Grandes ocasiones" },
            { key: "corners",           label: "CÓR",   title: "Córners" },
            { key: "xg",                label: "xG",    title: "Goles esperados a favor", decimals: 2 },
            { key: "xa",                label: "xA",    title: "Asistencias esperadas", decimals: 2 },
        ],
    },
    {
        id: "juego",
        label: "Juego",
        columns: [
            { key: "pases_completados",     label: "PASES", title: "Pases completados" },
            { key: "regates",               label: "REG",   title: "Regates completados" },
            { key: "duelos_suelo_ganados",  label: "D.SUE", title: "Duelos en el suelo ganados" },
            { key: "duelos_aereos_ganados", label: "D.AÉR", title: "Duelos aéreos ganados" },
        ],
    },
    {
        id: "defensa",
        label: "Defensa",
        columns: [
            { key: "porterias_cero", label: "P.0",  title: "Porterías a cero", allowZero: true },
            { key: "paradas",        label: "PAR",  title: "Paradas" },
            { key: "entradas_ganadas", label: "ENT", title: "Entradas ganadas" },
            { key: "intercepciones", label: "INT",  title: "Intercepciones" },
            { key: "recuperaciones", label: "REC",  title: "Recuperaciones" },
            { key: "despejes",       label: "DESP", title: "Despejes" },
        ],
    },
];

function useDebounce<T>(val: T, ms: number): T {
    const [d, setD] = useState(val);
    useEffect(() => {
        const t = setTimeout(() => setD(val), ms);
        return () => clearTimeout(t);
    }, [val, ms]);
    return d;
}

function metricValue(row: SeasonRow, col: ColumnDef, mode: Mode): number | null {
    const raw = row[col.key];
    if (raw == null) return null;
    if (col.isPercent) return Number(raw);
    if (mode === "promedios" && !col.noAvg) {
        return row.pj > 0 ? Number(raw) / row.pj : null;
    }
    return Number(raw);
}

export default function BuscadorTemporadas({ competitions }: BuscadorProps) {
    const [data,    setData]    = useState<SeasonRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);
    const isInitial = useRef(true);

    const [searchText,   setSearchText]   = useState("");
    const [selectedComp, setSelectedComp] = useState("oficiales");
    const [mode,         setMode]         = useState<Mode>("totales");
    const [activeGroup,  setActiveGroup]  = useState("resumen");
    const [sortKey,      setSortKey]      = useState("");
    const [sortDir,      setSortDir]      = useState<SortDir>("desc");
    const tableRef = useRef<HTMLDivElement>(null);

    const debouncedComp = useDebounce(selectedComp, 400);

    useEffect(() => {
        setLoading(true);
        setError(false);
        const p = new URLSearchParams();
        if (debouncedComp !== 'todos') p.set('competicion', debouncedComp);

        fetch(`/api/buscador-temporadas?${p}`)
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then((rows: SeasonRow[]) => {
                setData(rows);
                setLoading(false);
                isInitial.current = false;
            })
            .catch(() => { setError(true); setLoading(false); isInitial.current = false; });
    }, [debouncedComp]);

    const compOptions = useMemo(() => [
        { value: "todos",     label: "Todas las competiciones" },
        { value: "oficiales", label: "Partidos Oficiales" },
        ...competitions.map(c => ({ value: c, label: c })),
    ], [competitions]);

    const activeColumns = useMemo(
        () => STAT_GROUPS.find(g => g.id === activeGroup)?.columns ?? [],
        [activeGroup]
    );

    const displayData = useMemo(() => {
        let rows = [...data];
        if (searchText.trim()) {
            const term = searchText.trim().toLowerCase();
            rows = rows.filter(s => s.temporada.toLowerCase().includes(term));
        }
        if (sortKey) {
            const col = STAT_GROUPS.flatMap(g => g.columns).find(c => c.key === sortKey);
            rows.sort((a, b) => {
                const av = col ? metricValue(a, col, mode) ?? -Infinity : (a[sortKey] ?? -Infinity);
                const bv = col ? metricValue(b, col, mode) ?? -Infinity : (b[sortKey] ?? -Infinity);
                return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
            });
        }
        return rows;
    }, [data, searchText, sortKey, sortDir, mode]);

    function handleSort(key: string) {
        if (sortKey === key) { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }
        else { setSortKey(key); setSortDir('desc'); }
    }

    function handleGroupChange(groupId: string) {
        setActiveGroup(groupId);
        setSortKey('');
        tableRef.current?.scrollTo({ left: 0 });
    }

    function getDisplayValue(row: SeasonRow, col: ColumnDef): string {
        const v = metricValue(row, col, mode);
        if (v == null) return '—';
        if (col.isPercent) return v === 0 ? '—' : `${Math.round(v)}%`;
        if (mode === "promedios" && !col.noAvg) return v.toFixed(2);
        if (col.decimals != null) return v === 0 ? '—' : v.toFixed(col.decimals);
        if (v === 0 && !col.allowZero) return '—';
        return String(v);
    }

    const hasFilters = searchText || selectedComp !== 'oficiales';

    return (
        <div className="bus-root">
            <div className="bus-filters-panel">
                <div className="bus-search-row">
                    <div className="bus-search-wrap">
                        <Search size={15} className="bus-search-icon" />
                        <input
                            className="bus-search-input"
                            type="text"
                            placeholder="Buscar temporada…"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                        {searchText && (
                            <button className="bus-search-clear" onClick={() => setSearchText('')} aria-label="Borrar">
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <div className="bus-filter-group" style={{ flex: "1 1 200px", minWidth: 160 }}>
                        <CustomSelect id="bust-competicion" value={selectedComp} onChange={setSelectedComp} options={compOptions} />
                    </div>

                    <div className="bus-per90-toggle">
                        <button className={`bus-per90-btn${mode === 'totales' ? ' active' : ''}`} onClick={() => setMode('totales')}>Totales</button>
                        <button className={`bus-per90-btn${mode === 'promedios' ? ' active' : ''}`} onClick={() => setMode('promedios')}>Por partido</button>
                    </div>

                    {hasFilters && (
                        <button className="bus-reset-btn" onClick={() => { setSearchText(''); setSelectedComp('oficiales'); }}>
                            <X size={12} /> Limpiar
                        </button>
                    )}
                </div>
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
                        {loading && isInitial.current ? '…' : `${displayData.length} temporada${displayData.length !== 1 ? 's' : ''}`}
                    </span>
                )}
                {mode === 'promedios' && <span className="bus-per90-badge">por partido</span>}
                {loading && !isInitial.current && <span className="bus-loading-inline" />}
            </div>

            <div className="bus-table-wrap" ref={tableRef}>
                {error ? (
                    <div className="bus-empty">Error al cargar los datos.</div>
                ) : loading && isInitial.current ? (
                    <div className="bus-loading-state">
                        <span className="bus-spinner" />
                        <span>Cargando temporadas…</span>
                    </div>
                ) : displayData.length === 0 ? (
                    <div className="bus-empty">No se encontraron temporadas con los filtros seleccionados.</div>
                ) : (
                    <table className="bus-table">
                        <thead>
                            <tr>
                                <th className="bus-th bus-th-num">#</th>
                                <th className="bus-th bus-th-player">Temporada</th>
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
                            {displayData.map((s, idx) => (
                                <tr key={s.temporada} className={`bus-tr${idx % 2 !== 0 ? ' alt' : ''}`}>
                                    <td className="bus-td bus-td-num">{idx + 1}</td>
                                    <td className="bus-td bus-td-player">
                                        <span className="bus-player-link">
                                            <span className="bus-player-info">
                                                <span className="bus-player-name">{s.temporada}</span>
                                                <span className="bus-player-pos">{s.pj} partido{s.pj !== 1 ? 's' : ''}</span>
                                            </span>
                                        </span>
                                    </td>
                                    {activeColumns.map(col => {
                                        const display = getDisplayValue(s, col);
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
                Clic en columna para ordenar · «Por partido» divide los totales entre los partidos jugados
            </p>
        </div>
    );
}
