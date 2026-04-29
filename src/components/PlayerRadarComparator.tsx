import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip,
} from 'recharts';

interface PlayerOption { slug: string; nombre: string; imageUrl: string; posicion: string; }

interface Stats {
    partidos: number; titularidades: number; minutos: number;
    victorias: number; porterias_cero: number;
    goles: number; asistencias: number; amarillas: number; rojas: number;
    pases_clave: number; tiros_totales: number; tiros_puerta: number;
    toques: number; toques_area_rival: number;
    pases_completados: number; pases_totales: number;
    regates_completados: number; regates_totales: number;
    duelos_suelo_ganados: number; duelos_aereos_ganados: number;
    intercepciones: number; entradas: number; bloqueos: number;
    recuperaciones: number; perdidas: number;
    faltas_recibidas: number; faltas_cometidas: number;
    valoracion_media: number;
}

interface PlayerData {
    slug: string; nombre: string; imageUrl: string; posicion: string;
    seasons: string[]; competitions: string[];
    stats: Stats;
}

// Stats that are rates (not accumulated), shown as-is for x90 too
const RATE_KEYS = new Set<keyof Stats>(['valoracion_media']);
// Stats that don't make sense per 90
const NO_PER90  = new Set<keyof Stats>(['partidos','titularidades','minutos','victorias','porterias_cero','valoracion_media']);

const RADAR_AXES: { key: keyof Stats; label: string }[] = [
    { key: 'goles',               label: 'Goles' },
    { key: 'asistencias',         label: 'Asistencias' },
    { key: 'tiros_puerta',        label: 'Tiros a puerta' },
    { key: 'pases_clave',         label: 'Pases clave' },
    { key: 'regates_completados', label: 'Regates' },
    { key: 'intercepciones',      label: 'Intercepciones' },
];

interface RowDef { key: keyof Stats; label: string; lowerIsBetter?: boolean; isDecimal?: boolean; }
interface Section { label: string; rows: RowDef[]; }

const TABLE_SECTIONS: Section[] = [
    { label: 'PARTICIPACIÓN', rows: [
        { key: 'partidos',       label: 'Partidos' },
        { key: 'titularidades',  label: 'Titularidades' },
        { key: 'minutos',        label: 'Minutos' },
        { key: 'victorias',      label: 'Victorias' },
        { key: 'porterias_cero', label: 'Porterías a cero' },
    ]},
    { label: 'ATAQUE', rows: [
        { key: 'goles',             label: 'Goles' },
        { key: 'asistencias',       label: 'Asistencias' },
        { key: 'pases_clave',       label: 'Pases clave' },
        { key: 'tiros_totales',     label: 'Tiros totales' },
        { key: 'tiros_puerta',      label: 'Tiros a puerta' },
        { key: 'toques_area_rival', label: 'Toques área rival' },
    ]},
    { label: 'JUEGO', rows: [
        { key: 'toques',             label: 'Toques' },
        { key: 'pases_completados',  label: 'Pases completados' },
        { key: 'pases_totales',      label: 'Pases totales' },
        { key: 'regates_completados', label: 'Regates completados' },
        { key: 'regates_totales',    label: 'Regates intentados' },
        { key: 'valoracion_media',   label: 'Valoración media', isDecimal: true },
    ]},
    { label: 'DEFENSA', rows: [
        { key: 'intercepciones',        label: 'Intercepciones' },
        { key: 'entradas',              label: 'Entradas' },
        { key: 'bloqueos',              label: 'Bloqueos' },
        { key: 'recuperaciones',        label: 'Recuperaciones' },
        { key: 'duelos_suelo_ganados',  label: 'Duelos suelo ganados' },
        { key: 'duelos_aereos_ganados', label: 'Duelos aéreos ganados' },
    ]},
    { label: 'DISCIPLINA', rows: [
        { key: 'faltas_recibidas',  label: 'Faltas recibidas' },
        { key: 'faltas_cometidas',  label: 'Faltas cometidas',   lowerIsBetter: true },
        { key: 'perdidas',          label: 'Pérdidas',           lowerIsBetter: true },
        { key: 'amarillas',         label: 'T. amarillas',       lowerIsBetter: true },
        { key: 'rojas',             label: 'T. rojas',           lowerIsBetter: true },
    ]},
];

function per90(val: number, minutes: number) {
    if (minutes < 1) return 0;
    return Math.round((val / minutes) * 90 * 100) / 100;
}

function normalize(va: number, vb: number) {
    const max = Math.max(va, vb, 1);
    return { a: Math.round((va / max) * 100), b: Math.round((vb / max) * 100) };
}

function buildRadarData(a: PlayerData, b: PlayerData, mode: 'total' | 'p90') {
    const mA = a.stats.minutos, mB = b.stats.minutos;
    return RADAR_AXES.map(({ key, label }) => {
        const rawA = a.stats[key] as number;
        const rawB = b.stats[key] as number;
        const va = mode === 'p90' && !NO_PER90.has(key) ? per90(rawA, mA) : rawA;
        const vb = mode === 'p90' && !NO_PER90.has(key) ? per90(rawB, mB) : rawB;
        const { a: na, b: nb } = normalize(va, vb);
        return { subject: label, A: na, B: nb, rawA: va, rawB: vb };
    });
}

// ── Reusable dropdown ────────────────────────────────────────────────────────
function Select({ label, options, value, onChange }: {
    label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
    return (
        <div className="cmp-filter-group">
            <label className="cmp-filter-label">{label}</label>
            <select className="cmp-filter-select" value={value} onChange={e => onChange(e.target.value)}>
                <option value="">Todas</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

// ── Player selector ──────────────────────────────────────────────────────────
function PlayerSelector({ players, selected, onSelect, color, label }: {
    players: PlayerOption[]; selected: PlayerData | null;
    onSelect: (slug: string) => void; color: string; label: string;
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen]   = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = query.length >= 1
        ? players.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
        : [];

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div className="cmp-side" ref={ref}>
            <span className="cmp-side-label" style={{ color }}>{label}</span>
            <div className="cmp-selector">
                {selected ? (
                    <div className="cmp-chosen" style={{ borderColor: color }}>
                        <img src={selected.imageUrl} alt={selected.nombre} className="cmp-avatar" />
                        <div className="cmp-chosen-info">
                            <span className="cmp-chosen-name">{selected.nombre}</span>
                            <span className="cmp-chosen-pos">{selected.posicion}</span>
                        </div>
                        <button className="cmp-clear" onClick={() => { onSelect(''); setQuery(''); }}>✕</button>
                    </div>
                ) : (
                    <div className="cmp-input-wrap" style={{ borderColor: color }}>
                        <svg className="cmp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input
                            className="cmp-input" type="text" placeholder="Buscar jugadora..."
                            value={query}
                            onChange={e => { setQuery(e.target.value); setOpen(true); }}
                            onFocus={() => setOpen(true)}
                        />
                    </div>
                )}
                {open && filtered.length > 0 && !selected && (
                    <ul className="cmp-dropdown">
                        {filtered.map(p => (
                            <li key={p.slug} className="cmp-option" onMouseDown={() => { onSelect(p.slug); setQuery(''); setOpen(false); }}>
                                <img src={p.imageUrl} alt={p.nombre} className="cmp-option-img" />
                                <div className="cmp-option-text">
                                    <span className="cmp-option-name">{p.nombre}</span>
                                    <span className="cmp-option-pos">{p.posicion}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div className="cmp-tooltip">
            <p className="cmp-tooltip-subject">{d.subject}</p>
            <p className="cmp-tooltip-a">A: {d.rawA}</p>
            <p className="cmp-tooltip-b">B: {d.rawB}</p>
        </div>
    );
};

// ── Main component ───────────────────────────────────────────────────────────
export default function PlayerRadarComparator({ players, initialSlugA = '', initialSlugB = '' }: {
    players: PlayerOption[]; initialSlugA?: string; initialSlugB?: string;
}) {
    const [slugA, setSlugA]     = useState(initialSlugA);
    const [slugB, setSlugB]     = useState(initialSlugB);
    const [dataA, setDataA]     = useState<PlayerData | null>(null);
    const [dataB, setDataB]     = useState<PlayerData | null>(null);
    const [loadingA, setLoadA]  = useState(false);
    const [loadingB, setLoadB]  = useState(false);
    const [season, setSeason]   = useState('');
    const [comp, setComp]       = useState('');
    const [mode, setMode]       = useState<'total' | 'p90'>('total');

    async function load(slug: string, setter: (d: PlayerData | null) => void, ls: (v: boolean) => void, s: string, c: string) {
        if (!slug) { setter(null); return; }
        ls(true);
        try {
            const qs = new URLSearchParams();
            if (s) qs.set('season', s);
            if (c) qs.set('competition', c);
            const res = await fetch(`/api/player-radar/${slug}?${qs}`);
            setter(res.ok ? await res.json() : null);
        } catch { setter(null); }
        finally { ls(false); }
    }

    useEffect(() => { load(slugA, setDataA, setLoadA, season, comp); }, [slugA, season, comp]);
    useEffect(() => { load(slugB, setDataB, setLoadB, season, comp); }, [slugB, season, comp]);

    useEffect(() => {
        const url = new URL(window.location.href);
        slugA ? url.searchParams.set('a', slugA) : url.searchParams.delete('a');
        slugB ? url.searchParams.set('b', slugB) : url.searchParams.delete('b');
        window.history.replaceState({}, '', url.toString());
    }, [slugA, slugB]);

    // Union of available seasons/competitions from both players
    const availableSeasons = useMemo(() => {
        const set = new Set([...(dataA?.seasons ?? []), ...(dataB?.seasons ?? [])]);
        return [...set].sort().reverse();
    }, [dataA, dataB]);

    const availableComps = useMemo(() => {
        const order = ['Liga F','UWCL','Copa de la Reina','Supercopa de España','Amistosos'];
        const set = new Set([...(dataA?.competitions ?? []), ...(dataB?.competitions ?? [])]);
        return [...set].sort((a, b) => {
            const ia = order.indexOf(a), ib = order.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1; if (ib !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [dataA, dataB]);

    const radarData = useMemo(() =>
        dataA && dataB ? buildRadarData(dataA, dataB, mode) : null,
    [dataA, dataB, mode]);

    function fmtVal(val: number, key: keyof Stats, isDecimal?: boolean) {
        if (key === 'minutos' && mode === 'total') return val.toLocaleString('es-ES');
        if (mode === 'p90' && !NO_PER90.has(key)) return per90(val, 0); // already computed
        if (isDecimal || RATE_KEYS.has(key)) return val.toFixed(1);
        return val;
    }

    function display(raw: number, key: keyof Stats, minutes: number, isDecimal?: boolean) {
        if (mode === 'p90' && !NO_PER90.has(key)) {
            const v = per90(raw, minutes);
            return v % 1 === 0 ? v.toString() : v.toFixed(2);
        }
        if (key === 'minutos') return raw.toLocaleString('es-ES');
        if (isDecimal || RATE_KEYS.has(key)) return raw.toFixed(1);
        return raw;
    }

    const bothLoading = loadingA || loadingB;
    const hasData = dataA && dataB;

    return (
        <div className="cmp-root">

            {/* ── Selectors ── */}
            <div className="cmp-selectors">
                <PlayerSelector players={players} selected={dataA} onSelect={s => setSlugA(s)} color="#c9a800" label="JUGADORA A" />
                <div className="cmp-vs">{bothLoading ? <span className="cmp-spinner" /> : 'VS'}</div>
                <PlayerSelector players={players} selected={dataB} onSelect={s => setSlugB(s)} color="#151e42" label="JUGADORA B" />
            </div>

            {/* ── Filters bar (only when at least one player selected) ── */}
            {(dataA || dataB) && (
                <div className="cmp-filters">
                    <Select label="TEMPORADA"   options={availableSeasons} value={season} onChange={v => setSeason(v)} />
                    <Select label="COMPETICIÓN" options={availableComps}   value={comp}   onChange={v => setComp(v)} />
                    <div className="cmp-filter-group cmp-filter-mode">
                        <label className="cmp-filter-label">DATOS</label>
                        <div className="cmp-toggle">
                            <button className={`cmp-toggle-btn ${mode === 'total' ? 'active' : ''}`} onClick={() => setMode('total')}>Totales</button>
                            <button className={`cmp-toggle-btn ${mode === 'p90'   ? 'active' : ''}`} onClick={() => setMode('p90')}>Por 90 min</button>
                        </div>
                    </div>
                </div>
            )}

            {hasData ? (
                <>
                    {/* ── Radar ── */}
                    <div className="cmp-chart-card">
                        <ResponsiveContainer width="100%" height={380}>
                            <RadarChart data={radarData!} margin={{ top: 16, right: 48, bottom: 16, left: 48 }}>
                                <PolarGrid stroke="#e8e8e8" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 13, fill: '#151e42' }}
                                />
                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name={dataA!.nombre} dataKey="A" stroke="#c9a800" fill="#ffde59" fillOpacity={0.45} strokeWidth={2} dot={{ r: 3, fill: '#c9a800' }} />
                                <Radar name={dataB!.nombre} dataKey="B" stroke="#151e42" fill="#151e42" fillOpacity={0.22} strokeWidth={2} dot={{ r: 3, fill: '#151e42' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ paddingTop: '12px' }}
                                    formatter={v => <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '0.9rem', color: '#151e42' }}>{v}</span>}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── Table ── */}
                    <div className="cmp-table-card">
                        <div className="cmp-table-header">
                            <div className="cmp-table-player cmp-table-player-a">
                                <img src={dataA!.imageUrl} alt={dataA!.nombre} className="cmp-table-avatar" />
                                <span className="cmp-table-pname">{dataA!.nombre}</span>
                            </div>
                            <div className="cmp-table-stat-col">
                                {mode === 'p90' ? 'POR 90 MIN' : 'ESTADÍSTICA'}
                            </div>
                            <div className="cmp-table-player cmp-table-player-b">
                                <span className="cmp-table-pname">{dataB!.nombre}</span>
                                <img src={dataB!.imageUrl} alt={dataB!.nombre} className="cmp-table-avatar" />
                            </div>
                        </div>

                        {TABLE_SECTIONS.map(section => (
                            <div key={section.label}>
                                <div className="cmp-section-header">{section.label}</div>
                                {section.rows.map(({ key, label, lowerIsBetter, isDecimal }) => {
                                    const rawA = dataA!.stats[key] as number;
                                    const rawB = dataB!.stats[key] as number;
                                    const mA   = dataA!.stats.minutos;
                                    const mB   = dataB!.stats.minutos;

                                    const va = mode === 'p90' && !NO_PER90.has(key) ? per90(rawA, mA) : rawA;
                                    const vb = mode === 'p90' && !NO_PER90.has(key) ? per90(rawB, mB) : rawB;

                                    const aWins = lowerIsBetter ? va < vb : va > vb;
                                    const bWins = lowerIsBetter ? vb < va : vb > va;
                                    const tie   = va === vb;

                                    const fA = display(rawA, key, mA, isDecimal);
                                    const fB = display(rawB, key, mB, isDecimal);

                                    return (
                                        <div key={key} className="cmp-row">
                                            <div className={`cmp-cell cmp-cell-a ${!tie && aWins ? 'cmp-winner' : ''}`}>{fA}</div>
                                            <div className="cmp-cell cmp-cell-stat">{label}</div>
                                            <div className={`cmp-cell cmp-cell-b ${!tie && bWins ? 'cmp-winner' : ''}`}>{fB}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="cmp-empty">
                    <svg viewBox="0 0 64 64" fill="none" className="cmp-empty-icon">
                        <circle cx="32" cy="32" r="30" stroke="#e0e0e0" strokeWidth="2"/>
                        <path d="M20 44c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="32" cy="24" r="6" stroke="#e0e0e0" strokeWidth="2"/>
                    </svg>
                    <p>Selecciona dos jugadoras para ver la comparativa</p>
                </div>
            )}
        </div>
    );
}
