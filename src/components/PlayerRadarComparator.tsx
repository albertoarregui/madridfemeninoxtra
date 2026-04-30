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
    duelos_suelo_ganados: number; duelos_suelo_totales: number;
    duelos_aereos_ganados: number; duelos_aereos_totales: number;
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

const RATE_KEYS = new Set<keyof Stats>(['valoracion_media']);
const NO_PER90  = new Set<keyof Stats>(['partidos','titularidades','minutos','victorias','porterias_cero','valoracion_media']);

type RadarAxis = { key: keyof Stats; label: string };

const RADAR_BY_POS: Record<string, RadarAxis[]> = {
    'Portera': [
        { key: 'porterias_cero',        label: 'P. a cero' },
        { key: 'entradas',              label: 'Entradas' },
        { key: 'bloqueos',              label: 'Bloqueos' },
        { key: 'intercepciones',        label: 'Intercepciones' },
        { key: 'duelos_aereos_ganados', label: 'Duelos aéreos' },
        { key: 'recuperaciones',        label: 'Recuperaciones' },
    ],
    'Defensa': [
        { key: 'intercepciones',        label: 'Intercepciones' },
        { key: 'entradas',              label: 'Entradas' },
        { key: 'recuperaciones',        label: 'Recuperaciones' },
        { key: 'duelos_suelo_ganados',  label: 'Duelos suelo' },
        { key: 'duelos_aereos_ganados', label: 'Duelos aéreos' },
        { key: 'pases_clave',           label: 'Pases clave' },
    ],
    'Centrocampista': [
        { key: 'pases_clave',           label: 'Pases clave' },
        { key: 'regates_completados',   label: 'Regates' },
        { key: 'recuperaciones',        label: 'Recuperaciones' },
        { key: 'intercepciones',        label: 'Intercepciones' },
        { key: 'goles',                 label: 'Goles' },
        { key: 'asistencias',           label: 'Asistencias' },
    ],
    'Delantera': [
        { key: 'goles',                 label: 'Goles' },
        { key: 'asistencias',           label: 'Asistencias' },
        { key: 'tiros_puerta',          label: 'Tiros a puerta' },
        { key: 'regates_completados',   label: 'Regates' },
        { key: 'pases_clave',           label: 'Pases clave' },
        { key: 'toques_area_rival',     label: 'Toques área' },
    ],
};

const DEFAULT_RADAR: RadarAxis[] = [
    { key: 'goles',               label: 'Goles' },
    { key: 'asistencias',         label: 'Asistencias' },
    { key: 'tiros_puerta',        label: 'Tiros a puerta' },
    { key: 'pases_clave',         label: 'Pases clave' },
    { key: 'regates_completados', label: 'Regates' },
    { key: 'intercepciones',      label: 'Intercepciones' },
];

function normPos(p: string): string {
    if (!p) return '';
    const l = p.toLowerCase();
    if (l.includes('ortera')) return 'Portera';
    if (l.includes('efensa')) return 'Defensa';
    if (l.includes('entro') || l.includes('olante') || l.includes('nterior')) return 'Centrocampista';
    if (l.includes('elantera') || l.includes('xtrem')) return 'Delantera';
    return '';
}

function getRadarAxes(posA: string, posB: string): RadarAxis[] {
    const nA = normPos(posA);
    const nB = normPos(posB);
    if (nA && nA === nB) return RADAR_BY_POS[nA] ?? DEFAULT_RADAR;
    if (nA && !nB) return RADAR_BY_POS[nA] ?? DEFAULT_RADAR;
    if (nB && !nA) return RADAR_BY_POS[nB] ?? DEFAULT_RADAR;
    return DEFAULT_RADAR;
}

interface RowDef {
    key: keyof Stats;
    label: string;
    lowerIsBetter?: boolean;
    isDecimal?: boolean;
    percentOf?: keyof Stats;
}
interface Section { label: string; rows: RowDef[]; }

const TABLE_SECTIONS: Section[] = [
    { label: 'PARTICIPACIÓN', rows: [
        { key: 'partidos',       label: 'Partidos' },
        { key: 'titularidades',  label: 'Titularidades' },
        { key: 'minutos',        label: 'Minutos' },
        { key: 'victorias',      label: 'Victorias',        percentOf: 'partidos' },
        { key: 'porterias_cero', label: 'Porterías a cero', percentOf: 'partidos' },
    ]},
    { label: 'ATAQUE', rows: [
        { key: 'goles',             label: 'Goles' },
        { key: 'asistencias',       label: 'Asistencias' },
        { key: 'pases_clave',       label: 'Pases clave' },
        { key: 'tiros_totales',     label: 'Tiros totales' },
        { key: 'tiros_puerta',      label: 'Tiros a puerta', percentOf: 'tiros_totales' },
        { key: 'toques_area_rival', label: 'Toques área rival' },
    ]},
    { label: 'JUEGO', rows: [
        { key: 'toques',              label: 'Toques' },
        { key: 'pases_totales',       label: 'Pases totales' },
        { key: 'pases_completados',   label: 'Pases completados',   percentOf: 'pases_totales' },
        { key: 'regates_totales',     label: 'Regates intentados' },
        { key: 'regates_completados', label: 'Regates completados', percentOf: 'regates_totales' },
        { key: 'valoracion_media',    label: 'Valoración media', isDecimal: true },
    ]},
    { label: 'DEFENSA', rows: [
        { key: 'intercepciones',        label: 'Intercepciones' },
        { key: 'entradas',              label: 'Entradas' },
        { key: 'bloqueos',              label: 'Bloqueos' },
        { key: 'recuperaciones',        label: 'Recuperaciones' },
        { key: 'duelos_suelo_ganados',  label: 'Duelos suelo',  percentOf: 'duelos_suelo_totales' },
        { key: 'duelos_aereos_ganados', label: 'Duelos aéreos', percentOf: 'duelos_aereos_totales' },
    ]},
    { label: 'DISCIPLINA', rows: [
        { key: 'faltas_recibidas',  label: 'Faltas recibidas' },
        { key: 'faltas_cometidas',  label: 'Faltas cometidas',  lowerIsBetter: true },
        { key: 'perdidas',          label: 'Pérdidas',          lowerIsBetter: true },
        { key: 'amarillas',         label: 'T. amarillas',      lowerIsBetter: true },
        { key: 'rojas',             label: 'T. rojas',          lowerIsBetter: true },
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

function buildRadarData(a: PlayerData, b: PlayerData, mode: 'total' | 'p90', axes: RadarAxis[]) {
    const mA = a.stats.minutos, mB = b.stats.minutos;
    return axes.map(({ key, label }) => {
        const rawA = a.stats[key] as number;
        const rawB = b.stats[key] as number;
        const va = mode === 'p90' && !NO_PER90.has(key) ? per90(rawA, mA) : rawA;
        const vb = mode === 'p90' && !NO_PER90.has(key) ? per90(rawB, mB) : rawB;
        const { a: na, b: nb } = normalize(va, vb);
        return { subject: label, A: na, B: nb, rawA: va, rawB: vb };
    });
}

function CustomSelect({ label, options, value, onChange }: {
    label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const displayValue = value || 'Todas';

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div className="cmp-filter-group" ref={ref}>
            <span className="cmp-filter-label">{label}</span>
            <div className={`cmp-custom-select ${open ? 'open' : ''}`}>
                <button
                    type="button"
                    className="cmp-custom-trigger"
                    onClick={() => setOpen(o => !o)}
                    aria-expanded={open}
                >
                    <span className="cmp-custom-text">{displayValue}</span>
                    <svg className="cmp-custom-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1 1l5 5 5-5" stroke="#2b2b2b" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>
                {open && (
                    <ul className="cmp-custom-options">
                        <li
                            className={`cmp-custom-option ${value === '' ? 'selected' : ''}`}
                            onMouseDown={() => { onChange(''); setOpen(false); }}
                        >Todas</li>
                        {options.map(o => (
                            <li
                                key={o}
                                className={`cmp-custom-option ${value === o ? 'selected' : ''}`}
                                onMouseDown={() => { onChange(o); setOpen(false); }}
                            >{o}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function PlayerSelector({ players, selected, onSelect, color }: {
    players: PlayerOption[]; selected: PlayerData | null;
    onSelect: (slug: string) => void; color: string;
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
            <div className="cmp-selector">
                {selected ? (
                    <div className="cmp-chosen" style={{ borderColor: color }}>
                        <img src={selected.imageUrl} alt={selected.nombre} className="cmp-avatar" />
                        <div className="cmp-chosen-info">
                            <span className="cmp-chosen-name">{selected.nombre}</span>
                            <span className="cmp-chosen-pos">{selected.posicion}</span>
                        </div>
                        <button
                            className="cmp-clear"
                            onClick={() => { onSelect(''); setQuery(''); }}
                            aria-label="Quitar jugadora"
                        >✕</button>
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

function CustomTooltip({ active, payload, nameA, nameB }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div className="cmp-tooltip">
            <p className="cmp-tooltip-subject">{d.subject}</p>
            <p className="cmp-tooltip-a">{nameA}: {d.rawA}</p>
            <p className="cmp-tooltip-b">{nameB}: {d.rawB}</p>
        </div>
    );
}

export default function PlayerRadarComparator({ players, initialSlugA = '', initialSlugB = '' }: {
    players: PlayerOption[]; initialSlugA?: string; initialSlugB?: string;
}) {
    const [slugA, setSlugA]         = useState(initialSlugA);
    const [slugB, setSlugB]         = useState(initialSlugB);
    const [dataA, setDataA]         = useState<PlayerData | null>(null);
    const [dataB, setDataB]         = useState<PlayerData | null>(null);
    const [loadingA, setLoadA]      = useState(false);
    const [loadingB, setLoadB]      = useState(false);
    const [season, setSeason]       = useState('');
    const [comp, setComp]           = useState('');
    const [mode, setMode]           = useState<'total' | 'p90'>('total');
    const [capturing, setCapturing] = useState(false);
    const captureRef = useRef<HTMLDivElement>(null);

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

    const availableSeasons = useMemo(() => {
        const set = new Set([...(dataA?.seasons ?? []), ...(dataB?.seasons ?? [])]);
        return [...set].sort().reverse();
    }, [dataA, dataB]);

    const availableComps = useMemo(() => {
        const order = ['Liga F','UWCL','Copa de la Reina','Supercopa de España','Amistosos'];
        const set = new Set([...(dataA?.competitions ?? []), ...(dataB?.competitions ?? [])]);
        const sorted = [...set].sort((a, b) => {
            const ia = order.indexOf(a), ib = order.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1; if (ib !== -1) return 1;
            return a.localeCompare(b);
        });
        return ['Partidos oficiales', ...sorted];
    }, [dataA, dataB]);

    const radarAxes = useMemo(() =>
        dataA && dataB ? getRadarAxes(dataA.posicion, dataB.posicion) : DEFAULT_RADAR,
    [dataA, dataB]);

    const radarData = useMemo(() =>
        dataA && dataB ? buildRadarData(dataA, dataB, mode, radarAxes) : null,
    [dataA, dataB, mode, radarAxes]);

    function display(raw: number, key: keyof Stats, minutes: number, isDecimal?: boolean, percentOf?: keyof Stats, stats?: Stats): string | number {
        let mainVal: string | number;
        if (mode === 'p90' && !NO_PER90.has(key)) {
            const v = per90(raw, minutes);
            mainVal = v % 1 === 0 ? v.toString() : v.toFixed(2);
        } else if (key === 'minutos') {
            mainVal = raw.toLocaleString('es-ES');
        } else if (isDecimal || RATE_KEYS.has(key)) {
            mainVal = raw.toFixed(1);
        } else {
            mainVal = raw;
        }

        if (percentOf && stats && mode === 'total') {
            const denom = stats[percentOf] as number;
            if (denom > 0) {
                const pct = Math.round((raw / denom) * 100);
                return `${mainVal} (${pct}%)`;
            }
        }
        return mainVal;
    }

    async function handleCapture() {
        if (!captureRef.current || capturing) return;
        setCapturing(true);
        try {
            const { default: html2canvas } = await import('html2canvas');

            const capHeader = captureRef.current.querySelector('.cmp-cap-header') as HTMLElement | null;
            const tableHeader = captureRef.current.querySelector('.cmp-table-header') as HTMLElement | null;
            if (capHeader) capHeader.style.display = 'flex';
            if (tableHeader) tableHeader.style.position = 'relative';

            const imgs = Array.from(captureRef.current.querySelectorAll('img'));
            const origSrcs = imgs.map(img => img.src);

            // Images on the CDN don't have CORS headers; proxy them server-side
            await Promise.allSettled(imgs.map(async (img) => {
                try {
                    const isExternal = img.src.startsWith('http') && !img.src.startsWith(window.location.origin);
                    const fetchUrl = isExternal
                        ? `/api/img-proxy?url=${encodeURIComponent(img.src)}`
                        : img.src;
                    const res = await fetch(fetchUrl);
                    const blob = await res.blob();
                    const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    img.src = dataUrl;
                    await new Promise<void>(r => { if (img.complete) r(); else { img.onload = () => r(); } });
                } catch { /* keep original src */ }
            }));

            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                backgroundColor: '#ffffff',
                scale: 2,
            });

            if (capHeader) capHeader.style.display = '';
            if (tableHeader) tableHeader.style.position = '';
            imgs.forEach((img, i) => { img.src = origSrcs[i]; });

            const link = document.createElement('a');
            const nameA = dataA?.nombre.replace(/\s+/g, '-') ?? 'A';
            const nameB = dataB?.nombre.replace(/\s+/g, '-') ?? 'B';
            link.download = `comparativa-${nameA}-vs-${nameB}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error generating screenshot:', err);
        } finally {
            setCapturing(false);
        }
    }

    const bothLoading = loadingA || loadingB;
    const hasData = dataA && dataB;

    return (
        <div className="cmp-root">
            <div className="cmp-selectors">
                <PlayerSelector players={players} selected={dataA} onSelect={s => setSlugA(s)} color="#ffde59" />
                <div className="cmp-vs">{bothLoading ? <span className="cmp-spinner" /> : 'VS'}</div>
                <PlayerSelector players={players} selected={dataB} onSelect={s => setSlugB(s)} color="#ffde59" />
            </div>

            {(dataA || dataB) && (
                <div className="cmp-filters">
                    <CustomSelect label="TEMPORADA"   options={availableSeasons} value={season} onChange={v => setSeason(v)} />
                    <CustomSelect label="COMPETICIÓN" options={availableComps}   value={comp}   onChange={v => setComp(v)} />
                    <div className="cmp-filter-group cmp-filter-mode">
                        <span className="cmp-filter-label">DATOS</span>
                        <div className="cmp-toggle">
                            <button className={`cmp-toggle-btn ${mode === 'total' ? 'active' : ''}`} onClick={() => setMode('total')}>Totales</button>
                            <button className={`cmp-toggle-btn ${mode === 'p90'   ? 'active' : ''}`} onClick={() => setMode('p90')}>Por 90</button>
                        </div>
                    </div>
                </div>
            )}

            {hasData ? (
                <>
                    <div ref={captureRef} className="cmp-capture-wrap">
                        <div className="cmp-cap-header">
                            <img src="/logo-final-trans.png" alt="Madrid Femenino Xtra" className="cmp-cap-logo" />
                            <div className="cmp-cap-players">
                                <div className="cmp-cap-player">
                                    <div className="cmp-cap-img-wrap">
                                        <img src={dataA!.imageUrl} alt={dataA!.nombre} className="cmp-cap-avatar" />
                                    </div>
                                    <span className="cmp-cap-pname">{dataA!.nombre}</span>
                                </div>
                                <span className="cmp-cap-vs">VS</span>
                                <div className="cmp-cap-player">
                                    <div className="cmp-cap-img-wrap">
                                        <img src={dataB!.imageUrl} alt={dataB!.nombre} className="cmp-cap-avatar" />
                                    </div>
                                    <span className="cmp-cap-pname">{dataB!.nombre}</span>
                                </div>
                            </div>
                        </div>

                        <div className="cmp-chart-card">
                            <ResponsiveContainer width="100%" height={380}>
                                <RadarChart data={radarData!} margin={{ top: 16, right: 48, bottom: 16, left: 48 }}>
                                    <PolarGrid stroke="#e8e8e8" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 13, fill: '#2b2b2b' }}
                                    />
                                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name={dataA!.nombre} dataKey="A" stroke="#c9a800" fill="#ffde59" fillOpacity={0.45} strokeWidth={2} dot={{ r: 3, fill: '#c9a800' }} />
                                    <Radar name={dataB!.nombre} dataKey="B" stroke="#2b2b2b" fill="#2b2b2b" fillOpacity={0.22} strokeWidth={2} dot={{ r: 3, fill: '#2b2b2b' }} />
                                    <Tooltip content={<CustomTooltip nameA={dataA!.nombre} nameB={dataB!.nombre} />} />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '12px' }}
                                        formatter={v => <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '0.9rem', color: '#2b2b2b' }}>{v}</span>}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

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
                                    {section.rows.map(({ key, label, lowerIsBetter, isDecimal, percentOf }) => {
                                        const rawA = dataA!.stats[key] as number;
                                        const rawB = dataB!.stats[key] as number;
                                        const mA   = dataA!.stats.minutos;
                                        const mB   = dataB!.stats.minutos;

                                        const va = mode === 'p90' && !NO_PER90.has(key) ? per90(rawA, mA) : rawA;
                                        const vb = mode === 'p90' && !NO_PER90.has(key) ? per90(rawB, mB) : rawB;

                                        const aWins = lowerIsBetter ? va < vb : va > vb;
                                        const bWins = lowerIsBetter ? vb < va : vb > va;
                                        const tie   = va === vb;

                                        const fA = display(rawA, key, mA, isDecimal, percentOf, dataA!.stats);
                                        const fB = display(rawB, key, mB, isDecimal, percentOf, dataB!.stats);

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
                    </div>

                    <div className="cmp-capture-row">
                        <button className="cmp-capture-btn" onClick={handleCapture} disabled={capturing}>
                            {capturing ? (
                                <><span className="cmp-spinner" style={{ width: 16, height: 16, borderWidth: 2 } as React.CSSProperties} /> Generando...</>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Descargar imagen
                                </>
                            )}
                        </button>
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
