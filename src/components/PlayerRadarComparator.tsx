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

interface PlayerStats {
    slug: string;
    nombre: string;
    imageUrl: string;
    posicion: string;
    stats: {
        partidos: number;
        titularidades: number;
        minutos: number;
        goles: number;
        asistencias: number;
        amarillas: number;
        rojas: number;
    };
}

const AXES = [
    { key: 'goles',         label: 'Goles' },
    { key: 'asistencias',   label: 'Asistencias' },
    { key: 'partidos',      label: 'Partidos' },
    { key: 'titularidades', label: 'Titularidades' },
    { key: 'minutos',       label: 'Minutos' },
    { key: 'amarillas',     label: 'Amarillas' },
] as const;

type AxisKey = typeof AXES[number]['key'];

const TABLE_ROWS: { key: keyof PlayerStats['stats']; label: string }[] = [
    { key: 'partidos',      label: 'Partidos' },
    { key: 'titularidades', label: 'Titularidades' },
    { key: 'minutos',       label: 'Minutos' },
    { key: 'goles',         label: 'Goles' },
    { key: 'asistencias',   label: 'Asistencias' },
    { key: 'amarillas',     label: 'Tarjetas amarillas' },
    { key: 'rojas',         label: 'Tarjetas rojas' },
];

function normalize(val: number, max: number) {
    if (max === 0) return 0;
    return Math.round((val / max) * 100);
}

function buildRadarData(a: PlayerStats, b: PlayerStats) {
    return AXES.map(({ key, label }) => {
        const va = a.stats[key as AxisKey];
        const vb = b.stats[key as AxisKey];
        const max = Math.max(va, vb, 1);
        return { subject: label, A: normalize(va, max), B: normalize(vb, max), rawA: va, rawB: vb };
    });
}

function PlayerSelector({
    players,
    selected,
    onSelect,
    color,
}: {
    players: PlayerOption[];
    selected: PlayerStats | null;
    onSelect: (slug: string) => void;
    color: string;
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
        <div className="comparador-selector" ref={ref}>
            {selected ? (
                <div className="comparador-selected" style={{ borderColor: color }}>
                    <img src={selected.imageUrl} alt={selected.nombre} className="comparador-avatar" />
                    <div className="comparador-selected-info">
                        <span className="comparador-selected-name">{selected.nombre}</span>
                        <span className="comparador-selected-pos">{selected.posicion}</span>
                    </div>
                    <button className="comparador-clear" onClick={() => { onSelect(''); setQuery(''); }}>✕</button>
                </div>
            ) : (
                <div className="comparador-input-wrap" style={{ borderColor: color }}>
                    <input
                        type="text"
                        className="comparador-input"
                        placeholder="Buscar jugadora..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                    />
                </div>
            )}
            {open && filtered.length > 0 && !selected && (
                <ul className="comparador-dropdown">
                    {filtered.map(p => (
                        <li key={p.slug} className="comparador-option" onMouseDown={() => {
                            onSelect(p.slug);
                            setQuery('');
                            setOpen(false);
                        }}>
                            <img src={p.imageUrl} alt={p.nombre} className="comparador-option-img" />
                            <span className="comparador-option-name">{p.nombre}</span>
                            <span className="comparador-option-pos">{p.posicion}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div className="comparador-tooltip">
            <p className="comparador-tooltip-label">{d.subject}</p>
            <p style={{ color: '#ffde59' }}>A: {d.rawA}</p>
            <p style={{ color: '#151e42' }}>B: {d.rawB}</p>
        </div>
    );
};

export default function PlayerRadarComparator({
    players,
    initialSlugA = '',
    initialSlugB = '',
}: {
    players: PlayerOption[];
    initialSlugA?: string;
    initialSlugB?: string;
}) {
    const [slugA, setSlugA] = useState(initialSlugA);
    const [slugB, setSlugB] = useState(initialSlugB);
    const [dataA, setDataA] = useState<PlayerStats | null>(null);
    const [dataB, setDataB] = useState<PlayerStats | null>(null);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);

    async function loadPlayer(slug: string, setter: (d: PlayerStats | null) => void, loadingSetter: (v: boolean) => void) {
        if (!slug) { setter(null); return; }
        loadingSetter(true);
        try {
            const res = await fetch(`/api/player-radar/${slug}`);
            if (res.ok) setter(await res.json());
            else setter(null);
        } catch { setter(null); }
        finally { loadingSetter(false); }
    }

    useEffect(() => { loadPlayer(slugA, setDataA, setLoadingA); }, [slugA]);
    useEffect(() => { loadPlayer(slugB, setDataB, setLoadingB); }, [slugB]);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (slugA) url.searchParams.set('a', slugA); else url.searchParams.delete('a');
        if (slugB) url.searchParams.set('b', slugB); else url.searchParams.delete('b');
        window.history.replaceState({}, '', url.toString());
    }, [slugA, slugB]);

    const radarData = dataA && dataB ? buildRadarData(dataA, dataB) : null;

    return (
        <div className="comparador-root">
            <div className="comparador-selectors">
                <div className="comparador-side comparador-side-a">
                    <span className="comparador-side-label" style={{ color: '#c9a800' }}>JUGADORA A</span>
                    <PlayerSelector players={players} selected={dataA} onSelect={s => setSlugA(s)} color="#ffde59" />
                    {loadingA && <p className="comparador-loading">Cargando...</p>}
                </div>
                <div className="comparador-vs">VS</div>
                <div className="comparador-side comparador-side-b">
                    <span className="comparador-side-label" style={{ color: '#151e42' }}>JUGADORA B</span>
                    <PlayerSelector players={players} selected={dataB} onSelect={s => setSlugB(s)} color="#151e42" />
                    {loadingB && <p className="comparador-loading">Cargando...</p>}
                </div>
            </div>

            {radarData && dataA && dataB ? (
                <>
                    <div className="comparador-chart-wrap">
                        <ResponsiveContainer width="100%" height={420}>
                            <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                <PolarGrid stroke="#e0e0e0" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 14, fill: '#151e42' }}
                                />
                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name={dataA.nombre} dataKey="A" stroke="#c9a800" fill="#ffde59" fillOpacity={0.45} strokeWidth={2} />
                                <Radar name={dataB.nombre} dataKey="B" stroke="#151e42" fill="#151e42" fillOpacity={0.25} strokeWidth={2} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    formatter={(value) => (
                                        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '0.95rem', color: '#151e42' }}>
                                            {value}
                                        </span>
                                    )}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="comparador-table-wrap">
                        <table className="comparador-table">
                            <thead>
                                <tr>
                                    <th className="comparador-th comparador-th-a">{dataA.nombre}</th>
                                    <th className="comparador-th comparador-th-stat">ESTADÍSTICA</th>
                                    <th className="comparador-th comparador-th-b">{dataB.nombre}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TABLE_ROWS.map(({ key, label }) => {
                                    const va = dataA.stats[key];
                                    const vb = dataB.stats[key];
                                    const aWins = va > vb;
                                    const bWins = vb > va;
                                    const isCards = key === 'amarillas' || key === 'rojas';
                                    const aHighlight = isCards ? vb > va : aWins;
                                    const bHighlight = isCards ? va > vb : bWins;
                                    return (
                                        <tr key={key} className="comparador-tr">
                                            <td className={`comparador-td comparador-td-a ${aHighlight ? 'comparador-winner' : ''}`}>
                                                {key === 'minutos' ? va.toLocaleString('es-ES') : va}
                                            </td>
                                            <td className="comparador-td comparador-td-stat">{label}</td>
                                            <td className={`comparador-td comparador-td-b ${bHighlight ? 'comparador-winner' : ''}`}>
                                                {key === 'minutos' ? vb.toLocaleString('es-ES') : vb}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="comparador-empty">
                    <p>Selecciona dos jugadoras para ver la comparativa</p>
                </div>
            )}
        </div>
    );
}
