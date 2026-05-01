import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ComposedChart, Bar, Cell, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import * as d3 from 'd3';

interface MatchPoint {
    matchNum: number; fecha: string; goles: number; xg: number;
    cumXg: number; cumGoals: number; competicion: string; temporada: string; rival: string;
}
interface NetworkNode { id: string; name: string; img: string | null; assists: number; goals: number; }
interface NetworkEdge { from: string; to: string; fromName: string; toName: string; weight: number; }
interface XGPayload  { matches: MatchPoint[]; seasons: string[]; competitions: string[]; }
interface NetPayload { nodes: NetworkNode[]; edges: NetworkEdge[]; seasons: string[]; competitions: string[]; }
interface SimNode extends d3.SimulationNodeDatum { id: string; name: string; img: string | null; assists: number; goals: number; }
interface SimLink extends d3.SimulationLinkDatum<SimNode> { weight: number; fromName: string; toName: string; }
interface SelectedInfo { node: NetworkNode; given: NetworkEdge[]; received: NetworkEdge[]; }

function nodeR(n: Pick<SimNode, 'assists' | 'goals'>) {
    return 20 + Math.min((n.assists + n.goals) * 0.9, 18);
}

function CustomSelect({ label, options, value, onChange }: {
    label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div className="adv-filter-group" ref={ref}>
            <span className="adv-filter-label">{label}</span>
            <div className={`adv-custom-select ${open ? 'open' : ''}`}>
                <button type="button" className="adv-custom-trigger" onClick={() => setOpen(o => !o)} aria-expanded={open}>
                    <span className="adv-custom-text">{value || 'Todas'}</span>
                    <svg className="adv-custom-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1 1l5 5 5-5" stroke="#2b2b2b" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>
                {open && (
                    <ul className="adv-custom-options">
                        <li className={`adv-custom-option ${value === '' ? 'selected' : ''}`}
                            onMouseDown={() => { onChange(''); setOpen(false); }}>Todas</li>
                        {options.map(o => (
                            <li key={o} className={`adv-custom-option ${value === o ? 'selected' : ''}`}
                                onMouseDown={() => { onChange(o); setOpen(false); }}>{o}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function XGTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d: MatchPoint = payload[0].payload;
    const fecha = d.fecha
        ? new Date(d.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
    const over = d.goles > d.xg;
    const diff = Math.abs(d.goles - d.xg).toFixed(2);
    const label = d.goles === d.xg ? null
        : over ? `↑ +${diff} sobre xG` : `↓ −${diff} bajo xG`;
    return (
        <div className="adv-tooltip">
            {d.rival && <p className="adv-tooltip-title">{d.rival}</p>}
            {fecha && <p className="adv-tooltip-sub">{fecha} · {d.competicion}</p>}
            <div className="adv-tooltip-divider" />
            <p style={{ color: '#ffde59', margin: 0 }}>xG: <strong>{d.xg.toFixed(2)}</strong></p>
            <p style={{ color: '#e5e7eb', margin: 0 }}>Goles: <strong>{d.goles}</strong></p>
            {label && (
                <p style={{ color: over ? '#4ade80' : '#f87171', margin: 0, fontSize: '0.72rem' }}>{label}</p>
            )}
        </div>
    );
}

function XGChart({ data }: { data: MatchPoint[] }) {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data} margin={{ top: 8, right: 20, left: -10, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="matchNum" tick={{ fontFamily: 'Inter', fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontFamily: 'Inter', fontSize: 10, fill: '#9ca3af' }} allowDecimals />
                <RTooltip content={<XGTooltip />} cursor={{ fill: 'rgba(255,222,89,0.08)' }} />
                <Legend
                    wrapperStyle={{ fontFamily: 'Inter', fontSize: 12, paddingTop: '10px' }}
                    formatter={v => v === 'xg' ? 'xG' : 'Goles'}
                />
                <Bar dataKey="goles" name="goles" barSize={14} radius={[3, 3, 0, 0]}>
                    {data.map((d, i) => (
                        <Cell key={i} fill={d.goles >= d.xg ? '#1a1a1a' : '#d1d5db'} opacity={0.88} />
                    ))}
                </Bar>
                <Line type="monotone" dataKey="xg" name="xg"
                    stroke="#ffde59" strokeWidth={2.5}
                    dot={{ r: 3, fill: '#ffde59', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#ffde59' }} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

function AssistGraph({ nodes, edges }: { nodes: NetworkNode[]; edges: NetworkEdge[] }) {
    const svgRef       = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef   = useRef<HTMLDivElement>(null);
    const [graphW, setGraphW]         = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect.width;
            if (w > 0) setGraphW(Math.floor(w));
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!svgRef.current || !nodes.length || graphW === 0) return;

        const W = graphW;
        const H = Math.max(300, Math.min(540, W * 0.7));

        const svg = d3.select(svgRef.current).attr('width', W).attr('height', H);
        svg.selectAll('*').remove();

        const defs = svg.append('defs');
        nodes.forEach(n => {
            const r = nodeR(n as SimNode);
            defs.append('clipPath').attr('id', `adv-clip-${n.id.replace(/\W/g, '_')}`)
                .append('circle').attr('r', r);
        });

        const simNodes: SimNode[] = nodes.map(n => ({ ...n }));
        const byId = new Map(simNodes.map(n => [n.id, n]));

        const simLinks: SimLink[] = edges
            .filter(e => byId.has(e.from) && byId.has(e.to) && e.from !== e.to)
            .map(e => ({
                source: byId.get(e.from)!,
                target: byId.get(e.to)!,
                weight: e.weight, fromName: e.fromName, toName: e.toName,
            }));

        const maxW = Math.max(...simLinks.map(l => l.weight), 1);

        const simulation = d3.forceSimulation<SimNode>(simNodes)
            .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(140).strength(0.3))
            .force('charge', d3.forceManyBody<SimNode>().strength(-420))
            .force('center', d3.forceCenter(W / 2, H / 2))
            .force('collision', d3.forceCollide<SimNode>().radius(d => nodeR(d) + 16));

        const g = svg.append('g');
        svg.call(
            d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.2, 4])
                .on('zoom', ev => g.attr('transform', ev.transform))
        );
        svg.on('click', () => setSelectedId(null));

        const linkVisG = g.append('g');
        const linkHitG = g.append('g');

        const link = linkVisG.selectAll<SVGLineElement, SimLink>('line')
            .data(simLinks).join('line')
            .attr('stroke', '#ffde59')
            .attr('stroke-opacity', 0.85)
            .attr('stroke-width', d => 1 + (d.weight / maxW) * 3);

        const tooltip = d3.select(tooltipRef.current!);

        const linkHit = linkHitG.selectAll<SVGLineElement, SimLink>('line')
            .data(simLinks).join('line')
            .attr('stroke', 'transparent')
            .attr('stroke-width', 18)
            .style('cursor', 'default')
            .on('mouseenter', (_, d) => {
                tooltip.style('display', 'block')
                    .html(`<strong>${d.fromName}</strong> → <strong>${d.toName}</strong><br/>${d.weight} asistencia${d.weight > 1 ? 's' : ''}`);
            })
            .on('mousemove', ev => {
                const rect = svgRef.current!.getBoundingClientRect();
                tooltip.style('left', `${ev.clientX - rect.left + 14}px`).style('top', `${ev.clientY - rect.top - 52}px`);
            })
            .on('mouseleave', () => tooltip.style('display', 'none'));

        const drag = d3.drag<SVGGElement, SimNode>()
            .on('start', (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
            .on('end',   (ev, d) => { if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; });

        const nodeG = g.append('g').selectAll<SVGGElement, SimNode>('g')
            .data(simNodes).join('g')
            .attr('cursor', 'pointer')
            .call(drag);

        nodeG.each(function(d) {
            const el  = d3.select(this);
            const r   = nodeR(d);
            const sid = d.id.replace(/\W/g, '_');

            el.append('circle').attr('class', 'adv-node-ring').attr('r', r + 5)
                .attr('fill', 'none').attr('stroke', '#ffde59').attr('stroke-width', 3).attr('opacity', 0);

            el.append('circle').attr('r', r).attr('fill', '#e5e7eb')
                .attr('stroke', '#fff').attr('stroke-width', 2.5);

            if (d.img) {
                const src = /^https?:/.test(d.img) ? d.img : `https:${d.img}`;
                el.append('image')
                    .attr('href', src)
                    .attr('x', -r).attr('y', -r)
                    .attr('width', r * 2).attr('height', r * 2)
                    .attr('preserveAspectRatio', 'xMidYMin slice')
                    .attr('clip-path', `url(#adv-clip-${sid})`);
            } else {
                el.append('text')
                    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
                    .attr('font-size', r * 0.65).attr('font-family', 'Bebas Neue, sans-serif')
                    .attr('fill', '#374151')
                    .text(d.name.split(' ').map((w: string) => w[0]).slice(0, 2).join(''));
            }

            el.append('text')
                .attr('y', r + 14).attr('text-anchor', 'middle')
                .attr('font-size', '9px').attr('font-family', 'Bebas Neue, sans-serif')
                .attr('fill', '#374151').attr('letter-spacing', '0.4px')
                .text(d.name);

            el.append('text')
                .attr('y', r + 26).attr('text-anchor', 'middle')
                .attr('font-size', '8px').attr('font-family', 'Inter, sans-serif')
                .attr('fill', '#9ca3af')
                .text(`${d.assists}A · ${d.goals}G`);
        });

        nodeG
            .on('mouseenter', (_, d) => {
                tooltip.style('display', 'block')
                    .html(`<strong>${d.name}</strong><br/>${d.assists} asist. · ${d.goals} goles recibidos`);
            })
            .on('mousemove', ev => {
                const rect = svgRef.current!.getBoundingClientRect();
                tooltip.style('left', `${ev.clientX - rect.left + 14}px`).style('top', `${ev.clientY - rect.top - 52}px`);
            })
            .on('mouseleave', () => tooltip.style('display', 'none'))
            .on('click', (ev, d) => {
                ev.stopPropagation();
                setSelectedId(prev => prev === d.id ? null : d.id);
            });

        simulation.on('tick', () => {
            const pad = 30;
            simNodes.forEach(d => {
                const r = nodeR(d);
                d.x = Math.max(r + pad, Math.min(W - r - pad, d.x ?? W / 2));
                d.y = Math.max(r + pad, Math.min(H - r - pad, d.y ?? H / 2));
            });
            const x1 = (d: SimLink) => ((d.source as SimNode).x ?? 0);
            const y1 = (d: SimLink) => ((d.source as SimNode).y ?? 0);
            const x2 = (d: SimLink) => ((d.target as SimNode).x ?? 0);
            const y2 = (d: SimLink) => ((d.target as SimNode).y ?? 0);
            link.attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
            linkHit.attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
            nodeG.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
        });

        return () => { simulation.stop(); };
    }, [nodes, edges, graphW]);

    useEffect(() => {
        if (!svgRef.current) return;
        d3.select(svgRef.current).selectAll<SVGCircleElement, SimNode>('.adv-node-ring')
            .attr('opacity', (d: SimNode) => d.id === selectedId ? 1 : 0);
    }, [selectedId]);

    const info: SelectedInfo | null = useMemo(() => {
        if (!selectedId) return null;
        const node = nodes.find(n => n.id === selectedId);
        if (!node) return null;
        return {
            node,
            given:    edges.filter(e => e.from === selectedId).sort((a, b) => b.weight - a.weight),
            received: edges.filter(e => e.to   === selectedId).sort((a, b) => b.weight - a.weight),
        };
    }, [selectedId, nodes, edges]);

    return (
        <div className="adv-graph-outer">
            <div ref={containerRef} className="adv-graph-wrap">
                <svg ref={svgRef} style={{ width: '100%', display: 'block' }} />
                <div ref={tooltipRef} className="adv-graph-tooltip" />
            </div>
            {info && (
                <div className="adv-node-panel">
                    <div className="adv-node-panel-header">
                        {info.node.img && (
                            <img
                                src={/^https?:/.test(info.node.img) ? info.node.img : `https:${info.node.img}`}
                                alt={info.node.name}
                                className="adv-node-panel-img"
                            />
                        )}
                        <div>
                            <p className="adv-node-panel-name">{info.node.name}</p>
                            <p className="adv-node-panel-stats">
                                {info.node.assists} asistencias · {info.node.goals} goles recibidos
                            </p>
                        </div>
                        <button className="adv-node-panel-close" onClick={() => setSelectedId(null)} aria-label="Cerrar">✕</button>
                    </div>
                    <div className="adv-node-panel-cols">
                        <div className="adv-node-panel-col">
                            <h4 className="adv-node-panel-col-title">Ha asistido a</h4>
                            {info.given.length
                                ? info.given.map(e => (
                                    <div key={e.to} className="adv-node-panel-row">
                                        <span className="adv-node-panel-player">{e.toName}</span>
                                        <span className="adv-node-panel-badge">{e.weight}</span>
                                    </div>
                                ))
                                : <p className="adv-node-panel-empty">Sin registros</p>}
                        </div>
                        <div className="adv-node-panel-col">
                            <h4 className="adv-node-panel-col-title">Le han asistido</h4>
                            {info.received.length
                                ? info.received.map(e => (
                                    <div key={e.from} className="adv-node-panel-row">
                                        <span className="adv-node-panel-player">{e.fromName}</span>
                                        <span className="adv-node-panel-badge">{e.weight}</span>
                                    </div>
                                ))
                                : <p className="adv-node-panel-empty">Sin registros</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Spinner() { return <div className="adv-loading"><span className="adv-spinner" /></div>; }

function Empty({ msg }: { msg: string }) {
    return (
        <div className="adv-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 0.75rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l7.5-7.5 3 3 4.5-4.5M21 7.5V3h-4.5M21 21H3" />
            </svg>
            <p>{msg}</p>
        </div>
    );
}

export default function AdvancedStats() {
    const [season,      setSeason]      = useState('');
    const [competition, setCompetition] = useState('');
    const [xgData,  setXgData]  = useState<XGPayload  | null>(null);
    const [netData, setNetData] = useState<NetPayload  | null>(null);
    const [xgLoading,  setXgLoading]  = useState(true);
    const [netLoading, setNetLoading] = useState(true);
    const [xgError,    setXgError]    = useState(false);
    const [netError,   setNetError]   = useState(false);

    const seasons = useMemo(() => {
        const all = [...(xgData?.seasons ?? []), ...(netData?.seasons ?? [])];
        return [...new Set(all)].sort().reverse();
    }, [xgData, netData]);

    const competitions = useMemo(() => {
        const all = [...(xgData?.competitions ?? []), ...(netData?.competitions ?? [])];
        return [...new Set(all)].sort();
    }, [xgData, netData]);

    const availableComps = useMemo(
        () => competitions.length ? ['Partidos oficiales', ...competitions] : [],
        [competitions]
    );

    useEffect(() => {
        setXgLoading(true); setXgError(false);
        const p = new URLSearchParams();
        if (season) p.set('season', season);
        if (competition) p.set('competition', competition);
        fetch(`/api/xg-timeline?${p}`)
            .then(r => r.json())
            .then(d => { setXgData(d); setXgLoading(false); })
            .catch(() => { setXgError(true); setXgLoading(false); });
    }, [season, competition]);

    useEffect(() => {
        setNetLoading(true); setNetError(false);
        const p = new URLSearchParams();
        if (season) p.set('season', season);
        if (competition) p.set('competition', competition);
        fetch(`/api/assist-network?${p}`)
            .then(r => r.json())
            .then(d => { setNetData(d); setNetLoading(false); })
            .catch(() => { setNetError(true); setNetLoading(false); });
    }, [season, competition]);

    return (
        <div className="adv-root">
            <div className="adv-filters">
                <CustomSelect label="TEMPORADA"   options={seasons}        value={season}      onChange={setSeason} />
                <CustomSelect label="COMPETICIÓN" options={availableComps} value={competition} onChange={setCompetition} />
            </div>
            <section className="adv-section">
                <div className="adv-section-header">
                    <h2 className="adv-section-title">TRACKER XG</h2>
                    <p className="adv-section-sub">Goles reales (barras) vs xG esperado (línea) por partido</p>
                </div>
                <div className="adv-card">
                    {xgLoading  ? <Spinner />
                    : xgError || !xgData?.matches?.length
                    ? <Empty msg="Sin datos de xG para este filtro" />
                    : <XGChart data={xgData.matches} />}
                </div>
            </section>
            <section className="adv-section">
                <div className="adv-section-header">
                    <h2 className="adv-section-title">RED DE ASISTENCIAS</h2>
                    <p className="adv-section-sub">Arrastra los nodos · Rueda para zoom · Grosor = nº de asistencias · Pulsa un nodo para ver sus conexiones</p>
                </div>
                <div className="adv-card adv-card-graph">
                    {netLoading ? <Spinner />
                    : netError || !netData?.nodes?.length
                    ? <Empty msg="Sin datos de asistencias para este filtro" />
                    : <AssistGraph nodes={netData.nodes} edges={netData.edges} />}
                </div>
            </section>
        </div>
    );
}
