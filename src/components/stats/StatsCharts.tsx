
import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Legend,
    LineChart,
    Line,
    Cell,
    Rectangle,
    ReferenceLine
} from 'recharts';
import { TrendingUp, Activity, Shield, Users, Target, Swords } from 'lucide-react';
import { getPlayerImage, getImageSlug } from '../../utils/player-images';

interface StatsChartsProps {
    data: any[];
    matchLogs: any[];
    season: string;
    playerImageMap: Record<string, string>;
}

const CustomTooltip = ({ active, payload, label, playerImageMap }: any) => {
    if (active && payload && payload.length && payload[0]?.payload) {
        const dataPoint = payload[0].payload;
        const name = dataPoint.fullName || dataPoint.name || label;

        let img = null;
        if (name && playerImageMap) {
            const slug = getImageSlug(name);
            img = getPlayerImage(slug, playerImageMap);
        }

        return (
            <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-xl outline-none z-50">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                    {img && <img src={img} className="w-8 h-8 rounded-full object-cover object-top border border-gray-100 bg-white" alt={name} />}
                    <p className="font-bold text-[#151e42] text-sm">{name}</p>
                </div>
                {payload.map((entry: any, index: number) => {
                    let displayValue = typeof entry.value === 'number' ? (Number.isInteger(entry.value) ? entry.value : entry.value.toFixed(2)) : entry.value;

                    if (entry.dataKey && typeof entry.dataKey === 'string' && entry.dataKey.endsWith('_p90')) {
                        const pctKey = entry.dataKey.replace('_p90', '_pct');
                        const pctValue = dataPoint[pctKey];
                        if (pctValue !== undefined) {
                            displayValue = `${displayValue} (${pctValue}%)`;
                        }
                    }

                    if (entry.dataKey && typeof entry.dataKey === 'string' && entry.dataKey.endsWith('_dist')) {
                        const accKey = entry.dataKey.replace('_dist', '_acc');
                        const accValue = dataPoint[accKey];
                        if (accValue !== undefined) {
                            displayValue = `${displayValue}% (${accValue}% acierto)`;
                        } else {
                            displayValue = `${displayValue}%`;
                        }
                    }

                    return (
                        <p key={index} className="text-xs text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            {entry.name}: <span className="font-mono font-bold">{displayValue}</span>
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};

const CustomYAxisTick = (props: any) => {
    const { x, y, payload, playerImageMap } = props;
    if (!payload || !payload.value) return null;

    const fullName = payload.value;
    const slug = getImageSlug(fullName);
    const img = getPlayerImage(slug, playerImageMap);
    const displayName = fullName;

    return (
        <g transform={`translate(${x},${y})`}>
            {/* Text on Left */}
            <text x={img ? -35 : -10} y={4} dy={0} textAnchor="end" fill="#151e42" fontSize={11} fontWeight={600}>
                {displayName}
            </text>
            {/* Image on Right of Text */}
            {img && (
                <foreignObject x={-30} y={-10} width={24} height={24}>
                    <img src={img} className="w-full h-full rounded-full object-cover object-top bg-white border border-gray-100" alt="" />
                </foreignObject>
            )}
        </g>
    );
};

const CustomScatterShape = (props: any) => {
    const { cx, cy, payload, playerImageMap } = props;
    if (!payload || !payload.name) return null;
    const name = payload.name;
    const slug = getImageSlug(name);
    const img = getPlayerImage(slug, playerImageMap);

    return (
        <g>
            {/* Background Circle - White if image exists to show transparency correctly, else Yellow */}
            <circle cx={cx} cy={cy} r={20} fill={img ? "white" : "#ffde59"} stroke="#e5e7eb" strokeWidth={1} />

            {img ? (
                <foreignObject x={cx - 19} y={cy - 19} width={38} height={38} style={{ pointerEvents: 'none' }}>
                    {/* Added 'bg-white' and 'object-top' and increased size slightly to fit circle */}
                    <img src={img} className="w-full h-full rounded-full object-cover object-top" alt={name} />
                </foreignObject>
            ) : (
                // Fallback Initials
                <text x={cx} y={cy} dy={4} textAnchor="middle" fontSize={10} fill="#151e42" fontWeight="bold">
                    {name.substring(0, 2).toUpperCase()}
                </text>
            )}
        </g>
    );
};


const ChartSectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
        <div className="bg-[#ffde59]/20 p-2 rounded-lg text-[#151e42]">
            <Icon size={20} />
        </div>
        <h3 className="text-[#151e42] font-black uppercase tracking-wider text-sm hover:text-[#ffde59] transition-colors cursor-pointer">{title}</h3>
    </div>
);

export const StatsCharts: React.FC<StatsChartsProps> = ({ data, matchLogs, season, playerImageMap = {} }) => {

    const scatterGoalsXG = useMemo(() => {
        return data
            .filter(p => (p.goals > 0 || p.xg > 0) && p.minutes > 300)
            .map(p => ({
                name: p.player,
                goals: p.goals,
                xg: p.xg,
                diff: p.goals - p.xg
            }));
    }, [data]);

    const barGA = useMemo(() => {
        return data
            .map(p => ({
                name: p.player,
                fullName: p.player,
                ga: p.goals_assists || (p.goals + p.assists),
                g: p.goals,
                a: p.assists
            }))
            .sort((a, b) => b.ga - a.ga)
            .slice(0, 10);
    }, [data]);

    const barProg = useMemo(() => {
        return data
            .map(p => ({
                name: p.player,
                fullName: p.player,
                prog: (p.progressive_carries || 0) + (p.progressive_passes || 0),
                carries: p.progressive_carries || 0,
                passes: p.progressive_passes || 0
            }))
            .sort((a, b) => b.carries - a.carries)
            .slice(0, 10);
    }, [data]);

    const trendXG = useMemo(() => {
        return [...matchLogs]
            .filter(m => m.date && (m.xg_for !== undefined || m.xg_for !== ''))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(m => ({
                date: m.date,
                opponent: m.opponent,
                xg_for: Number(m.xg_for) || 0,
                xg_against: Number(m.xg_against) || 0
            }));
    }, [matchLogs]);

    const trendPoss = useMemo(() => {
        return [...matchLogs]
            .filter(m => m.date && m.possession)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(m => ({
                date: m.date,
                opponent: m.opponent,
                possession: Number(m.possession) || 50
            }));
    }, [matchLogs]);

    const barGK = useMemo(() => {
        return data
            .filter(p => p.position && p.position.includes('GK') && p.minutes > 90)
            .map(p => ({
                name: p.player,
                psxg_net: (Number(p.psxg) || 0) - (Number(p.goals_against_gk) || 0),
                saved: Number(p.saves) || 0
            }));
    }, [data]);

    const barMinutes = useMemo(() => {
        return data
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, 15)
            .map(p => ({
                name: p.player,
                minutes: p.minutes
            }));
    }, [data]);

    const ageDist = useMemo(() => {
        const buckets = { '<20': 0, '20-23': 0, '24-27': 0, '28-31': 0, '32+': 0 };
        data.forEach(p => {
            if (!p.age) return;
            const ageVal = String(p.age);
            const age = parseInt(ageVal.split('-')[0]);
            if (isNaN(age)) return;

            if (age < 20) buckets['<20']++;
            else if (age <= 23) buckets['20-23']++;
            else if (age <= 27) buckets['24-27']++;
            else if (age <= 31) buckets['28-31']++;
            else buckets['32+']++;
        });
        return Object.entries(buckets).map(([range, count]) => ({ name: range, count }));
    }, [data]);

    const scatterCreative = useMemo(() => {
        return data
            .filter(p => (p.assists > 0 || p.xg_assist > 0) && p.minutes > 300)
            .map(p => ({
                name: p.player,
                assists: p.assists,
                xa: p.xg_assist,
                diff: p.assists - p.xg_assist
            }));
    }, [data]);

    const barSCA = useMemo(() => {
        return data
            .map(p => ({
                name: p.player,
                sca: Number(p.sca) || 0
            }))
            .sort((a, b) => b.sca - a.sca)
            .slice(0, 10);
    }, [data]);


    if (!data || data.length === 0) return null;

    return (
        <div className="flex flex-col gap-8 mb-12">

            {/* 1. ANÁLISIS OFENSIVO */}
            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
                <ChartSectionHeader title="Rendimiento Ofensivo" icon={Target} />

                {/* Changed to 1 col or 2 cols for visibility */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Scatter: Goles vs xG - FULL WIDTH */}
                    <div className="h-[400px] w-full lg:col-span-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Eficiencia (Goles vs xG)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 30, right: 20, bottom: 20, left: 10 }}> {/* Increased top margin */}
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis type="number" dataKey="xg" name="xG" unit="" stroke="#9ca3af" tick={{ fontSize: 10 }} label={{ value: 'xG', position: 'bottom', offset: 0, fontSize: 10, fill: '#9ca3af' }} />
                                <YAxis type="number" dataKey="goals" name="Goles" unit="" stroke="#9ca3af" tick={{ fontSize: 10 }} label={{ value: 'Goles', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Scatter name="Jugadoras" data={scatterGoalsXG} shape={<CustomScatterShape playerImageMap={playerImageMap} />}>
                                    {/* Shape handles image */}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar: G+A */}
                    <div className="h-[500px] w-full"> {/* Increased Height for bars */}
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Producción (Goles + Asist.)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barGA} layout="vertical" margin={{ top: 20, right: 20, left: 10, bottom: 20 }}> {/* Increased bottom margin */}
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 10 }} hide />
                                {/* Custom Tick with Image */}
                                <YAxis dataKey="name" type="category" width={120} tick={<CustomYAxisTick playerImageMap={playerImageMap} />} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Bar dataKey="g" stackId="a" fill="#151e42" name="Goles" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="a" stackId="a" fill="#ffde59" name="Asistencias" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-[500px] w-full">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Progresión</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barProg} layout="vertical" margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 10 }} hide />
                                <YAxis dataKey="name" type="category" width={120} tick={<CustomYAxisTick playerImageMap={playerImageMap} />} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Bar dataKey="carries" stackId="a" fill="#3b82f6" name="Conducciones" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>
            </div>

            {trendXG.length > 2 && (
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
                    <ChartSectionHeader title="Evolución del Equipo" icon={TrendingUp} />

                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8"> {/* Full width for trends for clarity */}
                        {/* Line: xG Trends */}
                        <div className="h-[300px] w-full">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Dominio (xG)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendXG} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="opponent" stroke="#9ca3af" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} interval={0} />
                                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="xg_for" name="xG Favor" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="xg_against" name="xG Contra" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mt-6">
                        <div className="h-[300px] w-full">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Posesión (%)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendPoss} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="opponent" stroke="#9ca3af" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} interval={0} />
                                    <YAxis domain={[0, 100]} stroke="#9ca3af" tick={{ fontSize: 10 }} />
                                    <ReferenceLine y={50} stroke="#d1d5db" strokeDasharray="3 3" />
                                    <Tooltip content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                    <Line type="monotone" dataKey="possession" name="Posesión" stroke="#151e42" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
                    <ChartSectionHeader title="Uso de Plantilla" icon={Users} />
                    <div className="grid grid-cols-1 gap-8"> {/* 1 col for better fit */}
                        <div className="h-[400px]">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Minutos (Top 10)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barMinutes.slice(0, 10)} layout="vertical" margin={{ top: 20, right: 0, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <YAxis dataKey="name" type="category" width={120} tick={<CustomYAxisTick playerImageMap={playerImageMap} />} />
                                    <XAxis type="number" hide />
                                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                    <Bar dataKey="minutes" name="Minutos" fill="#151e42" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
                    <ChartSectionHeader title="Edad" icon={Users} />
                    <div className="h-[400px]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Distribución por Edad</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageDist} margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                                <YAxis hide />
                                <Tooltip cursor={false} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Bar dataKey="count" name="Jugadoras" fill="#ffde59" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>


            </div>

            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
                <ChartSectionHeader title="Creación" icon={Activity} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="h-[400px] w-full lg:col-span-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Asist. vs xA</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 30, right: 20, bottom: 20, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="xa" name="xA" tick={{ fontSize: 9 }} label={{ value: 'xA', position: 'bottom', offset: 0, fontSize: 10, fill: '#9ca3af' }} />
                                <YAxis type="number" dataKey="assists" name="Asist" tick={{ fontSize: 9 }} label={{ value: 'Asist', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Scatter name="Jugadoras" data={scatterCreative} shape={<CustomScatterShape playerImageMap={playerImageMap} />}>
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="h-[500px] w-full lg:col-span-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">SCA (Tiros Generados)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barSCA} layout="vertical" margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <YAxis dataKey="name" type="category" width={120} tick={<CustomYAxisTick playerImageMap={playerImageMap} />} />
                                <XAxis type="number" hide />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Bar dataKey="sca" name="SCA" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
                <ChartSectionHeader title="Pase" icon={Swords} />

                <div className="grid grid-cols-1 gap-12">

                    <div className="h-[400px] w-full">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider hover:text-[#ffde59] transition-colors cursor-pointer">El Metrónomo (Volumen vs Seguridad)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" dataKey="passes" name="Pases Totales" unit="" tick={{ fontSize: 10 }} stroke="#9ca3af" label={{ value: 'Pases Totales', position: 'bottom', offset: 0, fontSize: 10 }} />
                                <YAxis type="number" dataKey="passes_pct" name="% Completado" unit="%" tick={{ fontSize: 10 }} stroke="#9ca3af" domain={[50, 100]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Scatter name="El Metrónomo" data={data.map(p => ({
                                    ...p,
                                    passes: p.passes || 0,
                                    passes_pct: p.passes_pct || 0,
                                    name: p.player
                                })).filter(p => p.minutes > 300 && p.passes > 100)} fill="#8b5cf6" shape={<CustomScatterShape playerImageMap={playerImageMap} />} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-[800px] md:h-[800px] w-full">
                        {(() => {
                            const passStyleData = data
                                .filter(p => p.minutes > 100 && p.player)
                                .map(p => {
                                    const ps_completed = p.passes_completed_short || 0;
                                    const pm_completed = p.passes_completed_medium || 0;
                                    const pl_completed = p.passes_completed_long || 0;

                                    const ps_att = p.passes_short || 0;
                                    const pm_att = p.passes_medium || 0;
                                    const pl_att = p.passes_long || 0;

                                    const total_passes = ps_att + pm_att + pl_att;

                                    let short_dist = 0;
                                    let medium_dist = 0;
                                    let long_dist = 0;

                                    if (total_passes > 0) {
                                        const short_raw = (ps_att / total_passes) * 100;
                                        const medium_raw = (pm_att / total_passes) * 100;
                                        const long_raw = (pl_att / total_passes) * 100;

                                        short_dist = Math.round(short_raw);
                                        medium_dist = Math.round(medium_raw);
                                        long_dist = Math.round(long_raw);

                                        const sum = short_dist + medium_dist + long_dist;
                                        if (sum !== 100) {
                                            const diffs = [
                                                { type: 'short', diff: short_raw - short_dist },
                                                { type: 'medium', diff: medium_raw - medium_dist },
                                                { type: 'long', diff: long_raw - long_dist }
                                            ];
                                            diffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

                                            if (diffs[0].type === 'short') short_dist += (100 - sum);
                                            else if (diffs[0].type === 'medium') medium_dist += (100 - sum);
                                            else long_dist += (100 - sum);
                                        }
                                    }

                                    const short_acc = ps_att > 0 ? Math.round((ps_completed / ps_att) * 100) : 0;
                                    const medium_acc = pm_att > 0 ? Math.round((pm_completed / pm_att) * 100) : 0;
                                    const long_acc = pl_att > 0 ? Math.round((pl_completed / pl_att) * 100) : 0;

                                    return {
                                        ...p,
                                        name: p.player,
                                        short_dist,
                                        medium_dist,
                                        long_dist,
                                        short_acc,
                                        medium_acc,
                                        long_acc,
                                        total_passes
                                    };
                                })
                                .sort((a, b) => b.total_passes - a.total_passes)
                                .slice(0, 15);


                            return (
                                <>
                                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider hover:text-[#ffde59] transition-colors cursor-pointer">Estilo de Pase ({passStyleData.length === 0 ? 'Cargando datos...' : 'Distribución de tipos de pase'})</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={passStyleData}
                                            layout="vertical"
                                            margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                            <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={(value) => `${value}%`} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                                            <YAxis dataKey="name" type="category" width={120} tick={<CustomYAxisTick playerImageMap={playerImageMap} />} />
                                            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                            <Bar dataKey="short_dist" stackId="a" fill="#10b981" name="Cortos" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="medium_dist" stackId="a" fill="#f59e0b" name="Medios" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="long_dist" stackId="a" fill="#ef4444" name="Largos" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </>
                            );
                        })()}
                    </div>

                    <div className="h-[400px] w-full">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider hover:text-[#ffde59] transition-colors cursor-pointer">Amenaza Creativa (Calidad vs Cantidad)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" dataKey="assisted_shots" name="Pases Clave (KP)" unit="" tick={{ fontSize: 10 }} stroke="#9ca3af" label={{ value: 'Pases Clave', position: 'bottom', offset: 0, fontSize: 10 }} />
                                <YAxis type="number" dataKey="xg_assist" name="xAG (Exp. Assists)" unit="" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Scatter name="Amenaza Creativa" data={data.map(p => ({
                                    ...p,
                                    assisted_shots: p.assisted_shots || 0,
                                    xg_assist: p.xg_assist || 0,
                                    name: p.player
                                })).filter(p => p.assisted_shots > 0)} fill="#ec4899" shape={<CustomScatterShape playerImageMap={playerImageMap} />} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-[400px] w-full">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider hover:text-[#ffde59] transition-colors cursor-pointer">Rompiendo Líneas (1/3 vs Área)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" dataKey="passes_into_final_third" name="Pases a 1/3" unit="" tick={{ fontSize: 10 }} stroke="#9ca3af" label={{ value: 'Pases a 1/3', position: 'bottom', offset: 0, fontSize: 10 }} />
                                <YAxis type="number" dataKey="passes_into_penalty_area" name="Pases al Área (PPA)" unit="" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip playerImageMap={playerImageMap} />} />
                                <Scatter name="Progresión" data={data.map(p => ({
                                    ...p,
                                    passes_into_final_third: p.passes_into_final_third || 0,
                                    passes_into_penalty_area: p.passes_into_penalty_area || 0,
                                    z: p.progressive_passes || 5,
                                    name: p.player
                                })).filter(p => p.passes_into_final_third > 0)} fill="#06b6d4" shape={<CustomScatterShape playerImageMap={playerImageMap} />} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                </div>
            </div>

        </div>
    );
};
