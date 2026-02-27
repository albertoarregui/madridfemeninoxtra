import React, { useMemo, useState } from 'react';
import { Trophy, Calendar, Target, Activity, Monitor, ArrowUpRight, ArrowDownRight, Minus, Hash, Clock, Shield, TrendingUp, Swords } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

interface Match {
    temporada_nombre: string;
    competicion_nombre: string;
    goles_rm: number | string | null;
    goles_rival: number | string | null;
    penaltis?: number | string;
    resultado?: 'V' | 'E' | 'D';
    asistencia?: number | string;
    capacidad?: number | string;
    estadio?: string;
    faltas_cometidas?: number | string;
    faltas_recibidas?: number | string;
    amarillas_rm?: number;
    amarillas_rival?: number;
    rojas_rm?: number;
    rojas_rival?: number;
    penaltis_rm?: number;
    penaltis_rival?: number;
    [key: string]: any;
}

interface Goal {
    id_gol: number;
    minuto: number | string;
    temporada: string;
    competicion: string;
    nombre_goleadora?: string;
    foto_goleadora?: string;
    nombre_asistente?: string;
    foto_asistente?: string;
}

interface ClubStatsDashboardProps {
    matches: Match[];
    goals: Goal[];
    seasons: string[];
    competitions: string[];
}

const ClubStatsDashboard: React.FC<ClubStatsDashboardProps> = ({ matches, goals, seasons, competitions }) => {
    const [selectedSeason, setSelectedSeason] = useState<string>(seasons.length > 0 ? seasons[0] : 'all');
    const [selectedCompetition, setSelectedCompetition] = useState<string>('Partidos Oficiales');

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

    const stats = useMemo(() => {
        let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0, cleanSheets = 0, played = 0;
        let foulsCommitted = 0, foulsReceived = 0, yellowsRM = 0, yellowsRival = 0;
        let redsRM = 0, redsRival = 0, penaltisRM = 0, penaltisRival = 0;
        const scoreFrequencies: Record<string, number> = {};

        filteredMatches.forEach(m => {
            if (m.goles_rm === null || m.goles_rm === undefined || m.goles_rival === null || m.goles_rival === undefined) return;
            played++;
            const gRM = Number(m.goles_rm);
            const gRiv = Number(m.goles_rival);
            gf += gRM; ga += gRiv;
            if (gRiv === 0) cleanSheets++;
            foulsCommitted += Number(m.faltas_cometidas || 0);
            foulsReceived += Number(m.faltas_recibidas || 0);
            yellowsRM += Number(m.amarillas_rm || 0);
            yellowsRival += Number(m.amarillas_rival || 0);
            redsRM += Number(m.rojas_rm || 0);
            redsRival += Number(m.rojas_rival || 0);
            penaltisRM += Number(m.penaltis_rm || 0);
            penaltisRival += Number(m.penaltis_rival || 0);

            if (gRM > gRiv) wins++;
            else if (gRM < gRiv) losses++;
            else draws++;

            const scoreKey = `${gRM}-${gRiv}`;
            scoreFrequencies[scoreKey] = (scoreFrequencies[scoreKey] || 0) + 1;
        });

        const points = (wins * 3) + draws;
        const ppg = played > 0 ? (points / played).toFixed(2) : '0.00';
        const gf90 = played > 0 ? (gf / played).toFixed(2) : '0.00';
        const ga90 = played > 0 ? (ga / played).toFixed(2) : '0.00';
        const gd = gf - ga;
        const gdSign = gd > 0 ? '+' : '';

        return {
            played, wins, draws, losses, gf, ga,
            gd: `${gdSign}${gd}`,
            cleanSheets, points, ppg, gf90, ga90,
            foulsCommitted, foulsReceived, yellowsRM, yellowsRival,
            redsRM, redsRival, penaltisRM, penaltisRival
        };
    }, [filteredMatches]);

    const goalTiming = useMemo(() => {
        const buckets: Record<string, { label: string, count: number, order: number }> = {};
        for (let i = 0; i < 45; i += 5) {
            const start = i + 1;
            const end = i + 5;
            buckets[`${start}-${end}`] = { label: `${start}-${end}'`, count: 0, order: i };
        }
        buckets['45+'] = { label: '45+', count: 0, order: 45 };
        for (let i = 45; i < 90; i += 5) {
            const start = i + 1;
            const end = i + 5;
            buckets[`${start}-${end}`] = { label: `${start}-${end}'`, count: 0, order: i + 1 };
        }
        buckets['90+'] = { label: '90+', count: 0, order: 91 };
        for (let i = 90; i < 120; i += 5) {
            const start = i + 1;
            const end = i + 5;
            buckets[`${start}-${end}`] = { label: `${start}-${end}'`, count: 0, order: i + 2 };
        }
        buckets['120+'] = { label: '120+', count: 0, order: 122 };

        filteredGoals.forEach(g => {
            const minStr = String(g.minuto || '').trim();
            if (minStr === '') return;
            if (minStr.includes('+')) {
                const [base] = minStr.split('+');
                const baseNum = Number(base);
                if (baseNum === 45) { buckets['45+'].count++; return; }
                if (baseNum === 90) { buckets['90+'].count++; return; }
                if (baseNum >= 120) { buckets['120+'].count++; return; }
                const upper = Math.ceil(baseNum / 5) * 5;
                const lower = upper - 4;
                if (buckets[`${lower}-${upper}`]) buckets[`${lower}-${upper}`].count++;
                return;
            }
            const val = Number(minStr);
            if (isNaN(val)) return;
            if (val > 120) buckets['120+'].count++;
            else {
                const upper = Math.ceil(val / 5) * 5;
                const lower = upper - 4;
                if (buckets[`${lower}-${upper}`]) buckets[`${lower}-${upper}`].count++;
            }
        });

        let result = Object.values(buckets).sort((a, b) => a.order - b.order);
        const hasET = filteredGoals.some(g => {
            const m = String(g.minuto);
            if (m.includes('+')) return Number(m.split('+')[0]) > 90;
            return Number(m) > 90;
        });
        if (!hasET) result = result.filter(b => b.order <= 91);
        const maxVal = Math.max(...result.map(b => b.count), 1);

        return result.map(b => ({
            ...b,
            heightPercent: (b.count / maxVal) * 100,
            sharePercent: (stats.gf > 0 ? (b.count / stats.gf) * 100 : 0).toFixed(1)
        }));
    }, [filteredGoals, stats.gf, stats.played]);

    const { topScorers, topAssisters, topGA } = useMemo(() => {
        const playerMap: Record<string, { name: string, goals: number, assists: number, total: number }> = {};
        filteredGoals.forEach(g => {
            if (g.nombre_goleadora) {
                const name = g.nombre_goleadora;
                if (!playerMap[name]) playerMap[name] = { name, goals: 0, assists: 0, total: 0 };
                playerMap[name].goals += 1; playerMap[name].total += 1;
            }
            if (g.nombre_asistente) {
                const name = g.nombre_asistente;
                if (!playerMap[name]) playerMap[name] = { name, goals: 0, assists: 0, total: 0 };
                playerMap[name].assists += 1; playerMap[name].total += 1;
            }
        });
        const players = Object.values(playerMap);
        return {
            topScorers: [...players].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, 5),
            topAssisters: [...players].filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name)).slice(0, 5),
            topGA: [...players].filter(p => p.total > 0).sort((a, b) => b.total - a.total || b.goals - a.goals).slice(0, 5)
        };
    }, [filteredGoals]);

    const getSlug = (name: string) => name.toLowerCase().trim().replace(/ø/g, 'o').replace(/ö/g, 'o').replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w-]/g, '').replace(/--+/g, '-');
    const getPlayerImage = (name: string, type: 'goleadora' | 'asistente' = 'goleadora') => {
        // Buscar la foto en los datos de los goles
        const goal = goals.find(g =>
            (type === 'goleadora' && g.nombre_goleadora === name) ||
            (type === 'asistente' && g.nombre_asistente === name)
        );

        const dbPhoto = goal ? (type === 'goleadora' ? goal.foto_goleadora : goal.foto_asistente) : null;

        if (dbPhoto) return dbPhoto;

        // Fallback al asset local si no hay foto en el registro del gol
        return getAssetUrl('jugadoras', getSlug(name));
    };

    if (!stats.played) return null;

    return (
        <div className="w-full max-w-7xl mx-auto mb-0">
            <div className="flex flex-col items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-4 justify-center w-full">
                    <div className="relative">
                        <select
                            className="appearance-none bg-white text-[#2b2b2b] border-2 border-[#ffde59] rounded-full py-3 pl-6 pr-12 text-[0.95rem] font-semibold min-w-[220px] shadow-[0_2px_8px_rgba(255,222,89,0.2)] focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 hover:bg-[#fffef8] hover:border-[#ffd700] transition-all cursor-pointer text-center"
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                            aria-label="Seleccionar temporada"
                        >
                            <option value="all">Todas las Temporadas</option>
                            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg>
                        </div>
                    </div>
                    <div className="relative">
                        <select
                            className="appearance-none bg-white text-[#2b2b2b] border-2 border-[#ffde59] rounded-full py-3 pl-6 pr-12 text-[0.95rem] font-semibold min-w-[220px] shadow-[0_2px_8px_rgba(255,222,89,0.2)] focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 hover:bg-[#fffef8] hover:border-[#ffd700] transition-all cursor-pointer text-center"
                            value={selectedCompetition}
                            onChange={(e) => setSelectedCompetition(e.target.value)}
                            aria-label="Seleccionar competición"
                        >
                            <option value="all">Todas las Competiciones</option>
                            <option value="Partidos Oficiales">Partidos Oficiales</option>
                            {['Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España', 'Amistosos'].map(c => competitions.includes(c) && <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-default">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Partidos</p>
                        <p className="text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.played}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-full text-gray-600 group-hover:text-gray-600 transition-colors"><Monitor size={24} /></div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-default">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Puntos</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.points}</p>
                            <span className="text-sm text-gray-400 font-mono group-hover:text-[#ffde59]/80 transition-colors">({stats.ppg}/partido)</span>
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-full text-yellow-600 group-hover:text-yellow-600 transition-colors"><Trophy size={24} /></div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-default">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Goles a Favor</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.gf}</p>
                            <span className="text-sm text-gray-400 font-mono group-hover:text-[#ffde59]/80 transition-colors">({stats.gf90}/partido)</span>
                        </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full text-green-600 group-hover:text-green-600 transition-colors"><Target size={24} /></div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-default">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Goles en Contra</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.ga}</p>
                            <span className="text-sm text-gray-400 font-mono group-hover:text-[#ffde59]/80 transition-colors">({stats.ga90}/partido)</span>
                        </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-full text-red-600 group-hover:text-red-600 transition-colors"><Shield size={24} /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center group hover:shadow-md transition-all cursor-default">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 group-hover:text-[#ffde59] transition-colors">Balance de Resultados</h3>
                    <div className="flex items-end justify-between text-center divide-x divide-gray-100">
                        <div className="flex-1 px-2">
                            <div className="text-green-600 mb-2 flex justify-center"><ArrowUpRight size={28} /></div>
                            <p className="text-3xl font-black text-[#151e42]">{stats.wins}</p>
                            <p className="text-xs text-gray-500 uppercase font-bold mt-1">Victorias</p>
                            <p className="text-sm font-bold text-gray-400 font-mono mt-1">{((stats.wins / stats.played) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="flex-1 px-2">
                            <div className="text-yellow-600 mb-2 flex justify-center"><Minus size={28} /></div>
                            <p className="text-3xl font-black text-[#151e42]">{stats.draws}</p>
                            <p className="text-xs text-gray-500 uppercase font-bold mt-1">Empates</p>
                            <p className="text-sm font-bold text-gray-400 font-mono mt-1">{((stats.draws / stats.played) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="flex-1 px-2">
                            <div className="text-red-500 mb-2 flex justify-center"><ArrowDownRight size={28} /></div>
                            <p className="text-3xl font-black text-[#151e42]">{stats.losses}</p>
                            <p className="text-xs text-gray-500 uppercase font-bold mt-1">Derrotas</p>
                            <p className="text-sm font-bold text-gray-400 font-mono mt-1">{((stats.losses / stats.played) * 100).toFixed(0)}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group hover:shadow-md transition-all cursor-default overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#ffde59] transition-colors">Disciplina</h3>
                        <Swords size={16} className="text-gray-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div className="col-span-2 flex items-center justify-between pb-2 border-b border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Faltas</span>
                                <span className="text-xs text-gray-500">Cometidas vs Provocadas</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-red-500">{stats.foulsCommitted}</span>
                                <span className="text-lg font-black text-gray-200">/</span>
                                <span className="text-lg font-black text-green-500">{stats.foulsReceived}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Amarillas</span>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm"></div><span className="text-sm font-bold text-gray-600 uppercase">A favor</span></div>
                                <span className="text-sm font-black text-[#151e42]">{stats.yellowsRival}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm"></div><span className="text-sm font-bold text-gray-600 uppercase">En contra</span></div>
                                <span className="text-sm font-black text-[#151e42]">{stats.yellowsRM}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Rojas</span>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-3.5 bg-red-600 rounded-sm"></div><span className="text-sm font-bold text-gray-600 uppercase">A favor</span></div>
                                <span className="text-sm font-black text-[#151e42]">{stats.redsRival}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-3.5 bg-red-600 rounded-sm"></div><span className="text-sm font-bold text-gray-600 uppercase">En contra</span></div>
                                <span className="text-sm font-black text-[#151e42]">{stats.redsRM}</span>
                            </div>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Penaltis</span>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-gray-400 uppercase">A favor</span><span className="text-sm font-black text-green-600">{stats.penaltisRM}</span></div>
                                <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-gray-400 uppercase">En contra</span><span className="text-sm font-black text-red-600">{stats.penaltisRival}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center gap-6 hover:shadow-md transition-all cursor-default">
                    <div className="flex items-center justify-between group">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#ffde59] transition-colors">Diferencia de Goles</p>
                            <p className={`text-3xl font-black ${stats.gd.startsWith('+') ? 'text-green-600' : 'text-red-500'} group-hover:text-[#ffde59] transition-colors`}>{stats.gd}</p>
                        </div>
                        <TrendingUp size={24} className="text-gray-300 group-hover:text-[#ffde59] transition-colors" />
                    </div>
                    <div className="w-full h-px bg-gray-100"></div>
                    <div className="flex items-center justify-between">
                        <div className="group">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#ffde59] transition-colors">Porterías a Cero</p>
                            <p className="text-3xl font-black text-[#151e42] group-hover:text-[#ffde59] transition-colors">{stats.cleanSheets}</p>
                        </div>
                        <div className="text-right group">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#ffde59] transition-colors">% Imbatibilidad</p>
                            <p className="text-lg font-bold text-gray-600 group-hover:text-[#ffde59] transition-colors">{((stats.cleanSheets / stats.played) * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 group hover:shadow-md transition-all cursor-default">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#ffde59] transition-colors">Evolución de Asistencia</h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#151e42]"></div><span className="text-gray-500">Asistencia</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-gray-300 border-dashed bg-transparent"></div><span className="text-gray-400">Capacidad</span></div>
                    </div>
                </div>
                <div className="h-64 w-full relative">
                    {(() => {
                        const chartData = filteredMatches
                            .filter(m => m.fecha && !isNaN(new Date(m.fecha).getTime()))
                            .filter(m => m.estadio && (m.estadio.includes('Stefano') || m.estadio.includes('Stéfano')))
                            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                            .map(m => ({
                                date: new Date(m.fecha),
                                label: new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                                fullDate: new Date(m.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
                                rival: m.club_visitante === 'Real Madrid' ? m.club_local : m.club_visitante,
                                attendance: Number(m.asistencia || 0),
                                capacity: Number(m.capacidad || 6000)
                            }))
                            .filter(d => d.attendance > 0);
                        if (chartData.length < 2) return <p className="text-center text-gray-400 italic pt-20">No hay suficientes datos de asistencia (Alfredo Di Stéfano)</p>;
                        const maxCap = Math.max(...chartData.map(d => d.capacity), ...chartData.map(d => d.attendance)) * 1.1;
                        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(maxCap * p));
                        const getX = (i: number) => (i / (chartData.length - 1)) * 1000;
                        const getY = (val: number) => 300 - ((val / maxCap) * 300);
                        const attPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.attendance)}`).join(' ');
                        const capPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.capacity)}`).join(' ');
                        const attArea = `${attPath} L 1000 300 L 0 300 Z`;
                        return (
                            <div className="flex w-full h-full">
                                <div className="flex flex-col justify-between h-full text-[9px] text-gray-400 font-mono pr-2 pb-6 pt-1 text-right min-w-[30px]">
                                    {yTicks.slice().reverse().map((tick, i) => (<span key={i}>{tick >= 1000 ? (tick / 1000).toFixed(1) + 'k' : tick}</span>))}
                                </div>
                                <div className="relative flex-1 h-full group/chart">
                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                                        {[0, 75, 150, 225, 300].map(p => (<line key={p} x1="0" y1={p} x2="1000" y2={p} stroke="#f3f4f6" strokeWidth="1" vectorEffect="non-scaling-stroke" />))}
                                        <path d={capPath} fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                                        <path d={attArea} fill="url(#gradientAtt)" className="opacity-20" />
                                        <defs><linearGradient id="gradientAtt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#151e42" /><stop offset="100%" stopColor="#151e42" stopOpacity="0" /></linearGradient></defs>
                                        <path d={attPath} fill="none" stroke="#151e42" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                        {chartData.map((d, i) => (
                                            <g key={i} className="group/point">
                                                <rect x={getX(i) - (500 / chartData.length)} y="0" width={1000 / chartData.length} height="300" fill="transparent" className="cursor-crosshair" />
                                                <line x1={getX(i)} y1="0" x2={getX(i)} y2="300" stroke="#ffde59" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" className="opacity-0 group-hover/point:opacity-100 transition-opacity" />
                                                <circle cx={getX(i)} cy={getY(d.attendance)} r="4" fill="#151e42" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="opacity-0 group-hover/point:opacity-100 transition-opacity" />
                                                <foreignObject x={getX(i) < 500 ? getX(i) : getX(i) - 140} y={0} width="140" height="300" className="overflow-visible pointer-events-none">
                                                    <div className={`absolute top-0 ${getX(i) < 500 ? 'left-2' : 'right-2'} transition-opacity opacity-0 group-hover/point:opacity-100 z-[100] bg-[#151e42] text-white text-[10px] p-2 rounded shadow-lg min-w-[140px] whitespace-nowrap pointer-events-none`}>
                                                        <p className="font-bold border-b border-gray-600 pb-1 mb-1 text-[#ffde59]">{d.fullDate}</p>
                                                        <p className="text-gray-300 mb-1">vs {d.rival}</p>
                                                        <div className="flex justify-between gap-3"><span className="text-gray-400">Asistencia:</span><span className="font-bold">{d.attendance.toLocaleString()}</span></div>
                                                        <div className="flex justify-between gap-3"><span className="text-gray-400">Capacidad:</span><span className="font-mono text-gray-500">{d.capacity.toLocaleString()}</span></div>
                                                        <div className="mt-1 pt-1 border-t border-gray-600 flex justify-between gap-3"><span className="text-gray-400">% Ocupación:</span><span className={`font-bold ${d.attendance / d.capacity > 0.8 ? 'text-green-400' : 'text-white'}`}>{d.capacity > 0 ? ((d.attendance / d.capacity) * 100).toFixed(1) : 0}%</span></div>
                                                    </div>
                                                </foreignObject>
                                            </g>
                                        ))}
                                    </svg>
                                    <div className="absolute w-full flex justify-between text-[9px] text-gray-400 font-mono mt-2 -bottom-6">
                                        <span>{chartData[0]?.label}</span>
                                        {chartData.length > 2 && <span>{chartData[Math.floor(chartData.length / 2)].label}</span>}
                                        {chartData.length > 1 && <span>{chartData[chartData.length - 1].label}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group hover:shadow-md transition-all cursor-default relative">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#ffde59] transition-colors">Distribución de Goles (Minutos)</h3>
                    <Clock size={16} className="text-gray-300" />
                </div>

                <div className="w-full">
                    <div className="flex items-end justify-between h-40 gap-1 w-full pt-6">
                        {goalTiming.map((bucket, i) => (
                            <div key={i} className={`flex-1 flex flex-col items-center group relative h-full ${i % 2 !== 0 ? 'hidden md:flex' : ''}`}>
                                <div className="w-full relative h-full flex flex-col items-center justify-end">

                                    {bucket.count > 0 && (
                                        <div className="relative h-8 w-full flex items-center justify-center mb-1">
                                            <span className="absolute text-[#151e42] font-black text-xs opacity-70 group-hover:opacity-0 transition-opacity">
                                                {bucket.count}
                                            </span>
                                            <span className="absolute text-[#151e42] font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity z-[100]">
                                                {bucket.sharePercent}%
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className={`w-full ${bucket.count > 0 ? 'bg-[#ffde59]' : 'bg-gray-50'} transition-all duration-300 ease-out rounded-t-sm relative`}
                                        style={{ height: `${bucket.heightPercent}%`, minHeight: bucket.count > 0 ? '4px' : '2px' }}
                                    ></div>
                                </div>

                                <span className={`text-[9px] font-mono text-center tracking-tighter w-full leading-none mt-2 min-h-[14px] flex items-center justify-center transition-colors ${bucket.label.includes('+') ? 'text-[#151e42] font-black' : 'text-gray-400 font-medium group-hover:text-[#151e42]'}`}>
                                    {bucket.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group hover:shadow-md transition-all cursor-default lg:col-span-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#ffde59] transition-colors">Máximas Goleadoras</h3>
                        <div className="bg-green-50 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55l4.76 -3.45" /><path d="M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45" /></svg></div>
                    </div>
                    <div className="space-y-4">
                        {topScorers.map((p, i) => (
                            <a key={p.name} href={`/jugadoras/${getSlug(p.name)}`} className="flex items-center justify-between group/p hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg font-black w-4 ${i === 0 ? 'text-[#ffde59]' : 'text-gray-200'}`}>{i + 1}</span>
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm"><img src={getPlayerImage(p.name, 'goleadora')} alt={p.name} className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/jugadoras/placeholder.png'; }} /></div>
                                    <span className="text-sm font-bold text-gray-700 group-hover/p:text-[#151e42]">{p.name}</span>
                                </div>
                                <span className="text-lg font-black text-[#151e42]">{p.goals}</span>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group hover:shadow-md transition-all cursor-default lg:col-span-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#ffde59] transition-colors">Máximas Asistentes</h3>
                        <div className="bg-red-50 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 9a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1l0 -2" /><path d="M12 8l0 13" /><path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" /></svg></div>
                    </div>
                    <div className="space-y-4">
                        {topAssisters.map((p, i) => (
                            <a key={p.name} href={`/jugadoras/${getSlug(p.name)}`} className="flex items-center justify-between group/p hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg font-black w-4 ${i === 0 ? 'text-[#ffde59]' : 'text-gray-200'}`}>{i + 1}</span>
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm"><img src={getPlayerImage(p.name, 'asistente')} alt={p.name} className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/jugadoras/placeholder.png'; }} /></div>
                                    <span className="text-sm font-bold text-gray-700 group-hover/p:text-[#151e42]">{p.name}</span>
                                </div>
                                <span className="text-lg font-black text-[#151e42]">{p.assists}</span>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group hover:shadow-md transition-all cursor-default lg:col-span-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#ffde59] transition-colors">Goles + Asistencias</h3>
                        <div className="bg-purple-50 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 12.057a1.9 1.9 0 0 0 .614 .743c1.06 .713 2.472 .112 3.043 -.919c.839 -1.513 -.022 -3.368 -1.525 -4.08c-2 -.95 -4.371 .154 -5.24 2.086c-1.095 2.432 .29 5.248 2.71 6.246c2.931 1.208 6.283 -.418 7.438 -3.255c1.36 -3.343 -.557 -7.134 -3.896 -8.41c-3.855 -1.474 -8.2 .68 -9.636 4.422c-1.63 4.253 .823 9.024 5.082 10.576c4.778 1.74 10.118 -.941 11.833 -5.59a9.354 9.354 0 0 0 .577 -2.813" /></svg></div>
                    </div>
                    <div className="space-y-4">
                        {topGA.map((p, i) => (
                            <a key={p.name} href={`/jugadoras/${getSlug(p.name)}`} className="flex items-center justify-between group/p hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg font-black w-4 ${i === 0 ? 'text-[#ffde59]' : 'text-gray-200'}`}>{i + 1}</span>
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm"><img src={getPlayerImage(p.name, 'goleadora')} alt={p.name} className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/jugadoras/placeholder.png'; }} /></div>
                                    <span className="text-sm font-bold text-gray-700 group-hover/p:text-[#151e42]">{p.name}</span>
                                </div>
                                <span className="text-lg font-black text-[#151e42]">{p.total}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubStatsDashboard;
