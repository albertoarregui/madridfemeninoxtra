import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronUp, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface PlayerStat {
    id_jugadora: number;
    nombre: string;
    slug: string;
    posicion: string;
    convocatorias: number;
    partidos: number;
    titularidades: number;
    minutos: number;
    cambio_entrada: number;
    cambio_salida: number;
    victorias: number;
    porterias_cero: number;
    goles: number;
    asistencias: number;
    goles_generados: number;
    penaltis: number;
    goles_abrelatas: number;
    goles_victoria: number;
    goles_empate: number;
    tarjetas_amarillas: number;
    tarjetas_rojas: number;
    capitanias: number;
    pases_clave: number;
    tiros_totales: number;
    tiros_puerta: number;
    toques: number;
    toques_area_rival: number;
    pases_completados: number;
    pases_totales: number;
    pases_ultimo_tercio_completados: number;
    pases_ultimo_tercio_totales: number;
    pases_largo_completados: number;
    pases_largo_totales: number;
    centros_completados: number;
    centros_totales: number;
    regates_completados: number;
    regates_totales: number;
    duelos_suelo_ganados: number;
    duelos_suelo_totales: number;
    duelos_aereos_ganados: number;
    duelos_aereos_totales: number;
    intercepciones: number;
    despejes: number;
    bloqueos: number;
    entradas: number;
    recuperaciones: number;
    perdidas: number;
    fueras_juego: number;
    regateada: number;
    faltas_recibidas: number;
    faltas_cometidas: number;
    valoracion: number;
    valoracion_count: number;
    [key: string]: any;
}

interface Partido {
    id_partido: number;
    fecha: string;
    club_local: string;
    club_visitante: string;
    competicion_nombre: string;
    goles_rm: number;
    goles_rival: number;
}

interface BuscadorProps {
    seasons: string[];
    competitions: string[];
    playerImageMap: Record<string, string>;
}

type SortDir = "asc" | "desc";

interface ColumnDef {
    key: string;
    label: string;
    title: string;
    isPercent?: boolean;
    noPer90?: boolean;
}

const STAT_GROUPS: { id: string; label: string; columns: ColumnDef[] }[] = [
    {
        id: "basicas",
        label: "Básicas",
        columns: [
            { key: "partidos",           label: "PJ",   title: "Partidos jugados",   noPer90: true },
            { key: "minutos",            label: "MIN",  title: "Minutos jugados",    noPer90: true },
            { key: "titularidades",      label: "TIT",  title: "Titularidades",      noPer90: true },
            { key: "convocatorias",      label: "CONV", title: "Convocatorias",      noPer90: true },
            { key: "goles",              label: "G",    title: "Goles" },
            { key: "asistencias",        label: "A",    title: "Asistencias" },
            { key: "goles_generados",    label: "G+A",  title: "Goles + Asistencias" },
            { key: "tarjetas_amarillas", label: "TA",   title: "Tarjetas amarillas", noPer90: true },
            { key: "tarjetas_rojas",     label: "TR",   title: "Tarjetas rojas",     noPer90: true },
        ],
    },
    {
        id: "ataque",
        label: "Ataque",
        columns: [
            { key: "goles",              label: "G",      title: "Goles" },
            { key: "asistencias",        label: "A",      title: "Asistencias" },
            { key: "goles_generados",    label: "G+A",    title: "Goles + Asistencias" },
            { key: "penaltis",           label: "PEN",    title: "Penaltis marcados" },
            { key: "goles_abrelatas",    label: "ABREL",  title: "Goles abrelatas" },
            { key: "goles_victoria",     label: "G.VIC",  title: "Goles de victoria" },
            { key: "tiros_totales",      label: "TIROS",  title: "Tiros totales" },
            { key: "tiros_puerta",       label: "T.PTA",  title: "Tiros a puerta" },
            { key: "pases_clave",        label: "P.CL",   title: "Pases clave" },
            { key: "toques_area_rival",  label: "T.ÁREA", title: "Toques en área rival" },
        ],
    },
    {
        id: "pases",
        label: "Pases",
        columns: [
            { key: "pases_completados",               label: "PASES",  title: "Pases completados" },
            { key: "pct_pases",                       label: "%PASES", title: "% Pases completados", isPercent: true, noPer90: true },
            { key: "pases_clave",                     label: "P.CL",   title: "Pases clave" },
            { key: "pases_ultimo_tercio_completados", label: "ULT.T",  title: "Pases al último tercio" },
            { key: "pases_largo_completados",         label: "P.LRG",  title: "Pases en largo completados" },
            { key: "pct_pases_largo",                 label: "%P.LRG", title: "% Pases en largo", isPercent: true, noPer90: true },
            { key: "centros_completados",             label: "CENT",   title: "Centros completados" },
            { key: "pct_centros",                     label: "%CENT",  title: "% Centros completados", isPercent: true, noPer90: true },
        ],
    },
    {
        id: "duelos",
        label: "Duelos",
        columns: [
            { key: "toques",                label: "TOQUES", title: "Toques de balón" },
            { key: "regates_completados",   label: "REG",    title: "Regates completados" },
            { key: "pct_regates",           label: "%REG",   title: "% Regates completados", isPercent: true, noPer90: true },
            { key: "duelos_suelo_ganados",  label: "D.SUE",  title: "Duelos en el suelo ganados" },
            { key: "pct_duelos_suelo",      label: "%D.SUE", title: "% Duelos en el suelo ganados", isPercent: true, noPer90: true },
            { key: "duelos_aereos_ganados", label: "D.AÉR",  title: "Duelos aéreos ganados" },
            { key: "pct_duelos_aereos",     label: "%D.AÉR", title: "% Duelos aéreos ganados", isPercent: true, noPer90: true },
        ],
    },
    {
        id: "defensa",
        label: "Defensa",
        columns: [
            { key: "entradas",       label: "ENT",  title: "Entradas" },
            { key: "intercepciones", label: "INT",  title: "Intercepciones" },
            { key: "despejes",       label: "DESP", title: "Despejes" },
            { key: "bloqueos",       label: "BLQ",  title: "Bloqueos" },
            { key: "recuperaciones", label: "REC",  title: "Recuperaciones" },
            { key: "porterias_cero", label: "P.0",  title: "Porterías a cero", noPer90: true },
            { key: "victorias",      label: "V",    title: "Victorias", noPer90: true },
        ],
    },
    {
        id: "disciplina",
        label: "Disciplina",
        columns: [
            { key: "tarjetas_amarillas", label: "TA",    title: "Tarjetas amarillas", noPer90: true },
            { key: "tarjetas_rojas",     label: "TR",    title: "Tarjetas rojas",     noPer90: true },
            { key: "faltas_recibidas",   label: "F.REC", title: "Faltas recibidas" },
            { key: "faltas_cometidas",   label: "F.COM", title: "Faltas cometidas" },
            { key: "fueras_juego",       label: "F.JUG", title: "Fueras de juego" },
            { key: "perdidas",           label: "PERD",  title: "Pérdidas de balón" },
            { key: "regateada",          label: "REG.",  title: "Veces regateada" },
        ],
    },
];

const POSITIONS = ["Portera", "Lateral", "Defensa", "Centrocampista", "Extremo", "Delantera"];

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 100) : 0; }

function enrich(p: PlayerStat): PlayerStat {
    return {
        ...p,
        pct_pases:         pct(p.pases_completados, p.pases_totales),
        pct_pases_largo:   pct(p.pases_largo_completados, p.pases_largo_totales),
        pct_centros:       pct(p.centros_completados, p.centros_totales),
        pct_regates:       pct(p.regates_completados, p.regates_totales),
        pct_duelos_suelo:  pct(p.duelos_suelo_ganados, p.duelos_suelo_totales),
        pct_duelos_aereos: pct(p.duelos_aereos_ganados, p.duelos_aereos_totales),
    };
}

function useDebounce<T>(val: T, ms: number): T {
    const [d, setD] = useState(val);
    useEffect(() => {
        const t = setTimeout(() => setD(val), ms);
        return () => clearTimeout(t);
    }, [val, ms]);
    return d;
}

export default function BuscadorAvanzado({ seasons, competitions, playerImageMap }: BuscadorProps) {
    const [data,    setData]    = useState<PlayerStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);
    const [partidos, setPartidos] = useState<Partido[]>([]);
    const isInitial = useRef(true);

    const [searchText,    setSearchText]    = useState("");
    const [selectedSeason, setSelectedSeason] = useState("todos");
    const [selectedComp,   setSelectedComp]   = useState("oficiales");
    const [selectedPos,    setSelectedPos]    = useState("todas");
    const [participacion,  setParticipacion]  = useState("todos");
    const [fechaDesde,     setFechaDesde]     = useState("");
    const [fechaHasta,     setFechaHasta]     = useState("");
    const [idPartido,      setIdPartido]      = useState("todos");
    const [minMinutes,     setMinMinutes]     = useState(0);
    const [per90,          setPer90]          = useState(false);
    const [activeGroup,    setActiveGroup]    = useState("basicas");
    const [sortKey,        setSortKey]        = useState("partidos");
    const [sortDir,        setSortDir]        = useState<SortDir>("desc");
    const [filtersOpen,    setFiltersOpen]    = useState(false);
    const tableRef = useRef<HTMLDivElement>(null);

    const debouncedApiFilters = useDebounce(
        { selectedSeason, selectedComp, selectedPos, participacion, fechaDesde, fechaHasta, idPartido },
        400
    );

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        fetch('/api/partidos')
            .then(r => r.json())
            .then((rows: any[]) => setPartidos(
                rows
                    .filter((p: any) => p.fecha <= today)
                    .map((p: any) => ({
                        id_partido:       Number(p.id_partido),
                        fecha:            String(p.fecha ?? ''),
                        club_local:       String(p.club_local ?? ''),
                        club_visitante:   String(p.club_visitante ?? ''),
                        competicion_nombre: String(p.competicion_nombre ?? ''),
                        goles_rm:         Number(p.goles_rm),
                        goles_rival:      Number(p.goles_rival),
                    }))
            ))
            .catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        setError(false);
        const f = debouncedApiFilters;
        const p = new URLSearchParams();
        if (f.selectedSeason !== 'todos')  p.set('temporada',     f.selectedSeason);
        if (f.selectedComp  !== 'todos')   p.set('competicion',   f.selectedComp);
        if (f.selectedPos   !== 'todas')   p.set('posicion',      f.selectedPos);
        if (f.participacion !== 'todos')   p.set('participacion', f.participacion);
        if (f.fechaDesde)                  p.set('fecha_desde',   f.fechaDesde);
        if (f.fechaHasta)                  p.set('fecha_hasta',   f.fechaHasta);
        if (f.idPartido !== 'todos')       p.set('id_partido',    f.idPartido);

        fetch(`/api/buscador-avanzado?${p}`)
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then((rows: PlayerStat[]) => {
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

    const posOptions = useMemo(() => [
        { value: "todas", label: "Todas las posiciones" },
        ...POSITIONS.map(p => ({ value: p, label: p })),
    ], []);

    const participacionOptions = [
        { value: "todos",    label: "Todas" },
        { value: "titular",  label: "Titular" },
        { value: "suplente", label: "Suplente" },
    ];

    const partidoOptions = useMemo(() => {
        const filtered = partidos.filter(p => {
            const matchesComp = selectedComp === 'todos' || 
                               (selectedComp === 'oficiales' && ['Liga F', 'Primera Iberdrola', 'UWCL', 'Copa de la Reina', 'Supercopa de España'].includes(p.competicion_nombre)) ||
                               p.competicion_nombre === selectedComp;
            return matchesComp;
        });
        return [
            { value: "todos", label: "Todos los partidos" },
            ...filtered.map(p => ({
                value: String(p.id_partido),
                label: `${p.club_local} ${p.goles_rm}-${p.goles_rival} ${p.club_visitante} · ${p.competicion_nombre} · ${p.fecha}`,
            })),
        ];
    }, [partidos, selectedComp, selectedSeason]);

    const activeColumns = useMemo(
        () => STAT_GROUPS.find(g => g.id === activeGroup)?.columns ?? [],
        [activeGroup]
    );

    const displayData = useMemo(() => {
        let rows = data.map(enrich);

        if (searchText.trim()) {
            const term = searchText.trim().toLowerCase();
            rows = rows.filter(p => p.nombre.toLowerCase().includes(term));
        }
        if (minMinutes > 0) {
            rows = rows.filter(p => p.minutos >= minMinutes);
        }
        rows = [...rows].sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            if (typeof av === 'string') {
                return sortDir === 'asc' ? av.localeCompare(bv) : (bv as string).localeCompare(av);
            }
            return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
        });
        return rows;
    }, [data, searchText, minMinutes, sortKey, sortDir]);

    function handleSort(key: string) {
        if (sortKey === key) { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }
        else { setSortKey(key); setSortDir('desc'); }
    }

    function handleGroupChange(groupId: string) {
        setActiveGroup(groupId);
        const grp = STAT_GROUPS.find(g => g.id === groupId);
        if (grp) { setSortKey(grp.columns[0].key); setSortDir('desc'); }
        tableRef.current?.scrollTo({ left: 0 });
    }

    function resetFilters() {
        setSearchText('');
        setSelectedSeason('todos');
        setSelectedComp('oficiales');
        setSelectedPos('todas');
        setParticipacion('todos');
        setFechaDesde('');
        setFechaHasta('');
        setIdPartido('todos');
        setMinMinutes(0);
    }

    function getDisplayValue(player: PlayerStat, col: ColumnDef): string {
        const raw = player[col.key] ?? 0;
        if (raw === 0 || raw == null) return '—';
        if (col.isPercent) return `${raw}%`;
        if (per90 && !col.noPer90 && player.minutos > 0) {
            const v = (raw / player.minutos) * 90;
            return v === 0 ? '—' : v.toFixed(2);
        }
        if (per90 && !col.noPer90 && !player.minutos) return '—';
        return String(raw);
    }

    const hasFilters =
        searchText || selectedSeason !== 'todos' || selectedComp !== 'oficiales' ||
        selectedPos !== 'todas' || participacion !== 'todos' ||
        fechaDesde || fechaHasta || idPartido !== 'todos' || minMinutes > 0;

    const extraFiltersActive = participacion !== 'todos' || fechaDesde || fechaHasta || idPartido !== 'todos' || minMinutes > 0;

    return (
        <div className="bus-root">
            <div className="bus-filters-panel">
                <div className="bus-search-row">
                    <div className="bus-search-wrap">
                        <Search size={15} className="bus-search-icon" />
                        <input
                            className="bus-search-input"
                            type="text"
                            placeholder="Buscar jugadora…"
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
                        {(hasFilters && !searchText) && <span className="bus-filter-badge" />}
                        {extraFiltersActive && <span className="bus-filter-badge" />}
                    </button>

                    <div className="bus-per90-toggle">
                        <button className={`bus-per90-btn${!per90 ? ' active' : ''}`} onClick={() => setPer90(false)}>Total</button>
                        <button className={`bus-per90-btn${per90 ? ' active' : ''}`} onClick={() => setPer90(true)}>Por 90'</button>
                    </div>

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
                            <CustomSelect id="bus-temporada" value={selectedSeason} onChange={setSelectedSeason} options={seasonOptions} />
                        </div>
                        <div className="bus-filter-group">
                            <span className="bus-filter-label">Competición</span>
                            <CustomSelect id="bus-competicion" value={selectedComp} onChange={setSelectedComp} options={compOptions} />
                        </div>
                        <div className="bus-filter-group">
                            <span className="bus-filter-label">Posición</span>
                            <CustomSelect id="bus-posicion" value={selectedPos} onChange={setSelectedPos} options={posOptions} />
                        </div>
                        <div className="bus-filter-group">
                            <span className="bus-filter-label">Participación</span>
                            <CustomSelect id="bus-participacion" value={participacion} onChange={setParticipacion} options={participacionOptions} />
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
                            <span className="bus-filter-label">Por partido</span>
                            <CustomSelect id="bus-partido" value={idPartido} onChange={setIdPartido} options={partidoOptions} />
                        </div>
                        <div className="bus-filter-group">
                            <span className="bus-filter-label">Mínimo de minutos</span>
                            <div className="bus-min-wrap">
                                <input
                                    className="bus-min-input"
                                    type="number"
                                    min={0}
                                    step={90}
                                    value={minMinutes}
                                    onChange={e => setMinMinutes(Math.max(0, Number(e.target.value)))}
                                />
                                <span className="bus-min-unit">min</span>
                            </div>
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
                        {loading && isInitial.current ? '…' : `${displayData.length} jugadora${displayData.length !== 1 ? 's' : ''}`}
                    </span>
                )}
                {per90 && <span className="bus-per90-badge">× 90 min</span>}
                {loading && !isInitial.current && <span className="bus-loading-inline" />}
            </div>

            <div className="bus-table-wrap" ref={tableRef}>
                {error ? (
                    <div className="bus-empty">Error al cargar los datos.</div>
                ) : loading && isInitial.current ? (
                    <div className="bus-loading-state">
                        <span className="bus-spinner" />
                        <span>Cargando estadísticas…</span>
                    </div>
                ) : displayData.length === 0 ? (
                    <div className="bus-empty">No se encontraron jugadoras con los filtros seleccionados.</div>
                ) : (
                    <table className="bus-table">
                        <thead>
                            <tr>
                                <th className="bus-th bus-th-num">#</th>
                                <th className="bus-th bus-th-player">Jugadora</th>
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
                            {displayData.map((player, idx) => {
                                const img = playerImageMap[player.slug];
                                return (
                                    <tr key={player.id_jugadora} className={`bus-tr${idx % 2 !== 0 ? ' alt' : ''}`}>
                                        <td className="bus-td bus-td-num">{idx + 1}</td>
                                        <td className="bus-td bus-td-player">
                                            <a href={`/jugadoras/${player.slug}`} className="bus-player-link">
                                                {img
                                                    ? <img src={img} alt={player.nombre} className="bus-player-img" loading="lazy" />
                                                    : <div className="bus-player-img-ph" />
                                                }
                                                <span className="bus-player-info">
                                                    <span className="bus-player-name">{player.nombre}</span>
                                                    <span className="bus-player-pos">{player.posicion}</span>
                                                </span>
                                            </a>
                                        </td>
                                        {activeColumns.map(col => {
                                            const display = getDisplayValue(player, col);
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
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="bus-hint">
                Clic en columna para ordenar · Los valores Por 90' excluyen porcentajes y métricas de participación
            </p>
        </div>
    );
}
