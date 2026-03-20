import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trophy, MapPin, Clock } from 'lucide-react';

interface Match {
    id_partido: string | number;
    fecha: string;
    hora: string;
    club_local: string;
    club_visitante: string;
    goles_rm: string | number | null;
    goles_rival: string | number | null;
    competicion_nombre: string;
    competicion_foto_url?: string;
    estadio: string;
    resultado: string;
    isPlayed: boolean;
    local_shield_url: string;
    visitante_shield_url: string;
    slug: string;
    jornada?: string;
}

interface CalendarArchiveProps {
    matches: Match[];
}

const MONTHS = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

const CalendarArchive: React.FC<CalendarArchiveProps> = ({ matches }) => {
    const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
    const [selectedComp, setSelectedComp] = useState<string>('TODAS');
    const [currentPage, setCurrentPage] = useState(1);
    const matchesPerPage = 20;

    // Sort matches by date (oldest first for calendar?)
    // Actually calendar usually shows future ones too. 
    // Let's sort by date ASC.
    const sortedMatches = useMemo(() => {
        return [...matches].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    }, [matches]);

    // Use all months as requested
    const availableMonths = useMemo(() => {
        return ['TODOS', ...MONTHS];
    }, []);

    // All Competitions
    const ALL_COMPS = ["LIGA F", "UWCL", "COPA DE LA REINA", "SUPERCOPA DE ESPAÑA", "AMISTOSOS"];
    const availableComps = useMemo(() => {
        return ['TODAS', ...ALL_COMPS];
    }, []);

    const getCompColor = (comp: string) => {
        const c = comp.toUpperCase();
        if (c.includes('LIGA F')) return 'bg-[#40E0D0] border-[#40E0D0] text-black shadow-cyan-500/20';
        if (c.includes('UWCL')) return 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-blue-800/30';
        if (c.includes('COPA DE LA REINA')) return 'bg-[#ffa500] border-[#ffa500] text-black shadow-orange-500/20';
        if (c.includes('SUPERCOPA')) return 'bg-[#ff0000] border-[#ff0000] text-white shadow-red-500/20';
        if (c.includes('AMISTOSO')) return 'bg-gray-400 border-gray-400 text-white shadow-gray-500/20';
        if (c === 'TODAS') return 'bg-[#151e42] border-[#151e42] text-white shadow-blue-900/40';
        return 'bg-white border-gray-100 text-gray-400';
    };

    // Filter matches
    const filteredMatches = useMemo(() => {
        return sortedMatches.filter(m => {
            const date = new Date(m.fecha);
            const mName = (m.competicion_nombre || '').toUpperCase();
            const sComp = selectedComp.toUpperCase();
            
            const monthMatches = selectedMonth === 'TODOS' || MONTHS[date.getMonth()] === selectedMonth;
            
            // Handle AMISTOSOS vs AMISTOSO
            const targetComp = sComp === 'AMISTOSOS' ? 'AMISTOSO' : sComp;
            const compMatches = selectedComp === 'TODAS' || mName.includes(targetComp);
            
            return monthMatches && compMatches;
        });
    }, [sortedMatches, selectedMonth, selectedComp]);

    // Pagination
    const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);
    const paginatedMatches = useMemo(() => {
        const start = (currentPage - 1) * matchesPerPage;
        return filteredMatches.slice(start, start + matchesPerPage);
    }, [filteredMatches, currentPage]);

    return (
        <div className="calendar-archive-react">
            {/* Months Filter - Wrapping Grid */}
            <div className="filter-group mb-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto py-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 w-full justify-items-center">
                        {MONTHS.map(month => (
                            <button
                                key={month}
                                onClick={() => { 
                                    setSelectedMonth(prev => prev === month ? 'TODOS' : month); 
                                    setCurrentPage(1); 
                                }}
                                className={`w-full max-w-[160px] px-2 sm:px-4 py-3 sm:py-4 rounded-[18px] sm:rounded-[22px] font-black text-[10px] sm:text-xs tracking-widest transition-all border-2 
                                    ${selectedMonth === month 
                                        ? 'bg-[#ffde59] border-[#ffde59] text-[#151e42] shadow-xl translate-y-[-2px] sm:translate-y-[-4px]' 
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-[#ffde59] hover:text-[#151e42] hover:translate-y-[-2px] sm:hover:translate-y-[-4px] hover:shadow-lg'}`}
                            >
                                {month}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Competitions Filter - Wrapping Flex */}
            <div className="filter-group mb-16 sm:mb-20 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-wrap gap-3 sm:gap-4 justify-center py-4">
                        {ALL_COMPS.map(comp => (
                            <button
                                key={comp}
                                onClick={() => { 
                                    setSelectedComp(prev => prev === comp ? 'TODAS' : comp); 
                                    setCurrentPage(1); 
                                }}
                                className={`min-w-[130px] sm:min-w-[160px] px-4 sm:px-8 py-3 sm:py-4 rounded-[20px] sm:rounded-[24px] font-black text-[10px] sm:text-sm tracking-[0.05em] transition-all border-2 whitespace-nowrap
                                    ${selectedComp === comp 
                                        ? getCompColor(comp) + ' shadow-2xl translate-y-[-2px] sm:translate-y-[-4px]' 
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-[#151e42] hover:text-[#151e42] hover:translate-y-[-2px] sm:hover:translate-y-[-4px] hover:shadow-lg'}`}
                            >
                                {comp}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Matches List */}
            <div className="matches-list flex flex-col gap-6 mb-16">
                {paginatedMatches.length > 0 ? (
                    paginatedMatches.map((match) => {
                                const isHome = (match.club_local || '').toLowerCase().includes('real madrid');
                                const formattedJornada = match.jornada && !isNaN(Number(match.jornada)) 
                                    ? `JORNADA ${match.jornada}` 
                                    : (match.jornada || '').toUpperCase();
                                    
                                return (
                                    <a href={`/partidos/${match.slug}`} className="match-archive-card group" key={match.id_partido}>
                                        <div className="match-date-box">
                                            <div className="venue-icon-wrapper mb-2">
                                                {isHome ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14.639 10.258l4.83 -1.294a2 2 0 1 1 1.035 3.863l-14.489 3.883l-4.45 -5.02l2.897 -.776l2.45 1.414l2.897 -.776l-3.743 -6.244l2.898 -.777l5.675 5.727z" /><path d="M3 21h18" /></svg>
                                                )}
                                            </div>
                                            <span className="m-day">{new Date(match.fecha).getDate()}</span>
                                            <span className="m-month">{MONTHS[new Date(match.fecha).getMonth()].substring(0, 3)}</span>
                                        </div>
                                        
                                        <div className="match-main-content">
                                            <div className="teams-interaction-row">
                                                <div className="team-side local">
                                                    <span className="team-name">{match.club_local}</span>
                                                </div>
                                                
                                                <div className="central-block">
                                                    <img src={match.local_shield_url} alt={match.club_local} className="team-shield" />
                                                    <div className="match-score-box">
                                                        {match.isPlayed ? (
                                                            <div className="score-display">
                                                                <span>{match.goles_rm}</span>
                                                                <span className="score-separator">-</span>
                                                                <span>{match.goles_rival}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="time-display">
                                                                <Clock size={16} />
                                                                <span>{match.hora || 'TBD'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <img src={match.visitante_shield_url} alt={match.club_visitante} className="team-shield" />
                                                </div>

                                                <div className="team-side visitor">
                                                    <span className="team-name">{match.club_visitante}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="match-meta-container mt-3 w-full">
                                                <div className="meta-row flex items-center justify-center gap-3 whitespace-nowrap overflow-hidden">
                                                    <div className="meta-item flex items-center gap-2">
                                                        <Trophy size={11} className="opacity-40" />
                                                        <span className="text-[10px] font-black uppercase opacity-70 tracking-tighter">
                                                            {match.competicion_nombre} {formattedJornada ? `• ${formattedJornada}` : ''}
                                                        </span>
                                                    </div>
                                                    <span className="opacity-20 text-[10px]">|</span>
                                                    <div className="meta-item flex items-center gap-2">
                                                        <MapPin size={11} className="opacity-40" />
                                                        <span className="text-[10px] font-black uppercase opacity-70 tracking-tighter">
                                                            {match.estadio}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="match-comp-logo-right">
                                            {match.competicion_foto_url ? (
                                                <img src={match.competicion_foto_url} alt={match.competicion_nombre} className="comp-logo-large" />
                                            ) : (
                                                <Trophy size={32} className="opacity-10" />
                                            )}
                                        </div>
                                    </a>
                                );
                            })
                ) : (
                    <div className="py-24 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 mx-4">
                        <CalendarIcon className="mx-auto text-gray-100 mb-6" size={80} />
                        <p className="text-gray-400 font-bold text-xl max-w-md mx-auto px-6 italic uppercase tracking-wider opacity-60">
                            {selectedMonth !== 'TODOS' && selectedComp === 'TODAS' 
                                ? "No hay partidos programados en este mes"
                                : selectedComp !== 'TODAS' && selectedMonth === 'TODOS'
                                ? "No hay partidos programados de esta competición"
                                : "No hay partidos programados con estos filtros"}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 py-10 border-t border-gray-100/50">
                    <button
                        onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className="p-3 rounded-2xl border-2 border-gray-100 disabled:opacity-20 hover:border-[#ffde59] transition-all bg-white shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => {
                                    setCurrentPage(page);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-10 h-10 flex items-center justify-center rounded-2xl font-black transition-all border-2 text-sm
                                    ${currentPage === page 
                                        ? 'bg-[#ffde59] border-[#ffde59] text-[#151e42] shadow-md scale-110' 
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            setCurrentPage(prev => Math.min(totalPages, prev + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className="p-3 rounded-2xl border-2 border-gray-100 disabled:opacity-20 hover:border-[#ffde59] transition-all bg-white shadow-sm"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .match-archive-card {
                    display: flex;
                    background: #ffde59;
                    border-radius: 40px 0 0 0;
                    overflow: hidden;
                    text-decoration: none;
                    color: #151e42;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    position: relative;
                    min-height: 140px;
                }
                .match-archive-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
                }
                .match-date-box {
                    background: rgba(0, 0, 0, 0.05);
                    color: #151e42;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 110px;
                    min-width: 110px;
                }
                .venue-icon-wrapper { color: #151e42; }
                .m-day { font-size: 2.22rem; font-family: 'Bebas Neue', sans-serif; line-height: 1; }
                .m-month { font-size: 0.9rem; font-weight: 800; text-transform: uppercase; color: #151e42; }

                .match-main-content {
                    flex-grow: 1;
                    padding: 1.5rem 2.5rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                }
                
                .teams-interaction-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
                .team-side {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    min-width: 0;
                }
                .team-side.local { justify-content: flex-end; padding-right: 2.5rem; text-align: right; }
                .team-side.visitor { justify-content: flex-start; padding-left: 2.5rem; text-align: left; }

                .team-name {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.6rem;
                    color: #151e42;
                    line-height: 1;
                    text-transform: uppercase;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .central-block {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .team-shield {
                    width: 55px;
                    height: 55px;
                    object-fit: contain;
                }

                .match-score-box {
                    min-width: 100px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .score-display {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 3.5rem;
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    color: #151e42;
                    line-height: 1;
                }
                .score-separator { opacity: 0.3; }
                
                .time-display {
                    background: rgba(0, 0, 0, 0.08);
                    padding: 0.5rem 1rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 800;
                    font-size: 1rem;
                    color: #151e42;
                }

                .match-comp-logo-right {
                    width: 140px;
                    min-width: 140px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-right: 1.5rem;
                }
                .comp-logo-large { width: 90px; height: 90px; object-fit: contain; }

                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                @media (max-width: 1024px) {
                    .team-name { font-size: 1.2rem; }
                    .score-display { font-size: 2.5rem; }
                    .team-shield { width: 45px; height: 45px; }
                    .team-side.local { padding-right: 1.5rem; }
                    .team-side.visitor { padding-left: 1.5rem; }
                    .match-comp-logo-right { width: 100px; min-width: 100px; }
                    .comp-logo-large { width: 60px; height: 60px; }
                }

                @media (max-width: 768px) {
                    .match-archive-card { flex-direction: column; min-height: auto; border-radius: 25px 0 0 0; margin-left: 1rem; margin-right: 1rem; }
                    .match-date-box { width: 100%; height: auto; padding: 1.5rem; flex-direction: row; gap: 1.5rem; background: rgba(0,0,0,0.05); }
                    .venue-icon-wrapper { margin-bottom: 0 !important; }
                    .match-main-content { padding: 2rem 1.5rem; }
                    .teams-interaction-row { flex-direction: column; gap: 1rem; }
                    .team-side { width: 100%; justify-content: center !important; padding: 0 !important; }
                    .team-name { font-size: 1.4rem; white-space: normal; text-align: center !important; }
                    .central-block { margin: 0.5rem 0; width: 100%; justify-content: center; }
                    .match-comp-logo-right { width: 100%; height: 110px; padding: 1.5rem; border-top: 1px solid rgba(0,0,0,0.05); }
                    .comp-logo-large { width: 80px; height: 80px; }
                    .meta-row { flex-direction: row; gap: 0.5rem; justify-content: center; }
                    .meta-item span { font-size: 9px; letter-spacing: -0.2px; }
                }
            ` }} />
        </div>
    );
};

export default CalendarArchive;
