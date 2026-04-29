import React, { useState, useEffect, useRef } from 'react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip,
} from 'recharts';

interface PlayerOption {
    slug: string;
    nombre: string;
    imageUrl: string;
    posicion: string;
}

interface Stats {
    partidos: number;
    titularidades: number;
    minutos: number;
    victorias: number;
    porterias_cero: number;
    goles: number;
    asistencias: number;
    amarillas: number;
    rojas: number;
    pases_clave: number;
    tiros_totales: number;
    tiros_puerta: number;
    toques: number;
    toques_area_rival: number;
    pases_completados: number;
    pases_totales: number;
    regates_completados: number;
    regates_totales: number;
    duelos_suelo_ganados: number;
    duelos_aereos_ganados: number;
    intercepciones: number;
    entradas: number;
    bloqueos: number;
    recuperaciones: number;
    perdidas: number;
    faltas_recibidas: number;
    faltas_cometidas: number;
    valoracion_media: number;
}

interface PlayerData {
    slug: string;
    nombre: string;
    imageUrl: string;
    posicion: string;
    stats: Stats;
}

const RADAR_AXES: { key: keyof Stats; label: string }[] = [
    { key: 'goles',              label: 'Goles' },
    { key: 'asistencias',        label: 'Asistencias' },
    { key: 'tiros_puerta',       label: 'Tiros' },
    { key: 'pases_clave',        label: 'Pases clave' },
    { key: 'regates_completados', label: 'Regates' },
    { key: 'intercepciones',     label: 'Intercepciones' },
];

interface TableSection {
    label: string;
    rows: { key: keyof Stats; label: string; lowerIsBetter?: boolean; isDecimal?: boolean }[];
}

const TABLE_SECTIONS: TableSection[] = [
    {
        label: 'PARTICIPACIÓN',
        rows: [
            { key: 'partidos',       label: 'Partidos' },
            { key: 'titularidades',  label: 'Titularidades' },
            { key: 'minutos',        label: 'Minutos' },
            { key: 'victorias',      label: 'Victorias' },
            { key: 'porterias_cero', label: 'Porterías a cero' },
        ],
    },
    {
        label: 'ATAQUE',
        rows: [
            { key: 'goles',              label: 'Goles' },
            { key: 'asistencias',        label: 'Asistencias' },
            { key: 'pases_clave',        label: 'Pases clave' },
            { key: 'tiros_totales',      label: 'Tiros totales' },
            { key: 'tiros_puerta',       label: 'Tiros a puerta' },
            { key: 'toques_area_rival',  label: 'Toques área rival' },
        ],
    },
    {
        label: 'JUEGO',
        rows: [
            { key: 'toques',             label: 'Toques' },
            { key: 'pases_completados',  label: 'Pases completados' },
            { key: 'pases_totales',      label: 'Pases totales' },
            { key: 'regates_completados', label: 'Regates completados' },
            { key: 'regates_totales',    label: 'Regates intentados' },
            { key: 'valoracion_media',   label: 'Valoración media', isDecimal: true },
        ],
    },
    {
        label: 'DEFENSA',
        rows: [
            { key: 'intercepciones',        label: 'Intercepciones' },
            { key: 'entradas',              label: 'Entradas' },
            { key: 'bloqueos',              label: 'Bloqueos' },
            { key: 'recuperaciones',        label: 'Recuperaciones' },
            { key: 'duelos_suelo_ganados',  label: 'Duelos en suelo ganados' },
            { key: 'duelos_aereos_ganados', label: 'Duelos aéreos ganados' },
        ],
    },
    {
        label: 'DISCIPLINA',
        rows: [
            { key: 'faltas_recibidas',  label: 'Faltas recibidas' },
            { key: 'faltas_cometidas',  label: 'Faltas cometidas', lowerIsBetter: true },
            { key: 'perdidas',          label: 'Pérdidas',         lowerIsBetter: true },
            { key: 'amarillas',         label: 'Tarjetas amarillas', lowerIsBetter: true },
            { key: 'rojas',             label: 'Tarjetas rojas',     lowerIsBetter: true },
        ],
    },
];

function normalize(val: number, max: number) {
    if (max === 0) return 0;
    return Math.round((val / max) * 100);
}

function buildRadarData(a: PlayerData, b: PlayerData) {
    return RADAR_AXES.map(({ key, label }) => {
        const va = a.stats[key] as number;
        const vb = b.stats[key] as number;
        const max = Math.max(va, vb, 1);
        return { subject: label, A: normalize(va, max), B: normalize(vb, max), rawA: va, rawB: vb };
    });
}

function PlayerSelector({
    players, selected, onSelect, color, label,
}: {
    players: PlayerOption[];
    selected: PlayerData | null;
    onSelect: (slug: string) => void;
    color: string;
    label: string;
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = query.length >= 1
        ? players.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
        : [];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="cmp-side" ref={ref}>
            <span className="cmp-side-label" style={{ color }}>{label}</span>
            <div className="cmp-selector" style={{ '--accent': color } as React.CSSProperties}>
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
                            type="text"
                            className="cmp-input"
                            placeholder="Buscar jugadora..."
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

function fmt(val: number, isDecimal = false, key?: keyof Stats) {
    if (key === 'minutos') return val.toLocaleString('es-ES');
    if (isDecimal) return val.toFixed(1);
    return val;
}

export default function PlayerRadarComparator({ players, initialSlugA = '', initialSlugB = '' }: {
    players: PlayerOption[];
    initialSlugA?: string;
    initialSlugB?: string;
}) {
    const [slugA, setSlugA] = useState(initialSlugA);
    const [slugB, setSlugB] = useState(initialSlugB);
    const [dataA, setDataA] = useState<PlayerData | null>(null);
    const [dataB, setDataB] = useState<PlayerData | null>(null);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);

    async function loadPlayer(slug: string, setter: (d: PlayerData | null) => void, ls: (v: boolean) => void) {
        if (!slug) { setter(null); return; }
        ls(true);
        try {
            const res = await fetch(`/api/player-radar/${slug}`);
            setter(res.ok ? await res.json() : null);
        } catch { setter(null); }
        finally { ls(false); }
    }

    useEffect(() => { loadPlayer(slugA, setDataA, setLoadingA); }, [slugA]);
    useEffect(() => { loadPlayer(slugB, setDataB, setLoadingB); }, [slugB]);

    useEffect(() => {
        const url = new URL(window.location.href);
        slugA ? url.searchParams.set('a', slugA) : url.searchParams.delete('a');
        slugB ? url.searchParams.set('b', slugB) : url.searchParams.delete('b');
        window.history.replaceState({}, '', url.toString());
    }, [slugA, slugB]);

    const radarData = dataA && dataB ? buildRadarData(dataA, dataB) : null;
    const bothLoading = loadingA || loadingB;

    return (
        <div className="cmp-root">
            {/* Selectors */}
            <div className="cmp-selectors">
                <PlayerSelector players={players} selected={dataA} onSelect={s => setSlugA(s)} color="#c9a800" label="JUGADORA A" />
                <div className="cmp-vs">{bothLoading ? <span className="cmp-spinner" /> : 'VS'}</div>
                <PlayerSelector players={players} selected={dataB} onSelect={s => setSlugB(s)} color="#151e42" label="JUGADORA B" />
            </div>

            {radarData && dataA && dataB ? (
                <>
                    {/* Radar */}
                    <div className="cmp-chart-card">
                        <ResponsiveContainer width="100%" height={380}>
                            <RadarChart data={radarData} margin={{ top: 16, right: 48, bottom: 16, left: 48 }}>
                                <PolarGrid stroke="#e8e8e8" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 13, fill: '#151e42' }}
                                />
                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name={dataA.nombre} dataKey="A" stroke="#c9a800" fill="#ffde59" fillOpacity={0.45} strokeWidth={2} dot={{ r: 3, fill: '#c9a800' }} />
                                <Radar name={dataB.nombre} dataKey="B" stroke="#151e42" fill="#151e42" fillOpacity={0.22} strokeWidth={2} dot={{ r: 3, fill: '#151e42' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ paddingTop: '12px' }}
                                    formatter={v => <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '0.9rem', color: '#151e42' }}>{v}</span>}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="cmp-table-card">
                        {/* Sticky header */}
                        <div className="cmp-table-header">
                            <div className="cmp-table-player cmp-table-player-a">
                                <img src={dataA.imageUrl} alt={dataA.nombre} className="cmp-table-avatar" />
                                <span className="cmp-table-pname">{dataA.nombre}</span>
                            </div>
                            <div className="cmp-table-stat-col">ESTADÍSTICA</div>
                            <div className="cmp-table-player cmp-table-player-b">
                                <span className="cmp-table-pname">{dataB.nombre}</span>
                                <img src={dataB.imageUrl} alt={dataB.nombre} className="cmp-table-avatar" />
                            </div>
                        </div>

                        {TABLE_SECTIONS.map(section => (
                            <div key={section.label}>
                                <div className="cmp-section-header">{section.label}</div>
                                {section.rows.map(({ key, label, lowerIsBetter, isDecimal }) => {
                                    const va = dataA.stats[key] as number;
                                    const vb = dataB.stats[key] as number;
                                    const aWins = lowerIsBetter ? va < vb : va > vb;
                                    const bWins = lowerIsBetter ? vb < va : vb > va;
                                    const tie   = va === vb;
                                    return (
                                        <div key={key} className="cmp-row">
                                            <div className={`cmp-cell cmp-cell-a ${!tie && aWins ? 'cmp-winner' : ''}`}>
                                                {fmt(va, isDecimal, key)}
                                            </div>
                                            <div className="cmp-cell cmp-cell-stat">{label}</div>
                                            <div className={`cmp-cell cmp-cell-b ${!tie && bWins ? 'cmp-winner' : ''}`}>
                                                {fmt(vb, isDecimal, key)}
                                            </div>
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
