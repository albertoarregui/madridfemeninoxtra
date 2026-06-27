import React, { Component, useState, useEffect, useRef, useMemo } from 'react';
import {
    ComposedChart, Bar, Cell, Line, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RTooltip, Legend, ResponsiveContainer,
    FunnelChart, Funnel, LabelList,
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
interface FunnelStage { stage: string; value: number; }
interface TeamPayload { funnel: FunnelStage[]; conversion: number; matchCount: number; seasons: string[]; competitions: string[]; }
interface PlayerFinish { id: string; name: string; tiros: number; tirosPuerta: number; goles: number; }
interface PlayerFinishPayload { players: PlayerFinish[]; seasons: string[]; competitions: string[]; }

class TopErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; errMsg: string }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, errMsg: '' };
    }
    static getDerivedStateFromError(err: Error) { return { hasError: true, errMsg: err.message }; }
    componentDidCatch(err: Error, info: React.ErrorInfo) {
        console.error('[AdvancedStats]', err, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="adv-root">
                    <div className="adv-empty" style={{ minHeight: 260 }}>
                        <p>Error al cargar las estadísticas. Revisa la consola.</p>
                        <p style={{ fontSize: '0.72rem', marginTop: '0.5rem', opacity: 0.5 }}>{this.state.errMsg}</p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

class ChartBoundary extends Component<{ children: React.ReactNode; name: string }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err: Error, info: React.ErrorInfo) {
        console.error(`[ChartBoundary:${this.props.name}]`, err, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="adv-empty" style={{ minHeight: 180 }}>
                    <p>Error al renderizar el gráfico.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

function nodeR(n: Pick<SimNode, 'assists' | 'goals'>) {
    return 20 + Math.min((n.assists + n.goals) * 0.9, 18);
}

function CustomSelect({ label, options, value, onChange, allOption = 'Todas' }: {
    label: string; options: string[]; value: string; onChange: (v: string) => void; allOption?: string | null;
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
                    <span className="adv-custom-text">{value || (allOption ?? 'Selecciona')}</span>
                    <svg className="adv-custom-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1 1l5 5 5-5" stroke="rgba(212,168,67,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>
                {open && (
                    <ul className="adv-custom-options">
                        {allOption !== null && (
                            <li className={`adv-custom-option ${value === '' ? 'selected' : ''}`}
                                onMouseDown={() => { onChange(''); setOpen(false); }}>{allOption}</li>
                        )}
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
            <p style={{ color: '#d4a843', margin: 0 }}>xG: <strong>{d.xg.toFixed(2)}</strong></p>
            <p style={{ color: 'rgba(200,210,220,0.85)', margin: 0 }}>Goles: <strong>{d.goles}</strong></p>
            {label && (
                <p style={{ color: over ? '#4ade80' : '#f87171', margin: 0, fontSize: '0.72rem' }}>{label}</p>
            )}
        </div>
    );
}

function XGChart({ data }: { data: MatchPoint[] }) {
    const [dims, setDims] = useState({ h: 300, mobile: false, small: false });

    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            setDims({
                h: w < 480 ? 240 : w < 768 ? 270 : 300,
                mobile: w < 768,
                small: w < 480,
            });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const { h: chartH, mobile, small } = dims;

    const perPoint     = small ? 15 : 18;
    const scrollMode   = mobile && data.length > (small ? 16 : 24);
    const innerWidthPx = scrollMode ? Math.max(data.length * perPoint, 360) : null;

    const maxLabels    = scrollMode ? Math.round(data.length / 3) : small ? 6 : mobile ? 9 : 16;
    const tickInterval = data.length > maxLabels ? Math.ceil(data.length / maxLabels) - 1 : 0;
    const barSize      = scrollMode ? 9 : small ? 6 : mobile ? 9 : 12;
    const dotR         = scrollMode ? 2.5 : small ? 1.5 : 3;

    const chart = (
            <ResponsiveContainer width="100%" height={chartH}>
                <ComposedChart data={data} margin={{ top: 8, right: small ? 4 : 10, left: small ? -28 : -22, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,67,0.1)" vertical={false} />
                    <XAxis
                        dataKey="matchNum"
                        tick={{ fontFamily: 'DM Sans, sans-serif', fontSize: small ? 9 : 10, fill: 'rgba(200,210,220,0.5)' }}
                        tickLine={false}
                        axisLine={false}
                        interval={tickInterval}
                        minTickGap={small ? 8 : 4}
                    />
                    <YAxis
                        tick={{ fontFamily: 'DM Sans, sans-serif', fontSize: small ? 9 : 10, fill: 'rgba(200,210,220,0.5)' }}
                        allowDecimals
                        width={small ? 26 : 30}
                        axisLine={false}
                        tickLine={false}
                    />
                    <RTooltip
                        content={<XGTooltip />}
                        cursor={{ fill: 'rgba(212,168,67,0.06)' }}
                    />
                    <Legend
                        wrapperStyle={{ fontFamily: 'DM Sans, sans-serif', fontSize: small ? 10 : 11, paddingTop: '8px', color: 'rgba(200,210,220,0.7)' }}
                        formatter={v => v === 'xg' ? 'xG esperado' : 'Goles reales'}
                    />
                    <Bar dataKey="goles" name="goles" barSize={barSize} radius={[3, 3, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.goles >= entry.xg ? '#d4a843' : 'rgba(212,168,67,0.3)'}
                                fillOpacity={0.9}
                            />
                        ))}
                    </Bar>
                    <Line type="monotone" dataKey="xg" name="xg"
                        stroke="#d4a843" strokeWidth={small ? 2 : 2.5}
                        dot={{ r: dotR, fill: '#d4a843', strokeWidth: 0 }}
                        activeDot={{ r: small ? 5 : 7, fill: '#d4a843' }} />
                </ComposedChart>
            </ResponsiveContainer>
    );

    if (scrollMode) {
        return (
            <div style={{ overflowX: 'auto', overflowY: 'hidden', touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ width: `${innerWidthPx}px` }}>{chart}</div>
            </div>
        );
    }
    return <div style={{ touchAction: 'pan-y' }}>{chart}</div>;
}

function AssistGraph({ nodes, edges }: { nodes: NetworkNode[]; edges: NetworkEdge[] }) {
    const svgRef       = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef   = useRef<HTMLDivElement>(null);
    const simRef       = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
    const [graphW, setGraphW]         = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        try {
            const initialW = containerRef.current.offsetWidth;
            if (initialW > 0) setGraphW(initialW);

            if (typeof ResizeObserver === 'undefined') {
                if (!initialW) setGraphW(600);
                return;
            }
            const obs = new ResizeObserver(entries => {
                const w = entries[0]?.contentRect.width;
                if (w > 0) setGraphW(Math.floor(w));
            });
            obs.observe(containerRef.current);
            return () => obs.disconnect();
        } catch (err) {
            console.error('[AssistGraph ResizeObserver]', err);
            setGraphW(600);
        }
    }, []);

    useEffect(() => {
        if (!svgRef.current || !nodes.length || graphW === 0) return;

        try {
            const W = graphW;
            const isMobile = W < 600;
            const isSmall  = W < 400;
            const H = Math.max(isSmall ? 360 : 380, Math.min(640, W * (isMobile ? 0.95 : 0.64)));

            const svg = d3.select(svgRef.current)
                .attr('width', W)
                .attr('height', H)
                .style('touch-action', 'none');

            svg.selectAll('*').remove();

            const defs = svg.append('defs');
            nodes.forEach(n => {
                const r = nodeR(n as SimNode);
                defs.append('clipPath').attr('id', `adv-clip-${n.id.replace(/\W/g, '_')}`)
                    .append('circle').attr('r', r);
            });

            const simNodes: SimNode[] = nodes.map((n, i) => {
                const angle = (i / nodes.length) * 2 * Math.PI;
                const radius = Math.min(W, H) * 0.35;
                return {
                    ...n,
                    x: W / 2 + radius * Math.cos(angle),
                    y: H / 2 + radius * Math.sin(angle)
                };
            });
            const byId = new Map(simNodes.map(n => [n.id, n]));
            const simLinks: SimLink[] = edges
                .filter(e => byId.has(e.from) && byId.has(e.to) && e.from !== e.to)
                .map(e => ({
                    source: byId.get(e.from)!,
                    target: byId.get(e.to)!,
                    weight: e.weight, fromName: e.fromName, toName: e.toName,
                }));

            const maxW = Math.max(...simLinks.map(l => l.weight), 1);
            const baseCharge   = isMobile ? -320 : -480;
            const baseLinkDist = isMobile ? 120  : 160;

            const simulation = d3.forceSimulation<SimNode>(simNodes)
                .alphaDecay(0.06)
                .velocityDecay(0.6)
                .force('link', d3.forceLink<SimNode, SimLink>(simLinks)
                    .id(d => d.id).distance(baseLinkDist).strength(0.5))
                .force('charge', d3.forceManyBody<SimNode>().strength(baseCharge))
                .force('center', d3.forceCenter(W / 2, H / 2))
                .force('collision', d3.forceCollide<SimNode>().radius(d => nodeR(d) + (isMobile ? 26 : 20)));

            for (let i = 0; i < 60; i++) simulation.tick();

            simRef.current = simulation;

            const g = svg.append('g');

            let zoomTimer: ReturnType<typeof setTimeout> | null = null;

            const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.15, 5])
                .on('zoom', ev => {
                    g.attr('transform', ev.transform);
                    if (isMobile) return;

                    const k = ev.transform.k;
                    if (zoomTimer) clearTimeout(zoomTimer);
                    zoomTimer = setTimeout(() => {
                        (simulation.force('charge') as d3.ForceManyBody<SimNode>)
                            .strength(baseCharge * Math.max(0.5, k));
                        (simulation.force('link') as d3.ForceLink<SimNode, SimLink>)
                            .distance(baseLinkDist * Math.max(1, k * 0.8));
                        simulation.alpha(0.1).restart();
                    }, 400);
                });

            svg.call(zoomBehavior);
            svg.on('click', () => setSelectedId(null));

            const linkVisG = g.append('g');
            const linkHitG = g.append('g');

            const link = linkVisG.selectAll<SVGLineElement, SimLink>('line')
                .data(simLinks).join('line')
                .attr('stroke', 'rgba(212,168,67,0.55)')
                .attr('stroke-opacity', 1)
                .attr('stroke-width', d => 1 + (d.weight / maxW) * 3);

            const tooltip = d3.select(tooltipRef.current!);

            const linkHit = linkHitG.selectAll<SVGLineElement, SimLink>('line')
                .data(simLinks).join('line')
                .attr('stroke', 'transparent')
                .attr('stroke-width', 20)
                .style('cursor', 'default')
                .on('mouseenter', (_ev, d) => {
                    tooltip.style('display', 'block')
                        .html(`<strong>${d.fromName}</strong> → <strong>${d.toName}</strong><br/>${d.weight} asistencia${d.weight > 1 ? 's' : ''}`);
                })
                .on('mousemove', ev => {
                    const rect = svgRef.current!.getBoundingClientRect();
                    tooltip.style('left', `${ev.clientX - rect.left + 14}px`).style('top', `${ev.clientY - rect.top - 52}px`);
                })
                .on('mouseleave', () => tooltip.style('display', 'none'));

            const drag = d3.drag<SVGGElement, SimNode>()
                .on('start', (ev, d) => {
                    if (!ev.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
                .on('end', (ev, d) => {
                    if (!ev.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                });

            const nodeG = g.append('g').selectAll<SVGGElement, SimNode>('g')
                .data(simNodes).join('g')
                .attr('cursor', 'pointer')
                .call(drag);

            nodeG.each(function(d) {
                const el  = d3.select(this);
                const r   = nodeR(d);
                const sid = d.id.replace(/\W/g, '_');

                el.append('circle').attr('class', 'adv-node-ring').attr('r', r + 5)
                    .attr('fill', 'none').attr('stroke', '#d4a843').attr('stroke-width', 3).attr('opacity', 0);

                el.append('circle').attr('r', r)
                    .attr('fill', 'rgba(8,16,34,0.9)')
                    .attr('stroke', '#d4a843').attr('stroke-width', 2);

                if (d.img) {
                    const src = /^https?:/.test(d.img) ? d.img : `https:${d.img}`;
                    el.append('image')
                        .attr('href', src)
                        .attr('xlink:href', src)
                        .attr('x', -r).attr('y', -r)
                        .attr('width', r * 2).attr('height', r * 2)
                        .attr('preserveAspectRatio', 'xMidYMin slice')
                        .attr('clip-path', `url(#adv-clip-${sid})`);
                } else {
                    el.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dy', '0.35em')
                        .attr('font-size', r * 0.65).attr('font-family', 'DM Sans, sans-serif')
                        .attr('fill', 'rgba(200,210,220,0.85)')
                        .text(d.name.split(' ').map((w: string) => w[0]).slice(0, 2).join(''));
                }

                el.append('text')
                    .attr('y', r + 14).attr('text-anchor', 'middle')
                    .attr('font-size', '9px').attr('font-family', 'DM Sans, sans-serif')
                    .attr('fill', 'rgba(200,210,220,0.85)').attr('letter-spacing', '0.3px')
                    .text(d.name);

                el.append('text')
                    .attr('y', r + 26).attr('text-anchor', 'middle')
                    .attr('font-size', '8px').attr('font-family', 'DM Sans, sans-serif')
                    .attr('fill', 'rgba(212,168,67,0.7)')
                    .text(`${d.assists}A · ${d.goals}G`);
            });

            nodeG
                .on('mouseenter', (_ev, d) => {
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

            const draw = () => {
                const pad = 32;
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
            };

            if (isMobile) {
                for (let i = 0; i < 240; i++) simulation.tick();
                simulation.stop();
            }

            simulation.on('tick', draw);
            draw();

            return () => {
                simulation.stop();
                if (zoomTimer) clearTimeout(zoomTimer);
            };
        } catch (err) {
            console.error('[AssistGraph D3 simulation]', err);
        }
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
            <div ref={containerRef} className="adv-graph-wrap" style={{ touchAction: 'none' }}>
                <svg ref={svgRef} style={{ width: '100%', display: 'block', touchAction: 'none' }} />
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.4)" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 0.75rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l7.5-7.5 3 3 4.5-4.5M21 7.5V3h-4.5M21 21H3" />
            </svg>
            <p>{msg}</p>
        </div>
    );
}

function CumXGTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d: MatchPoint = payload[0].payload;
    const fecha = d.fecha
        ? new Date(d.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
    const diff = d.cumGoals - d.cumXg;
    const over = diff >= 0;
    return (
        <div className="adv-tooltip">
            {d.rival && <p className="adv-tooltip-title">{d.rival}</p>}
            {fecha && <p className="adv-tooltip-sub">{fecha} · {d.competicion}</p>}
            <div className="adv-tooltip-divider" />
            <p style={{ color: 'rgba(200,210,220,0.85)', margin: 0 }}>Goles acum.: <strong>{d.cumGoals}</strong></p>
            <p style={{ color: '#d4a843', margin: 0 }}>xG acum.: <strong>{d.cumXg.toFixed(1)}</strong></p>
            <p style={{ color: over ? '#4ade80' : '#f87171', margin: 0, fontSize: '0.72rem' }}>
                {over ? '↑ +' : '↓ '}{diff.toFixed(1)} sobre lo esperado
            </p>
        </div>
    );
}

function CumulativeChart({ data }: { data: MatchPoint[] }) {
    const [dims, setDims] = useState({ h: 300, small: false });
    useEffect(() => {
        const u = () => { const w = window.innerWidth; setDims({ h: w < 480 ? 240 : w < 768 ? 270 : 300, small: w < 480 }); };
        u(); window.addEventListener('resize', u); return () => window.removeEventListener('resize', u);
    }, []);
    const { h, small } = dims;
    const maxLabels = small ? 6 : 12;
    const interval  = data.length > maxLabels ? Math.ceil(data.length / maxLabels) - 1 : 0;
    return (
        <div style={{ touchAction: 'pan-y' }}>
            <ResponsiveContainer width="100%" height={h}>
                <ComposedChart data={data} margin={{ top: 8, right: small ? 6 : 12, left: small ? -24 : -18, bottom: 4 }}>
                    <defs>
                        <linearGradient id="cumGoalsFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="rgba(212,168,67,0.28)" />
                            <stop offset="100%" stopColor="rgba(212,168,67,0)" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,67,0.1)" vertical={false} />
                    <XAxis dataKey="matchNum" interval={interval} minTickGap={small ? 8 : 4}
                        tick={{ fontFamily: 'DM Sans, sans-serif', fontSize: small ? 9 : 10, fill: 'rgba(200,210,220,0.5)' }}
                        tickLine={false} axisLine={false} />
                    <YAxis width={small ? 28 : 34}
                        tick={{ fontFamily: 'DM Sans, sans-serif', fontSize: small ? 9 : 10, fill: 'rgba(200,210,220,0.5)' }}
                        axisLine={false} tickLine={false} />
                    <RTooltip content={<CumXGTooltip />} cursor={{ stroke: 'rgba(212,168,67,0.25)' }} />
                    <Legend wrapperStyle={{ fontFamily: 'DM Sans, sans-serif', fontSize: small ? 10 : 11, paddingTop: 8, color: 'rgba(200,210,220,0.7)' }} />
                    <Area type="monotone" dataKey="cumGoals" name="Goles acumulados"
                        stroke="#d4a843" strokeWidth={2.5} fill="url(#cumGoalsFill)"
                        dot={false} activeDot={{ r: 5, fill: '#d4a843' }} />
                    <Line type="monotone" dataKey="cumXg" name="xG acumulado"
                        stroke="rgba(120,180,255,0.95)" strokeWidth={2.5} strokeDasharray="5 4"
                        dot={false} activeDot={{ r: 5, fill: 'rgba(120,180,255,0.95)' }} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

function FunnelTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as FunnelStage;
    return (
        <div className="adv-tooltip">
            <p className="adv-tooltip-title">{d.stage}</p>
            <div className="adv-tooltip-divider" />
            <p style={{ color: '#d4a843', margin: 0 }}><strong>{d.value}</strong></p>
        </div>
    );
}

function FinishingFunnel({ data, conversion }: { data: FunnelStage[]; conversion: number }) {
    const [dims, setDims] = useState({ h: 300, small: false });
    useEffect(() => {
        const u = () => { const w = window.innerWidth; setDims({ h: w < 480 ? 260 : 310, small: w < 480 }); };
        u(); window.addEventListener('resize', u); return () => window.removeEventListener('resize', u);
    }, []);
    const { h, small } = dims;
    const colors = ['#d4a843', '#bd8a30', '#9a6c1c'];
    const rows = data.map((d, i) => ({ ...d, fill: colors[i] ?? '#9a6c1c' }));
    return (
        <div>
            <ResponsiveContainer width="100%" height={h}>
                <FunnelChart margin={{ top: 12, right: small ? 86 : 108, bottom: 12, left: small ? 62 : 96 }}>
                    <RTooltip content={<FunnelTooltip />} />
                    <Funnel dataKey="value" data={rows} isAnimationActive lastShapeType="rectangle">
                        <LabelList position="right" dataKey="stage" stroke="none" offset={small ? 12 : 16}
                            fill="rgba(200,210,220,0.85)" fontFamily="DM Sans, sans-serif" fontSize={small ? 11 : 12} />
                        <LabelList position="left" dataKey="value" stroke="none" offset={small ? 12 : 16}
                            fill="#d4a843" fontFamily="Cinzel, serif" fontSize={small ? 12 : 13} />
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>
            <p className="adv-funnel-note">Conversión: <strong>{conversion}%</strong> de los tiros acaban en gol</p>
        </div>
    );
}

function AdvancedStatsInner() {
    const [season,      setSeason]      = useState('');
    const [competition, setCompetition] = useState('Partidos oficiales');
    const [xgData,  setXgData]  = useState<XGPayload  | null>(null);
    const [netData, setNetData] = useState<NetPayload  | null>(null);
    const [xgLoading,  setXgLoading]  = useState(true);
    const [netLoading, setNetLoading] = useState(true);
    const [xgError,    setXgError]    = useState(false);
    const [netError,   setNetError]   = useState(false);
    const [teamData,    setTeamData]    = useState<TeamPayload | null>(null);
    const [teamLoading, setTeamLoading] = useState(true);
    const [teamError,   setTeamError]   = useState(false);
    const [pfData,    setPfData]    = useState<PlayerFinishPayload | null>(null);
    const [pfLoading, setPfLoading] = useState(true);
    const [pfError,   setPfError]   = useState(false);
    const [pfPlayer,  setPfPlayer]  = useState('');

    const seasons = useMemo(() => {
        const all = [...(xgData?.seasons ?? []), ...(netData?.seasons ?? []), ...(teamData?.seasons ?? []), ...(pfData?.seasons ?? [])];
        return [...new Set(all)].sort().reverse();
    }, [xgData, netData, teamData, pfData]);

    const competitions = useMemo(() => {
        const all = [...(xgData?.competitions ?? []), ...(netData?.competitions ?? []), ...(teamData?.competitions ?? []), ...(pfData?.competitions ?? [])];
        return [...new Set(all)].sort();
    }, [xgData, netData, teamData, pfData]);

    const availableComps = useMemo(
        () => competitions.length ? ['Partidos oficiales', ...competitions] : [],
        [competitions]
    );

    useEffect(() => {
        let cancelled = false;
        setXgLoading(true); setXgError(false);
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 30000);
        const p = new URLSearchParams();
        if (season) p.set('season', season);
        if (competition) p.set('competition', competition);
        fetch(`/api/xg-timeline?${p}`, { signal: ctrl.signal })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                if (!cancelled) { setXgData(d); setXgLoading(false); }
            })
            .catch(e => {
                if (e?.name === 'AbortError') return;
                console.error('[xg-timeline]', e);
                if (!cancelled) { setXgError(true); setXgLoading(false); }
            })
            .finally(() => clearTimeout(timeout));
        return () => { cancelled = true; ctrl.abort(); clearTimeout(timeout); };
    }, [season, competition]);

    useEffect(() => {
        let cancelled = false;
        setNetLoading(true); setNetError(false);
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 30000);
        const p = new URLSearchParams();
        if (season) p.set('season', season);
        if (competition) p.set('competition', competition);
        fetch(`/api/assist-network?${p}`, { signal: ctrl.signal })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                if (!cancelled) { setNetData(d); setNetLoading(false); }
            })
            .catch(e => {
                if (e?.name === 'AbortError') return;
                console.error('[assist-network]', e);
                if (!cancelled) { setNetError(true); setNetLoading(false); }
            })
            .finally(() => clearTimeout(timeout));
        return () => { cancelled = true; ctrl.abort(); clearTimeout(timeout); };
    }, [season, competition]);

    useEffect(() => {
        let cancelled = false;
        setTeamLoading(true); setTeamError(false);
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 30000);
        const p = new URLSearchParams();
        if (season) p.set('season', season);
        if (competition) p.set('competition', competition);
        fetch(`/api/team-stats?${p}`, { signal: ctrl.signal })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                if (!cancelled) { setTeamData(d); setTeamLoading(false); }
            })
            .catch(e => {
                if (e?.name === 'AbortError') return;
                console.error('[team-stats]', e);
                if (!cancelled) { setTeamError(true); setTeamLoading(false); }
            })
            .finally(() => clearTimeout(timeout));
        return () => { cancelled = true; ctrl.abort(); clearTimeout(timeout); };
    }, [season, competition]);

    useEffect(() => {
        let cancelled = false;
        setPfLoading(true); setPfError(false);
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 30000);
        const p = new URLSearchParams();
        if (season) p.set('season', season);
        if (competition) p.set('competition', competition);
        fetch(`/api/finishing-players?${p}`, { signal: ctrl.signal })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                if (!cancelled) { setPfData(d); setPfLoading(false); }
            })
            .catch(e => {
                if (e?.name === 'AbortError') return;
                console.error('[finishing-players]', e);
                if (!cancelled) { setPfError(true); setPfLoading(false); }
            })
            .finally(() => clearTimeout(timeout));
        return () => { cancelled = true; ctrl.abort(); clearTimeout(timeout); };
    }, [season, competition]);

    useEffect(() => {
        if (pfData?.players?.length && !pfData.players.some(p => p.id === pfPlayer)) {
            setPfPlayer(pfData.players[0].id);
        }
    }, [pfData]);

    const pfSelected = pfData?.players.find(p => p.id === pfPlayer) ?? pfData?.players[0];
    const pfFunnel = pfSelected
        ? [
            { stage: 'Tiros',          value: pfSelected.tiros },
            { stage: 'Tiros a puerta', value: pfSelected.tirosPuerta },
            { stage: 'Goles',          value: pfSelected.goles },
        ]
        : [];
    const pfConversion = pfSelected && pfSelected.tiros
        ? Math.round((pfSelected.goles / pfSelected.tiros) * 1000) / 10
        : 0;

    return (
        <div className="adv-root">
            <div className="adv-filters">
                <CustomSelect label="TEMPORADA"   options={seasons}        value={season}      onChange={setSeason} />
                <CustomSelect label="COMPETICIÓN" options={availableComps} value={competition} onChange={setCompetition} />
            </div>
            <section className="adv-section">
                <div className="adv-section-header">
                    <h2 className="adv-section-title">TRACKER XG</h2>
                    <p className="adv-section-sub">Goles reales (barras) vs xG esperado (línea) · Pasa el ratón sobre las barras para ver el detalle</p>
                </div>
                <div className="adv-card">
                    {xgLoading  ? <Spinner />
                    : xgError || !xgData?.matches?.length
                    ? <Empty msg="Sin datos de xG para este filtro" />
                    : <ChartBoundary name="xg"><XGChart data={xgData.matches} /></ChartBoundary>}
                </div>
            </section>
            <section className="adv-section">
                <div className="adv-section-header">
                    <h2 className="adv-section-title">XG ACUMULADO</h2>
                    <p className="adv-section-sub">Goles acumulados vs xG acumulado · Si la línea dorada va por encima, el equipo marca más de lo esperado</p>
                </div>
                <div className="adv-card">
                    {xgLoading  ? <Spinner />
                    : xgError || !xgData?.matches?.length
                    ? <Empty msg="Sin datos de xG para este filtro" />
                    : <ChartBoundary name="cumxg"><CumulativeChart data={xgData.matches} /></ChartBoundary>}
                </div>
            </section>
            <section className="adv-section">
                <div className="adv-section-header">
                    <h2 className="adv-section-title">EMBUDO DE FINALIZACIÓN</h2>
                    <p className="adv-section-sub">De tiros a goles · Totales del filtro seleccionado</p>
                </div>
                <div className="adv-card">
                    {teamLoading ? <Spinner />
                    : teamError || !teamData?.matchCount
                    ? <Empty msg="Sin datos de equipo para este filtro" />
                    : <ChartBoundary name="funnel"><FinishingFunnel data={teamData.funnel} conversion={teamData.conversion} /></ChartBoundary>}
                </div>
            </section>
            <section className="adv-section">
                <div className="adv-section-header">
                    <h2 className="adv-section-title">EMBUDO POR JUGADORA</h2>
                    <p className="adv-section-sub">De tiros a goles, jugadora a jugadora · Solo se incluyen jugadoras con registro de tiros completo</p>
                </div>
                <div className="adv-card">
                    {pfLoading ? <Spinner />
                    : pfError || !pfData?.players?.length || !pfSelected
                    ? <Empty msg="Sin datos de finalización para este filtro" />
                    : (
                        <>
                            <div className="adv-player-pick">
                                <CustomSelect
                                    label="JUGADORA"
                                    options={pfData.players.map(p => p.name)}
                                    value={pfSelected.name}
                                    onChange={(name) => { const f = pfData.players.find(p => p.name === name); if (f) setPfPlayer(f.id); }}
                                    allOption={null}
                                />
                            </div>
                            <ChartBoundary name="pfunnel"><FinishingFunnel data={pfFunnel} conversion={pfConversion} /></ChartBoundary>
                        </>
                    )}
                </div>
            </section>
            <section className="adv-section">
                <div className="adv-section-header">
                    <h2 className="adv-section-title">RED DE ASISTENCIAS</h2>
                    <p className="adv-section-sub">Arrastra los nodos · Pellizca o usa la rueda para hacer zoom · Toca un nodo para ver sus conexiones</p>
                </div>
                <div className="adv-card adv-card-graph">
                    {netLoading ? <Spinner />
                    : netError || !netData?.nodes?.length
                    ? <Empty msg="Sin datos de asistencias para este filtro" />
                    : <ChartBoundary name="net"><AssistGraph nodes={netData.nodes} edges={netData.edges} /></ChartBoundary>}
                </div>
            </section>
        </div>
    );
}

export default function AdvancedStats() {
    return (
        <TopErrorBoundary>
            <AdvancedStatsInner />
        </TopErrorBoundary>
    );
}
