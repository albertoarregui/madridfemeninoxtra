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
            <div className="bg-[#151e42] border border-gray-700 p-3 rounded-lg shadow-xl outline-none">
                <p className="font-bold text-[#ffde59] text-sm mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        {entry.name}: <span className="font-mono font-bold text-[#ffde59]">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ChartSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 group hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-2">
            <div className="bg-gray-100 p-2 rounded-lg text-[#151e42] group-hover:bg-[#ffde59]/20 transition-colors">
                <Icon size={18} />
            </div>
            <h3 className="text-[#151e42] font-black uppercase tracking-wider text-xs">{title}</h3>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 mt-6">
            {/* Chart 1: Partidos */}
            <ChartSection title="Partidos Jugados" icon={Activity}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="season" stroke="#9ca3af" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffde59', opacity: 0.1 }} />
                        <Bar dataKey="partidos" name="Partidos" fill="#151e42" radius={[4, 4, 0, 0]} barSize={40}>
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} className="hover:fill-[#ffde59] transition-colors cursor-pointer" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartSection>

            {/* Chart 2: Minutos */}
            <ChartSection title="Minutos por Temporada" icon={Clock}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="season" stroke="#9ca3af" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 10, fontWeight: 700 }} />
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
                title={isGoalkeeper ? "Porterías a Cero" : "Goles + Asistencias"}
                icon={isGoalkeeper ? Shield : Target}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="season" stroke="#9ca3af" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffde59', opacity: 0.1 }} />
                        {isGoalkeeper ? (
                            <Bar dataKey="p0" name="Porterías a 0" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        ) : (
                            <>
                                <Bar dataKey="goles" stackId="a" name="Goles" fill="#151e42" barSize={40} />
                                <Bar dataKey="asistencias" stackId="a" name="Asistencias" fill="#ffde59" radius={[4, 4, 0, 0]} barSize={40} />
                            </>
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </ChartSection>
        </div>
    );
};

export default PlayerEvolutionCharts;
