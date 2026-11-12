import React, { useState, useEffect, useRef, useMemo } from 'react';
import SiteSelect from './CustomSelect';
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

function PlayerSelector({ players, selected, onSelect, label, align = 'left' }: {
    players: PlayerOption[]; selected: PlayerData | null; onSelect: (slug: string) => void; label: string; align?: 'left' | 'right';
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen]   = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const filtered = useMemo(() => {
        const q = norm(query.trim());
        return players.filter(p => !q || norm(p.nombre).includes(q)).slice(0, 60);
    }, [players, query]);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    useEffect(() => { if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);
    return (
        <div className={`cx-pick${align === 'right' ? ' is-right' : ''}`} ref={ref}>
            <span className="cx-label">{label}</span>
            <div className="pc-bar ep-bar"><div className="pc-picker">
                <button type="button" className="pc-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
                    {selected ? <img src={selected.imageUrl} alt="" width={34} height={34} /> : <span className="ep-initials" aria-hidden="true">+</span>}
                    <span>{selected ? selected.nombre : 'Elegir jugadora'}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {open && (
                    <div className="pc-panel">
                        <label className="pc-search">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                            <input ref={inputRef} type="search" placeholder="Buscar jugadoras..." aria-label="Buscar jugadoras" autoComplete="off"
                                value={query} onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && filtered[0]) { onSelect(filtered[0].slug); setOpen(false); } }} />
                        </label>
                        <div className="pc-list" role="listbox" aria-label="Jugadoras">
                            {filtered.length === 0 && <p className="pc-empty">Sin resultados</p>}
                            {filtered.map(p => (
                                <button type="button" key={p.slug} role="option" aria-selected={selected?.slug === p.slug}
                                    className={`pc-item${selected?.slug === p.slug ? ' is-current' : ''}`}
                                    onClick={() => { onSelect(p.slug); setOpen(false); }}>
                                    <span className="pc-photo"><img src={p.imageUrl} alt="" width={40} height={40} loading="lazy" /></span>
                                    <span className="pc-text"><strong>{p.nombre}</strong><small>{p.posicion || 'Jugadora'}</small></span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div></div>
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

export default function PlayerRadarComparator({ players, initialSlugA = '', initialSlugB = '', competitionLogos = {} }: {
    players: PlayerOption[]; initialSlugA?: string; initialSlugB?: string; competitionLogos?: Record<string, string>;
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
        const order = ['Primera Iberdrola','Liga F','UWCL','Copa de la Reina','Supercopa de España','Amistosos'];
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
            const tableAvatars = Array.from(captureRef.current.querySelectorAll('.cmp-table-avatar')) as HTMLElement[];
            const tablePlayers = Array.from(captureRef.current.querySelectorAll('.cmp-table-player')) as HTMLElement[];
            if (capHeader) capHeader.style.display = 'flex';
            if (tableHeader) tableHeader.style.position = 'relative';
            tableAvatars.forEach(el => { el.style.display = 'block'; });
            tablePlayers.forEach(el => { el.style.padding = '0.65rem 0.5rem'; });

            const imgs = Array.from(captureRef.current.querySelectorAll('img'));
            const origSrcs = imgs.map(img => img.src);

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
                } catch {}
            }));

            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                backgroundColor: '#070d1c',
                scale: 2,
            });

            if (capHeader) capHeader.style.display = '';
            if (tableHeader) tableHeader.style.position = '';
            tableAvatars.forEach(el => { el.style.display = ''; });
            tablePlayers.forEach(el => { el.style.padding = ''; });
            imgs.forEach((img, i) => { img.src = origSrcs[i]; });

            const nameA = dataA?.nombre.replace(/\s+/g, '-') ?? 'A';
            const nameB = dataB?.nombre.replace(/\s+/g, '-') ?? 'B';
            const filename = `comparativa-${nameA}-vs-${nameB}.png`;

            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                const dataUrl = canvas.toDataURL('image/png');
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:1.25rem';
                const hint = document.createElement('p');
                hint.textContent = 'Mantén pulsada la imagen para guardarla';
                hint.style.cssText = 'color:#fff;font-family:sans-serif;font-size:0.875rem;text-align:center;margin:0';
                const imgEl = document.createElement('img');
                imgEl.src = dataUrl;
                imgEl.style.cssText = 'max-width:100%;max-height:75vh;border-radius:10px;display:block';
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Cerrar';
                closeBtn.style.cssText = 'background:#ffde59;color:#2b2b2b;border:none;padding:0.6rem 2rem;border-radius:20px;font-weight:700;font-size:0.9rem;cursor:pointer;font-family:sans-serif';
                closeBtn.onclick = () => document.body.removeChild(overlay);
                overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
                overlay.append(hint, imgEl, closeBtn);
                document.body.appendChild(overlay);
            } else {
                canvas.toBlob((blob) => {
                    if (!blob) return;
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.download = filename;
                    a.href = url;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }, 'image/png');
            }
        } catch (err) {
            console.error('Error generating screenshot:', err);
        } finally {
            setCapturing(false);
        }
    }

    const bothLoading = loadingA || loadingB;
    const hasData = dataA && dataB;

    const seasonOptions = [{ value: '', label: 'Todas las temporadas' }, ...availableSeasons.map(s => ({ value: s, label: s }))];

    return (
        <div className="cx cmp-root">
            <section className="cx-card cx-controls mfx-corners" aria-label="Jugadoras y filtros">
                <div className="cx-pickers cmp-pickers">
                    <PlayerSelector players={players} selected={dataA} onSelect={s => setSlugA(s)} label="Jugadora" />
                    <button type="button" className="cmp-swap" aria-label="Intercambiar" onClick={() => { setSlugA(slugB); setSlugB(slugA); }} disabled={!slugA || !slugB}>
                        {bothLoading ? <span className="cmp-spinner" /> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3" /></svg>}
                    </button>
                    <PlayerSelector players={players} selected={dataB} onSelect={s => setSlugB(s)} label="Comparar con" align="right" />
                </div>
                {(dataA || dataB) && (
                    <div className="cmp-filter-row">
                        <div className="cmp-season">
                            <span className="cx-label">Temporada</span>
                            <SiteSelect id="cmp-season" options={seasonOptions} value={season} onChange={v => setSeason(v)} />
                        </div>
                        {/* Mismo interruptor Totales / Por 90' que la ficha de jugadora. */}
                        <label className="pt-toggle" title="Cambiar entre datos totales y por 90 minutos">
                            <span className={mode === 'total' ? 'is-on' : ''}>Totales</span>
                            <input type="checkbox" checked={mode === 'p90'} onChange={e => setMode(e.target.checked ? 'p90' : 'total')} />
                            <span className="pt-toggle-track" />
                            <span className={mode === 'p90' ? 'is-on' : ''}>Por 90'</span>
                        </label>
                    </div>
                )}
                {(dataA || dataB) && (
                    <div>
                        <span className="cx-label">Competición</span>
                        <div className="pt-pills cx-pills" role="group" aria-label="Competición">
                            {[{ value: '', label: 'Todas' }, ...availableComps.map(c => ({ value: c, label: c === 'Amistosos' ? 'Amistoso' : c === 'Partidos oficiales' ? 'Oficiales' : c }))].map(option => (
                                <button key={option.value || 'all'} type="button" className={`pt-pill${comp === option.value ? ' is-active' : ''}`}
                                    aria-pressed={comp === option.value} onClick={() => setComp(option.value)}>
                                    {competitionLogos[option.value] && <img src={competitionLogos[option.value]} alt="" width={16} height={16} loading="lazy" />}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {hasData ? (
                <>
                    <div ref={captureRef} className="cmp-capture-wrap">
                        <div className="cmp-cap-header">
                            <img src="/icon.webp" alt="Madrid Femenino Xtra" className="cmp-cap-logo" />
                        </div>

                        <section className="cx-card mfx-corners">
                            <div className="cx-versus">
                                <div className="cx-side">
                                    <img src={dataA!.imageUrl} alt="" width={52} height={52} />
                                    <span><strong>{dataA!.nombre}</strong><small>{dataA!.posicion} · {dataA!.stats.partidos} PJ · {dataA!.stats.minutos.toLocaleString('es-ES')}'</small></span>
                                </div>
                                <div className="cx-side is-b">
                                    <img src={dataB!.imageUrl} alt="" width={52} height={52} />
                                    <span><strong>{dataB!.nombre}</strong><small>{dataB!.posicion} · {dataB!.stats.partidos} PJ · {dataB!.stats.minutos.toLocaleString('es-ES')}'</small></span>
                                </div>
                            </div>
                            <div className="cmp-radar">
                                <ResponsiveContainer width="100%" height={360}>
                                    <RadarChart data={radarData!} margin={{ top: 16, right: 48, bottom: 16, left: 48 }}>
                                        <PolarGrid stroke="rgba(212,168,67,0.22)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fill: 'rgba(220,225,232,0.8)' }} />
                                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name={dataA!.nombre} dataKey="A" stroke="#e3bf65" fill="#d4a843" fillOpacity={0.4} strokeWidth={2} dot={{ r: 3, fill: '#e3bf65' }} />
                                        <Radar name={dataB!.nombre} dataKey="B" stroke="#9fb3c8" fill="#9fb3c8" fillOpacity={0.22} strokeWidth={2} dot={{ r: 3, fill: '#9fb3c8' }} />
                                        <Tooltip content={<CustomTooltip nameA={dataA!.nombre} nameB={dataB!.nombre} />} />
                                        <Legend wrapperStyle={{ paddingTop: '12px' }} formatter={v => <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', color: 'rgba(220,225,232,0.85)' }}>{v}</span>} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {TABLE_SECTIONS.map(section => (
                            <section key={section.label} className="cx-card mfx-corners">
                                <h2 className="cx-title">{section.label}{mode === 'p90' ? ' · por 90 minutos' : ''}</h2>
                                <ul className="cx-rows">
                                    {section.rows.map(({ key, label, lowerIsBetter, isDecimal, percentOf }) => {
                                        const rawA = dataA!.stats[key] as number;
                                        const rawB = dataB!.stats[key] as number;
                                        const mA = dataA!.stats.minutos, mB = dataB!.stats.minutos;
                                        const va = mode === 'p90' && !NO_PER90.has(key) ? per90(rawA, mA) : rawA;
                                        const vb = mode === 'p90' && !NO_PER90.has(key) ? per90(rawB, mB) : rawB;
                                        const tie = va === vb;
                                        const aWins = !tie && (lowerIsBetter ? va < vb : va > vb);
                                        const bWins = !tie && !aWins;
                                        const max = Math.max(Math.abs(Number(va) || 0), Math.abs(Number(vb) || 0)) || 1;
                                        return (
                                            <li key={key} className="cx-row">
                                                <span className="cx-head">
                                                    <span className={`cx-val${aWins ? ' is-best' : ''}`}>{display(rawA, key, mA, isDecimal, percentOf, dataA!.stats)}</span>
                                                    <span className="cx-metric">{label}</span>
                                                    <span className={`cx-val${bWins ? ' is-best' : ''}`}>{display(rawB, key, mB, isDecimal, percentOf, dataB!.stats)}</span>
                                                </span>
                                                <span className="cx-bar is-a" aria-hidden="true"><i className={aWins ? 'is-best' : ''} style={{ width: `${(Math.abs(Number(va) || 0) / max) * 100}%` }} /></span>
                                                <span className="cx-bar is-b" aria-hidden="true"><i className={bWins ? 'is-best' : ''} style={{ width: `${(Math.abs(Number(vb) || 0) / max) * 100}%` }} /></span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        ))}
                    </div>

                    <div className="cmp-capture-row">
                        <button type="button" className="squad-download cmp-capture-btn" onClick={handleCapture} disabled={capturing}>
                            {capturing ? 'Generando…' : (/iPad|iPhone|iPod/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '') ? 'Ver imagen' : 'Descargar imagen')}
                        </button>
                    </div>
                </>
            ) : (
                <section className="cx-card mfx-corners"><p className="cx-empty">Elige dos jugadoras para ver la comparativa.</p></section>
            )}
        </div>
    );
}
