import React, { useMemo, useState } from 'react';
import { Trophy, Calendar, Target, Activity, Monitor, ArrowUpRight, ArrowDownRight, Minus, Hash, Clock, Shield, TrendingUp } from 'lucide-react';

interface Match {
    temporada_nombre: string;
    competicion_nombre: string;
    goles_rm: number | string | null;
    goles_rival: number | string | null;
    penaltis?: number | string;
    resultado?: 'V' | 'E' | 'D';
    [key: string]: any;
}

interface Goal {
    id_gol: number;
    minuto: number | string; // Can be string like "45+2"
    temporada: string;
    competicion: string;
}

interface ClubStatsDashboardProps {
    matches: Match[];
    goals: Goal[];
    seasons: string[];
    competitions: string[];
}

const ClubStatsDashboard: React.FC<ClubStatsDashboardProps> = ({ matches, goals, seasons, competitions }) => {
    const [selectedSeason, setSelectedSeason] = useState<string>('all');
    const [selectedCompetition, setSelectedCompetition] = useState<string>('all');

    // --- Filter Data ---
    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            const seasonMatch = selectedSeason === 'all' || m.temporada_nombre === selectedSeason;

            let compMatch = true;
            if (selectedCompetition === 'Partidos Oficiales') {
                compMatch = ['Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España'].includes(m.competicion_nombre);
            } else if (selectedCompetition !== 'all') {
                compMatch = m.competicion_nombre === selectedCompetition;
            }

            return seasonMatch && compMatch;
        });
    }, [matches, selectedSeason, selectedCompetition]);

    const filteredGoals = useMemo(() => {
        return goals.filter(g => {
            const seasonMatch = selectedSeason === 'all' || g.temporada === selectedSeason;

            let compMatch = true;
            if (selectedCompetition === 'Partidos Oficiales') {
                compMatch = ['Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España'].includes(g.competicion);
            } else if (selectedCompetition !== 'all') {
                compMatch = g.competicion === selectedCompetition;
            }

            return seasonMatch && compMatch;
        });
    }, [goals, selectedSeason, selectedCompetition]);


    // --- Calculate Stats ---
    const stats = useMemo(() => {
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let gf = 0;
        let ga = 0;
        let cleanSheets = 0;
        let played = 0;

        const scoreFrequencies: Record<string, number> = {};

        filteredMatches.forEach(m => {
            // Check valid scores
            if (m.goles_rm === null || m.goles_rm === undefined || m.goles_rival === null || m.goles_rival === undefined) return;

            played++;
            const gRM = Number(m.goles_rm);
            const gRiv = Number(m.goles_rival);

            gf += gRM;
            ga += gRiv;

            if (gRiv === 0) cleanSheets++;

            // Result logic
            if (gRM > gRiv) wins++;
            else if (gRM < gRiv) losses++;
            else {
                // Penalties check for knockouts? Usually standard stats count 90/120min result.
                // If the user considers penalty shootout win as 'Victory', we'd check m.penaltis/m.resultado.
                // Standard convention: Draw is a Draw even if decided by pens.
                draws++;

                // OPTIONAL: If we want to strictly follow the pre-calculated field logic:
                // if (m.resultado === 'V') wins++;
                // else if (m.resultado === 'D') losses++;
                // else draws++;
                // But let's stick to score-based for pure stats unless user complains.
            }

            const scoreKey = `${gRM}-${gRiv}`;
            scoreFrequencies[scoreKey] = (scoreFrequencies[scoreKey] || 0) + 1;
        });

        const points = (wins * 3) + draws;
        const ppg = played > 0 ? (points / played).toFixed(2) : '0.00';
        const gf90 = played > 0 ? (gf / played).toFixed(2) : '0.00';
        const ga90 = played > 0 ? (ga / played).toFixed(2) : '0.00';
        const gd = gf - ga;
        const gdSign = gd > 0 ? '+' : '';

        // Top 5 Scores
        const topScores = Object.entries(scoreFrequencies)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([score, count]) => ({ score, count }));

        return {
            played,
            wins,
            draws,
            losses,
            gf,
            ga,
            gd: `${gdSign}${gd}`,
            cleanSheets,
            points,
            ppg,
            gf90,
            ga90,
            topScores
        };
    }, [filteredMatches]);

    // --- Goal Timing ---
    const goalTiming = useMemo(() => {
        // Definitions for buckets
        // 1H: 0-5, 6-10 ... 41-45, 45+ (10 buckets)
        // 2H: 46-50 ... 86-90, 90+ (10 buckets)
        // ET: 91-95 ... 116-120, 120+ (6+1 = 7 buckets) -> only show if needed or always?
        // Let's create a dynamic list or fixed if typical. 
        // User asked to "Include extra time goals".

        const buckets: Record<string, { label: string, count: number, order: number }> = {};

        // Initialize 1H (0-45)
        for (let i = 0; i < 45; i += 5) {
            const start = i + 1;
            const end = i + 5;
            const key = `${start}-${end}`;
            buckets[key] = { label: `${start}-${end}'`, count: 0, order: i };
        }
        buckets['45+'] = { label: '45+', count: 0, order: 45 }; // 45+ stoppage

        // Initialize 2H (46-90)
        for (let i = 45; i < 90; i += 5) {
            const start = i + 1;
            const end = i + 5;
            const key = `${start}-${end}`;
            buckets[key] = { label: `${start}-${end}'`, count: 0, order: i + 1 };
        }
        buckets['90+'] = { label: '90+', count: 0, order: 91 };

        // Initialize ET (91-120) - We can add these dynamically or always.
        // Let's add them always to consistent chart, or maybe only if data exists to save space?
        // "Include also extra time goals" -> likely implies visibility.
        for (let i = 90; i < 120; i += 5) {
            const start = i + 1;
            const end = i + 5;
            const key = `${start}-${end}`;
            buckets[key] = { label: `${start}-${end}'`, count: 0, order: i + 2 };
        }
        buckets['120+'] = { label: '120+', count: 0, order: 122 };


        filteredGoals.forEach(g => {
            const minStr = String(g.minuto);

            // Handle Stoppage Times specifically
            if (minStr.includes('+')) {
                const [base] = minStr.split('+');
                const baseNum = Number(base);

                if (baseNum === 45) {
                    buckets['45+'].count++;
                    return;
                }
                if (baseNum === 90) {
                    buckets['90+'].count++;
                    return;
                }
                if (baseNum === 105) {
                    // 105+ (ET HT) - Usually rare, group with 101-105 or just 105+?
                    // Let's put in 101-105 for now or check map? 
                    // Actually better to have a bucket? 
                    // Logic: map to bucket range.
                    // If it's 105+X, it's effectively end of first half ET. 
                    // Let's add it to 101-105 or create 105+? 
                    // Simpler: treat as minute 105 for the bracket (101-105) or logic.
                    // But user asked for "descuento del descanso" (45+). 
                    // Let's handle 120+ specifically.
                }
                if (baseNum >= 120) {
                    buckets['120+'].count++;
                    return;
                }

                // Fallback for other + (e.g. 105+), treat as the base minute for the bucket
                // e.g. 105+2 -> 105 -> 101-105 bucket? Or should we have 105+?
                // Let's map 45+ and 90+ explicitly requested. 
                // Others: map to their base interval.
                const val = baseNum;
                // Find bucket
                if (val > 0) {
                    // Logic to find generic bucket
                    // 1-5, 6-10..
                    // Math.ceil(val / 5) * 5
                    const upper = Math.ceil(val / 5) * 5;
                    const lower = upper - 4;
                    const key = `${lower}-${upper}`;
                    if (buckets[key]) buckets[key].count++;
                }
                return;
            }

            // Normal minutes
            const val = Number(minStr);
            if (isNaN(val)) return;

            // Cap at 45 if it's exactly 45? (41-45 includes 45)
            // Cap at 90 if it's exactly 90? (86-90 includes 90)

            if (val > 120) {
                buckets['120+'].count++;
            } else {
                const upper = Math.ceil(val / 5) * 5;
                const lower = upper - 4;
                const key = `${lower}-${upper}`;
                if (buckets[key]) buckets[key].count++;
                else {
                    // Should exist, unless Logic error or 0
                    if (val === 0) { /* Ignore 0? or put in 1-5 */ }
                }
            }
        });

        // Convert to array and filter out ET if empty? 
        // User asked to include them, implies if they exist or always?
        // Let's Keep all to show the full distribution structure, usually looks better.
        // But 25+ bars is a lot. Mobile scroll?

        let result = Object.values(buckets).sort((a, b) => a.order - b.order);

        // Filter out empty ET buckets if NO ET goals at all?
        // Check if any goals > 90 (excluding 90+)
        const hasET = filteredGoals.some(g => {
            const m = String(g.minuto);
            if (m.includes('+')) {
                const part = m.split('+')[0];
                const b = Number(part);
                // 90+ is stoppage (not ET), 45+ is stoppage
                // 105+, 120+ are ET
                return b > 90;
            }
            return Number(m) > 90;
        });

        if (!hasET) {
            // Remove buckets with order > 91 (90+ is 91)
            result = result.filter(b => b.order <= 91);
        }

        const maxVal = Math.max(...result.map(b => b.count), 1);

        return result.map(b => ({
            ...b,
            percent: (b.count > 0 ? (b.count / stats.played) * 100 : 0), // Percent of MATCHES or GOALS? 
            // Usually "Distribution" means % of Total Goals.
            // But usually bar charts normalize to max value for height.
            // Let's use maxVal for height, and calculate % of total goals for tooltip.
            heightPercent: (b.count / maxVal) * 100,
            sharePercent: (stats.gf > 0 ? (b.count / stats.gf) * 100 : 0).toFixed(1)
        }));
    }, [filteredGoals, stats.gf, stats.played]);


    if (!stats.played) return null; // Or empty state

    return (
        <div className="w-full max-w-7xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold font-bebas text-[#151e42] border-l-4 border-[#ffde59] pl-3 uppercase self-start md:self-auto">
                    Estadísticas del Club
                </h2>

                <div className="flex flex-wrap gap-4 justify-center w-full md:w-auto">
                    <div className="relative">
                        <select
                            className="appearance-none bg-white text-[#2b2b2b] border-2 border-[#ffde59] rounded-full py-3 pl-6 pr-12 text-[0.95rem] font-semibold min-w-[220px] shadow-[0_2px_8px_rgba(255,222,89,0.2)] focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 hover:bg-[#fffef8] hover:border-[#ffd700] transition-all cursor-pointer"
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                        >
                            <option value="all">Todas las Temporadas</option>
                            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M6 9l6 6l6 -6" />
                            </svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none bg-white text-[#2b2b2b] border-2 border-[#ffde59] rounded-full py-3 pl-6 pr-12 text-[0.95rem] font-semibold min-w-[220px] shadow-[0_2px_8px_rgba(255,222,89,0.2)] focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 hover:bg-[#fffef8] hover:border-[#ffd700] transition-all cursor-pointer"
                            value={selectedCompetition}
                            onChange={(e) => setSelectedCompetition(e.target.value)}
                        >
                            <option value="all">Todas las Competiciones</option>
                            <option value="Partidos Oficiales">Partidos Oficiales</option>
                            {['Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España', 'Amistosos'].map(c =>
                                competitions.includes(c) && <option key={c} value={c}>{c}</option>
                            )}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M6 9l6 6l6 -6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                {/* MATCHES PLAYED */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-default">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Partidos</p>
                        <p className="text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.played}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-full text-gray-600 group-hover:bg-[#ffde59]/10 group-hover:text-[#ffde59] transition-colors">
                        <Monitor size={24} />
                    </div>
                </div>

                {/* POINTS */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-default">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Puntos</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.points}</p>
                            <span className="text-sm text-gray-400 font-mono group-hover:text-[#ffde59]/80 transition-colors">({stats.ppg}/partido)</span>
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-full text-yellow-600 group-hover:bg-[#ffde59]/10 group-hover:text-[#ffde59] transition-colors">
                        <Trophy size={24} />
                    </div>
                </div>

                {/* GOALS */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-default">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Goles a Favor</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.gf}</p>
                            <span className="text-sm text-gray-400 font-mono group-hover:text-[#ffde59]/80 transition-colors">({stats.gf90}/partido)</span>
                        </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full text-green-600 group-hover:bg-[#ffde59]/10 group-hover:text-[#ffde59] transition-colors">
                        <Target size={24} />
                    </div>
                </div>

                {/* CONCEDED */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-default">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Goles en Contra</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.ga}</p>
                            <span className="text-sm text-gray-400 font-mono group-hover:text-[#ffde59]/80 transition-colors">({stats.ga90}/partido)</span>
                        </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-full text-red-600 group-hover:bg-[#ffde59]/10 group-hover:text-[#ffde59] transition-colors">
                        <Shield size={24} />
                    </div>
                </div>
            </div>

            {/* Secondary Grid: W/D/L & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* W/D/L Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center group hover:shadow-md transition-all cursor-default">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 group-hover:text-[#ffde59] transition-colors">Balance de Resultados</h3>
                    <div className="flex items-end justify-between text-center divide-x divide-gray-100">
                        <div className="flex-1 px-2">
                            <div className="text-green-600 mb-2 flex justify-center group-hover:text-[#ffde59] transition-colors"><ArrowUpRight size={28} /></div>
                            <p className="text-3xl font-black text-[#151e42] group-hover:text-[#ffde59] transition-colors">{stats.wins}</p>
                            <p className="text-xs text-gray-500 uppercase font-bold mt-1 group-hover:text-[#ffde59] transition-colors">Victorias</p>
                            <p className="text-sm font-bold text-gray-400 font-mono mt-1 group-hover:text-[#ffde59]/80 transition-colors">{((stats.wins / stats.played) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="flex-1 px-2">
                            <div className="text-yellow-600 mb-2 flex justify-center group-hover:text-[#ffde59] transition-colors"><Minus size={28} /></div>
                            <p className="text-3xl font-black text-[#151e42] group-hover:text-[#ffde59] transition-colors">{stats.draws}</p>
                            <p className="text-xs text-gray-500 uppercase font-bold mt-1 group-hover:text-[#ffde59] transition-colors">Empates</p>
                            <p className="text-sm font-bold text-gray-400 font-mono mt-1 group-hover:text-[#ffde59]/80 transition-colors">{((stats.draws / stats.played) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="flex-1 px-2">
                            <div className="text-red-500 mb-2 flex justify-center group-hover:text-[#ffde59] transition-colors"><ArrowDownRight size={28} /></div>
                            <p className="text-3xl font-black text-[#151e42] group-hover:text-[#ffde59] transition-colors">{stats.losses}</p>
                            <p className="text-xs text-gray-500 uppercase font-bold mt-1 group-hover:text-[#ffde59] transition-colors">Derrotas</p>
                            <p className="text-sm font-bold text-gray-400 font-mono mt-1 group-hover:text-[#ffde59]/80 transition-colors">{((stats.losses / stats.played) * 100).toFixed(0)}%</p>
                        </div>
                    </div>
                </div>

                {/* Score Frequencies */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group hover:shadow-md transition-all cursor-default">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#ffde59] transition-colors">Marcadores Frecuentes</h3>
                        <Hash size={16} className="text-gray-300 group-hover:text-[#ffde59] transition-colors" />
                    </div>
                    <div className="space-y-3">
                        {stats.topScores.map((s, idx) => (
                            <div key={s.score} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-400 w-4 group-hover:text-[#ffde59] transition-colors">{idx + 1}.</span>
                                    <span className="font-mono font-bold text-[#151e42] bg-gray-100 px-2 py-1 rounded text-sm group-hover:text-[#ffde59] group-hover:bg-[#ffde59]/10 transition-colors">{s.score}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#ffde59] rounded-full"
                                            style={{ width: `${(s.count / stats.played) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium w-8 text-right group-hover:text-[#ffde59] transition-colors">{s.count}</span>
                                </div>
                            </div>
                        ))}
                        {stats.topScores.length === 0 && <p className="text-sm text-gray-400 italic">No hay datos suficientes</p>}
                    </div>
                </div>

                {/* Advanced metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center gap-6 group hover:shadow-md transition-all cursor-default">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#ffde59] transition-colors">Diferencia de Goles</p>
                            <p className={`text-3xl font-black ${stats.gd.startsWith('+') ? 'text-green-600' : 'text-red-500'} group-hover:text-[#ffde59] transition-colors`}>{stats.gd}</p>
                        </div>
                        <TrendingUp size={24} className="text-gray-300 group-hover:text-[#ffde59] transition-colors" />
                    </div>
                    <div className="w-full h-px bg-gray-100 group-hover:bg-[#ffde59]/20 transition-colors"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#ffde59] transition-colors">Porterías a Cero</p>
                            <p className="text-3xl font-black text-[#151e42] group-hover:text-[#ffde59] transition-colors">{stats.cleanSheets}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#ffde59] transition-colors">% Imbatibilidad</p>
                            <p className="text-lg font-bold text-gray-600 group-hover:text-[#ffde59] transition-colors">{((stats.cleanSheets / stats.played) * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Goal Timing Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Distribución de Goles (Minutos)</h3>
                    <Clock size={16} className="text-gray-300" />
                </div>

                <div className="w-full">
                    <div className="flex items-end justify-between h-40 gap-1 w-full">
                        {goalTiming.map((bucket, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group relative">
                                {/* Tooltip on hover */}
                                <div className="absolute -top-12 bg-[#151e42] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    <span className="font-bold">{bucket.count}</span> goles <span className="opacity-75">({bucket.sharePercent}%)</span>
                                </div>

                                <div className="w-full bg-blue-50 rounded-t-sm relative h-full flex items-end overflow-hidden group-hover:bg-blue-100 transition-colors">
                                    <div
                                        className="w-full bg-[#151e42] opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out"
                                        style={{ height: `${bucket.heightPercent}%` }}
                                    ></div>
                                </div>
                                <span className={`text-[9px] font-mono text-center tracking-tighter w-full leading-none transform -rotate-90 md:rotate-0 origin-center mt-3 md:mt-2 ${bucket.label.includes('+') ? 'text-[#151e42] font-black' : 'text-gray-400 font-medium'}`}>{bucket.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div >

        </div >
    );
};

export default ClubStatsDashboard;
