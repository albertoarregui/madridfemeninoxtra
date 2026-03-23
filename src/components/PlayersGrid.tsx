import React, { useState, useMemo, useRef } from 'react';

interface Player {
    id_jugadora: string;
    nombre: string;
    slug: string;
    imageUrl: string;
    thumbnailUrl?: string;
    posicion: string;
    pais_origen: string;
    pais_origin?: string;
    countryName: string;
    flagUrl: string;
    temporadas?: string[];
    dorsales?: Record<string, number>;
    lat?: number | null;
    lng?: number | null;
    [key: string]: any;
}

interface PlayersGridProps {
    players: Player[];
}

const PlayersGrid: React.FC<PlayersGridProps> = ({ players }) => {
    const [selectedPosition, setSelectedPosition] = useState<string>('Todas');
    const [selectedCountry, setSelectedCountry] = useState<string>('Todos');
    const [selectedSeason, setSelectedSeason] = useState<string>('Todas');

    const POSITION_ORDER: Record<string, number> = {
        'Portera': 1,
        'Lateral izquierda': 2,
        'Defensa central': 3,
        'Defensa': 3,
        'Lateral derecha': 4,
        'Centrocampista': 5,
        'Extremo izquierdo': 6,
        'Extremo derecho': 6,
        'Extremo': 6,
        'Delantera': 7
    };

    const positions = useMemo(() => {
        const pos = new Set(players.map(p => p.posicion).filter(Boolean));
        return ['Todas', ...Array.from(pos).sort((a, b) => {
            const orderA = POSITION_ORDER[a] || 99;
            const orderB = POSITION_ORDER[b] || 99;
            return orderA - orderB;
        })];
    }, [players]);

    const countries = useMemo(() => {
        const ct = new Set(players.map(p => p.pais_origin || p.pais_origen).filter(Boolean));
        return ['Todos', ...Array.from(ct).sort()];
    }, [players]);

    const seasons = useMemo(() => {
        const allSeasons = new Set<string>();
        players.forEach(p => {
            if (Array.isArray(p.temporadas)) {
                p.temporadas.forEach(s => allSeasons.add(s));
            }
        });

        const sorted = Array.from(allSeasons).sort().reverse();
        if (sorted.length > 0) return ['Todas', ...sorted];
        return ['Todas', '2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021'];
    }, [players]);

    const filteredPlayers = useMemo(() => {
        const filtered = players.filter(player => {
            const matchesPosition = selectedPosition === 'Todas' || player.posicion === selectedPosition;
            const country = player.pais_origin || player.pais_origen;
            const matchesCountry = selectedCountry === 'Todos' || country === selectedCountry;

            let matchesSeason = true;
            if (selectedSeason !== 'Todas') {
                if (Array.isArray(player.temporadas) && player.temporadas.length > 0) {
                    matchesSeason = player.temporadas.includes(selectedSeason);
                } else {
                    matchesSeason = false;
                }
            }
            return matchesPosition && matchesCountry && matchesSeason;
        });

        const sorted = filtered.sort((a, b) => {
            const orderA = POSITION_ORDER[a.posicion] || 99;
            const orderB = POSITION_ORDER[b.posicion] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.nombre.localeCompare(b.nombre);
        });

        return sorted;
    }, [players, selectedPosition, selectedCountry, selectedSeason]);

    const gridRef = useRef<HTMLDivElement>(null);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-16 flex flex-col items-center" id="players-grid" ref={gridRef}>
            {/* Filters Section */}
            <div className="flex gap-4 w-full flex-wrap justify-center items-center relative z-[1001] mb-12 md:mb-24">
                <div className="custom-select-container" data-custom-select="true">
                    <div className="custom-select-trigger" style={{ cursor: 'pointer' }}>
                        <span className="selected-text whitespace-nowrap overflow-hidden text-ellipsis">
                            {selectedSeason === 'Todas' ? 'Todas las Temporadas' : `${selectedSeason.replace('-', '/')}`}
                        </span>
                        <div className="custom-select-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                    </div>
                    <select
                        style={{ display: 'none' }}
                        className="native-select"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
                        {seasons.map(s => (
                            <option key={s} value={s}>{s === 'Todas' ? 'Todas las Temporadas' : `${s.replace('-', '/')}`}</option>
                        ))}
                    </select>
                    <div className="custom-select-options">
                        {seasons.map(s => (
                            <div key={s} className={`custom-select-option ${selectedSeason === s ? 'selected' : ''}`} data-value={s}>
                                {s === 'Todas' ? 'Todas las Temporadas' : `${s.replace('-', '/')}`}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="custom-select-container" data-custom-select="true">
                    <div className="custom-select-trigger" style={{ cursor: 'pointer' }}>
                        <span className="selected-text">
                            {selectedPosition === 'Todas' ? 'Todas las Posiciones' : selectedPosition}
                        </span>
                        <div className="custom-select-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                    </div>
                    <select
                        style={{ display: 'none' }}
                        className="native-select"
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                    >
                        {positions.map(pos => <option key={pos} value={pos}>{pos === 'Todas' ? 'Todas las Posiciones' : pos}</option>)}
                    </select>
                    <div className="custom-select-options">
                        {positions.map(pos => (
                            <div key={pos} className={`custom-select-option ${selectedPosition === pos ? 'selected' : ''}`} data-value={pos}>
                                {pos === 'Todas' ? 'Todas las Posiciones' : pos}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="custom-select-container" data-custom-select="true">
                    <div className="custom-select-trigger" style={{ cursor: 'pointer' }}>
                        <span className="selected-text">
                            {selectedCountry === 'Todos' ? 'Todos los Países' : selectedCountry}
                        </span>
                        <div className="custom-select-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                    </div>
                    <select
                        style={{ display: 'none' }}
                        className="native-select"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                        {countries.map(c => <option key={c} value={c}>{c === 'Todos' ? 'Todos los Países' : c}</option>)}
                    </select>
                    <div className="custom-select-options">
                        {countries.map(c => (
                            <div key={c} className={`custom-select-option ${selectedCountry === c ? 'selected' : ''}`} data-value={c}>
                                {c === 'Todos' ? 'Todos los Países' : c}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid wrapper with huge top padding on mobile to push cards down from filters */}
            <div className="w-full relative z-0 mt-8 pt-20 px-4 md:px-0 md:pt-16">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-32 gap-x-4 md:gap-x-8 md:gap-y-48">
                    {filteredPlayers.map((player, index) => (
                        <div key={player.id_jugadora || player.slug} className="relative pt-16 pb-6 md:pt-24 md:pb-8 h-full flex flex-col">
                            <a
                                href={`/jugadoras/${player.slug}`}
                                className="group block relative w-full h-full text-decoration-none group mt-auto"
                            >
                                {/* Card Background */}
                                <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-br from-[#1d274e] to-[#151e42] rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-white/5 group-hover:border-[#ffde59]/50 transition-all duration-500 z-0" />
                                
                                {/* Image Overlay */}
                                <div className="absolute -top-16 md:-top-24 inset-x-0 bottom-[60%] z-10 px-2 md:px-6 pointer-events-none">
                                    <div className="w-full h-full relative flex items-end justify-center">
                                        <img
                                            src={player.thumbnailUrl || player.imageUrl}
                                            alt={player.nombre}
                                            className="w-auto h-auto max-h-[160%] object-contain transform origin-bottom transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-4 filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]"
                                            loading={index < 8 ? "eager" : "lazy"}
                                            decoding="async"
                                            width={400}
                                            height={500}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/assets/jugadoras-perfil/placeholder.png';
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="relative pt-16 md:pt-28 pb-4 md:pb-8 px-4 md:px-8 z-20 flex flex-col h-full items-center text-center">
                                    <div className="mb-2 md:mb-4">
                                        <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-white group-hover:bg-[#ffde59] group-hover:text-black transition-colors">
                                            {player.posicion}
                                        </span>
                                    </div>

                                    <h3 className="text-xl md:text-3xl font-black font-bebas text-white uppercase tracking-wider mb-2 leading-none group-hover:text-[#ffde59] transition-colors drop-shadow-lg break-words text-balance text-center w-full mt-2">
                                        {player.nombre}
                                    </h3>

                                    <div className="flex items-center justify-center gap-2 mt-auto pb-4">
                                        <img
                                            src={player.flagUrl}
                                            alt={player.countryName}
                                            className="w-4 md:w-5 h-auto object-cover shadow-sm"
                                            loading="lazy"
                                            decoding="async"
                                            width={24}
                                            height={24}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        <span className="text-[10px] md:text-sm font-medium text-gray-300 uppercase tracking-widest">{player.countryName}</span>
                                    </div>

                                    <div className="w-full mt-4 pt-4 border-t border-white/10 flex justify-end group-hover:border-white/20 transition-all">
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#ffde59] flex items-center gap-1 transition-colors group-hover:text-white">
                                            Ver Perfil <span className="text-lg">→</span>
                                        </span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {filteredPlayers.length === 0 && (
                <div className="text-center py-40 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 mt-20 w-full">
                    <p className="text-gray-500 text-3xl font-black font-bebas tracking-[0.2em] uppercase">No hay resultados</p>
                    <button 
                        onClick={() => { setSelectedPosition('Todas'); setSelectedCountry('Todos'); setSelectedSeason('Todas'); }}
                        className="mt-8 px-8 py-3 bg-[#ffde59] text-black font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all"
                    >
                        Reiniciar filtros
                    </button>
                </div>
            )}
        </div>
    );
};

export default PlayersGrid;
