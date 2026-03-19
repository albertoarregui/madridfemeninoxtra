import React, { useMemo } from 'react';
import { calculateDistance, MADRID_COORDS } from '../utils/geo';
import { Users, Globe, Flag, Plane } from 'lucide-react';

interface Player {
    nombre: string;
    lugar_nacimiento?: string;
    pais_origen?: string;
    pais_origin?: string;
    imageUrl: string;
    slug: string;
    [key: string]: any;
}

interface PlayerStatsDashboardProps {
    players: Player[];
}

import { getFlagSrc } from '../utils/flags';

const PlayerStatsDashboard: React.FC<PlayerStatsDashboardProps> = ({ players }) => {
    const stats = useMemo(() => {
        if (!players || players.length === 0) return null;

        const totalPlayers = players.length;

        const nationalities = new Set<string>();
        const countryCounts: Record<string, number> = {};

        const countryIsos: Record<string, string> = {};

        let maxDist = 0;
        let furthestCountryName = '';
        let furthestCountryIso = '';

        players.forEach(p => {
            const country = p.pais_origin || p.pais_origen;
            const iso = p.iso;
            if (country) {
                nationalities.add(country);
                countryCounts[country] = (countryCounts[country] || 0) + 1;
                if (iso) countryIsos[country] = iso;

                if (p.lat != null && p.lng != null) {
                    const dist = calculateDistance(
                        MADRID_COORDS.lat, MADRID_COORDS.lng,
                        Number(p.lat), Number(p.lng)
                    );
                    if (dist > maxDist) {
                        maxDist = dist;
                        furthestCountryName = country;
                        furthestCountryIso = iso || '';
                    }
                }
            }
        });

        const sortedCountries = Object.entries(countryCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 3)
            .map(([country, count]) => ({ country, count }));

        return {
            totalPlayers,
            totalNationalities: nationalities.size,
            topCountries: sortedCountries.map(sc => ({ ...sc, iso: countryIsos[sc.country] })),
            furthestCountryName,
            furthestCountryIso,
            furthestDistance: Math.round(maxDist)
        };
    }, [players]);

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full max-w-7xl mx-auto">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-3">
                    <Users size={32} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Jugadoras</p>
                    <p className="text-3xl md:text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.totalPlayers}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                <div className="bg-purple-50 p-3 rounded-full text-purple-600 mb-3">
                    <Globe size={32} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Nº Países Totales</p>
                    <p className="text-3xl md:text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.totalNationalities}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                <div className="flex flex-col items-center justify-center mb-3">
                    <div className="bg-yellow-50 p-1.5 rounded-full text-yellow-600 mb-2">
                        <Flag size={20} />
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider group-hover:text-[#ffde59] transition-colors">Países con más jugadoras</p>
                </div>
                <div className="flex items-start justify-center gap-4 px-2 w-full">
                    {stats.topCountries.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <img
                                src={getFlagSrc(item.iso || item.country)}
                                alt={item.country}
                                className="w-8 h-auto mb-1"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <span className="text-[10px] uppercase font-bold text-gray-400 leading-tight max-w-[60px] truncate">{item.country}</span>
                            <span className="text-lg font-bold text-[#151e42] group-hover:text-[#ffde59] transition-colors">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                <div className="bg-green-50 p-3 rounded-full text-green-600 mb-3">
                    <Plane size={32} />
                </div>
                <div className="flex flex-col items-center w-full">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 group-hover:text-[#ffde59] transition-colors">País con rep. más lejano</p>
                    <div className="flex flex-col items-center justify-center gap-2">
                        <img
                            src={getFlagSrc(stats.furthestCountryIso || stats.furthestCountryName)}
                            alt={stats.furthestCountryName}
                            className="w-10 h-auto"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className="flex flex-col items-center">
                            <p className="text-lg font-black text-[#151e42] leading-tight group-hover:text-[#ffde59] transition-colors">{stats.furthestCountryName}</p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5 group-hover:text-[#ffde59] transition-colors">
                                {stats.furthestDistance.toLocaleString()} km
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerStatsDashboard;


