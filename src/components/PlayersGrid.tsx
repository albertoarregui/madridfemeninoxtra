import React, { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';

interface Player {
    id_jugadora: string;
    nombre: string;
    slug: string;
    imageUrl: string;
    posicion: string;
    pais_origen: string;
    pais_origin?: string;
    cleanCountryName: string;
    temporadas?: string[];
    dorsales?: Record<string, number>; // New field
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

    const getDorsal = (player: Player, season: string) => {
        if (!player.dorsales) return 999;

        if (season !== 'Todas') {
            return player.dorsales[season] || 999;
        } else {
            const keys = Object.keys(player.dorsales).sort().reverse();
            if (keys.length > 0) return player.dorsales[keys[0]];
            return 999;
        }
    };

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

            const dorsalA = getDorsal(a, selectedSeason);
            const dorsalB = getDorsal(b, selectedSeason);

            return dorsalA - dorsalB;
        });

        return sorted;
    }, [players, selectedPosition, selectedCountry, selectedSeason]);

    const getFlagSrc = (country: string) => {
        if (!country) return '';
        const normalized = country.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/ñ/g, 'n')
            .replace(/\s+/g, '_');
        return `/assets/banderas/${normalized}.svg`;
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8" id="players-grid">
            <div className="mb-10 flex flex-col items-center gap-6">
                <div className="flex gap-4 w-full flex-wrap justify-center">
                    <div className="relative inline-block">
                        <select
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                            className="px-6 py-3 pr-10 bg-white border-2 border-[#ffde59] rounded-[25px] text-[#2b2b2b] font-semibold focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 focus:border-[#ffd700] cursor-pointer hover:bg-[#fffef8] transition-all shadow-[0_2px_8px_rgba(255,222,89,0.2)] appearance-none text-center min-w-[220px]"
                        >
                            {seasons.map(s => (
                                <option key={s} value={s} className="bg-white text-[#2b2b2b]">
                                    {s === 'Todas' ? 'Todas las Temporadas' : `${s.replace('-', '/')}`}
                                </option>
                            ))}
                        </select>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]"
                        >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M6 9l6 6l6 -6" />
                        </svg>
                    </div>

                    <div className="relative inline-block">
                        <select
                            value={selectedPosition}
                            onChange={(e) => setSelectedPosition(e.target.value)}
                            className="px-6 py-3 pr-10 bg-white border-2 border-[#ffde59] rounded-[25px] text-[#2b2b2b] font-semibold focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 focus:border-[#ffd700] cursor-pointer hover:bg-[#fffef8] transition-all shadow-[0_2px_8px_rgba(255,222,89,0.2)] appearance-none text-center min-w-[220px]"
                        >
                            {positions.map(pos => (
                                <option key={pos} value={pos} className="bg-white text-[#2b2b2b]">
                                    {pos === 'Todas' ? 'Todas las Posiciones' : pos}
                                </option>
                            ))}
                        </select>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]"
                        >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M6 9l6 6l6 -6" />
                        </svg>
                    </div>

                    <div className="relative inline-block">
                        <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="px-6 py-3 pr-10 bg-white border-2 border-[#ffde59] rounded-[25px] text-[#2b2b2b] font-semibold focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 focus:border-[#ffd700] cursor-pointer hover:bg-[#fffef8] transition-all shadow-[0_2px_8px_rgba(255,222,89,0.2)] appearance-none text-center min-w-[220px]"
                        >
                            {countries.map(c => (
                                <option key={c} value={c} className="bg-white text-[#2b2b2b]">
                                    {c === 'Todos' ? 'Todos los Países' : c}
                                </option>
                            ))}
                        </select>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]"
                        >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M6 9l6 6l6 -6" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-10 pt-4">
                {filteredPlayers.map(player => (
                    <a
                        key={player.id_jugadora || player.slug}
                        href={`/jugadoras/${player.slug}`}
                        className="group relative flex flex-col items-center transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="absolute inset-x-0 bottom-0 top-6 bg-gradient-to-br from-[#1d274e] to-[#151e42] rounded-2xl shadow-lg border border-white/5 group-hover:border-[#ffde59]/50 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,222,89,0.15)] z-0 overflow-hidden" />

                        <div className="w-full h-72 relative z-10 px-4 -mb-12">
                            <div className="w-full h-full relative flex items-end justify-center">
                                <img
                                    src={player.imageUrl}
                                    alt={player.nombre}
                                    className="w-full h-full object-cover object-top transform origin-bottom transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2 rounded-t-2xl"
                                    loading="lazy"
                                    decoding="async"
                                    width={400}
                                    height={500}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/assets/jugadoras-perfil/placeholder.png'; // Fallback
                                    }}
                                />
                            </div>
                        </div>

                        <div className="w-full p-5 relative z-20 mt-12">
                            <div className="absolute -top-6 left-6 z-20">
                                <span className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider text-white group-hover:bg-[#ffde59] group-hover:text-black transition-colors">
                                    {player.posicion}
                                </span>
                            </div>

                            <div className="flex items-start justify-between mb-2 mt-2">
                                <h3 className="text-xl font-black font-bebas text-white uppercase tracking-wide group-hover:text-[#ffde59] transition-colors leading-none truncate w-full">
                                    {player.nombre}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                <img
                                    src={getFlagSrc(player.pais_origin || player.pais_origen)}
                                    alt={player.pais_origin || player.pais_origen}
                                    className="w-5 h-5 rounded-full object-cover shadow-sm"
                                    loading="lazy"
                                    decoding="async"
                                    width={20}
                                    height={20}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <span className="uppercase">{player.pais_origin || player.pais_origen}</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#ffde59] flex items-center gap-1 transition-colors group-hover:text-white">
                                    Ver Perfil <span className="text-lg">→</span>
                                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {filteredPlayers.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-gray-400 text-lg">No se encontraron jugadoras con estos filtros.</p>
                </div>
            )}
        </div>
    );
};

export default PlayersGrid;
