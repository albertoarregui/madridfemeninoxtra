import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line,
    Cell
} from 'recharts';
import { Activity, Clock, Target, Shield } from 'lucide-react';

interface SeasonData {
    temporada: string;
    total: {
        partidos: number;
        minutos: number;
        goles: number;
        asistencias: number;
        goles_asistencias: number;
        porterias_cero: number;
    };
}

interface PlayerEvolutionChartsProps {
    stats: SeasonData[];
    isGoalkeeper: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-xl outline-none min-w-[140px]">
                <p className="font-black text-[#151e42] text-xs mb-2 border-b border-gray-50 pb-1 uppercase tracking-wider">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 mb-0.5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{entry.name}</span>
                        </div>
                        <span className="font-black text-sm text-[#151e42]">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ChartSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group hover:shadow-md transition-all flex flex-col">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#151e42] font-black uppercase tracking-widest text-[10px] group-hover:text-[#ffde59] transition-colors">{title}</h3>
            <div className="bg-gray-50 p-2 rounded-lg text-gray-400 group-hover:text-[#ffde59] transition-colors">
                <Icon size={16} />
            </div>
        </div>
        <div className="h-64 w-full">
            {children}
        </div>
    </div>
);

const PlayerEvolutionCharts: React.FC<PlayerEvolutionChartsProps> = ({ stats, isGoalkeeper }) => {
    // We reverse stats because the database returns latest first, but charts look better oldest to latest
    const chartData = useMemo(() => {
        return [...stats].reverse().map(s => ({
            season: s.temporada,
            partidos: s.total.partidos,
            minutos: s.total.minutos,
            goles: s.total.goles,
            asistencias: s.total.asistencias,
            ga: s.total.goles_asistencias,
            p0: s.total.porterias_cero
        }));
    }, [stats]);

    if (!chartData || chartData.length === 0) return null;

    return (
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-2">
            {/* Chart 1: Partidos */}
            <ChartSection title="Evolución Partidos" icon={Activity}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="season"
                            stroke="#9ca3af"
                            tick={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tick={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffde59', opacity: 0.1 }} />
                        <Bar dataKey="partidos" name="Partidos" fill="#151e42" radius={[2, 2, 0, 0]} barSize={32}>
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} className="hover:fill-[#ffde59] transition-colors cursor-pointer" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartSection>

            {/* Chart 2: Minutos */}
            <ChartSection title="Evolución Minutos" icon={Clock}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="season"
                            stroke="#9ca3af"
                            tick={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tick={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="minutos"
                            name="Minutos"
                            stroke="#151e42"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#151e42', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, fill: '#ffde59', stroke: '#151e42' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartSection>

            {/* Chart 3: Goles/Asistencias or P0 */}
            <ChartSection
                title={isGoalkeeper ? "Evolución Porterías 0" : "Evolución G+A"}
                icon={isGoalkeeper ? Shield : Target}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="season"
                            stroke="#9ca3af"
                            tick={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tick={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffde59', opacity: 0.1 }} />
                        {isGoalkeeper ? (
                            <Bar dataKey="p0" name="Porterías 0" fill="#10b981" radius={[2, 2, 0, 0]} barSize={32}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} className="hover:fill-[#ffde59] transition-colors cursor-pointer" />
                                ))}
                            </Bar>
                        ) : (
                            <>
                                <Bar dataKey="goles" stackId="a" name="Goles" fill="#151e42" barSize={32} />
                                <Bar dataKey="asistencias" stackId="a" name="Asistencias" fill="#ffde59" radius={[2, 2, 0, 0]} barSize={32} />
                            </>
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </ChartSection>
        </div>
    );
};

export default PlayerEvolutionCharts;
