import React, { useMemo } from 'react';
import { getCoordinates } from '../consts/location-data';
import { calculateDistance, MADRID_COORDS } from '../utils/geo';
import { Users, Globe, Flag, Plane } from 'lucide-react';

interface Player {
    nombre: string;
    lugar_nacimiento?: string;
    pais_origen?: string;
    pais_origin?: string; // Handle both typo/naming cases
    imageUrl: string;
    slug: string;
    [key: string]: any;
}

interface PlayerStatsDashboardProps {
    players: Player[];
}

// Map country names (from DB/Data) to SVG filenames in src/assets/banderas/
// DB names might be "España", "Colombia", etc.
// Files are "espana.svg", "colombia.svg", etc.
function getFlagSrc(countryName: string): string {
    if (!countryName) return '';
    const normalize = (str: string) => str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_") // Default to underscore based on file list, will check later
        .replace(/-/g, "_") // Handle if input has hyphens
        .replace(/ñ/g, "n");

    const filename = normalize(countryName);

    // Manual overrides if normalization doesn't match specific filenames
    const map: Record<string, string> = {
        'paises_bajos': 'paises_bajos',
        'republica_checa': 'republica_checa',
        'reino_unido': 'inglaterra', // Common mapping
        'inglaterra': 'inglaterra',
        'escocia': 'escocia'
    };

    const finalName = map[filename] || filename;
    return `/assets/banderas/${finalName}.svg`; // Point to public folder
}

const PlayerStatsDashboard: React.FC<PlayerStatsDashboardProps> = ({ players }) => {
    const stats = useMemo(() => {
        if (!players || players.length === 0) return null;

        // 1. Total Players
        const totalPlayers = players.length;

        // 2. Nationalities
        const nationalities = new Set<string>();
        const countryCounts: Record<string, number> = {};

        // 3. Furthest Country Calculation
        let maxDist = 0;
        let furthestCountryName = '';

        // We need to reliably map player country to coordinates. 
        // Using 'pais_origen' directly. If it's "Alemania", we need coords for "Alemania".
        // getCoordinates handles cities better, but works for countries if in KNOWN_LOCATIONS.
        // Let's iterate unique countries for distance to avoid redundancy.

        players.forEach(p => {
            const country = p.pais_origin || p.pais_origen;
            if (country) {
                nationalities.add(country);
                countryCounts[country] = (countryCounts[country] || 0) + 1;
            }
        });

        // Determine Furthest Country
        Array.from(nationalities).forEach(country => {
            const coords = getCoordinates(country, 'city'); // 'city' type is default but works for generic lookups
            if (coords) {
                const dist = calculateDistance(
                    MADRID_COORDS.lat, MADRID_COORDS.lng,
                    coords.lat, coords.lng
                );
                if (dist > maxDist) {
                    maxDist = dist;
                    furthestCountryName = country;
                }
            }
        });

        // Top 3 Countries
        const sortedCountries = Object.entries(countryCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 3)
            .map(([country, count]) => ({ country, count }));

        return {
            totalPlayers,
            totalNationalities: nationalities.size,
            topCountries: sortedCountries,
            furthestCountryName,
            furthestDistance: Math.round(maxDist)
        };
    }, [players]);

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full max-w-7xl mx-auto">
            {/* Total Players */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-3">
                    <Users size={32} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Jugadoras</p>
                    <p className="text-3xl md:text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.totalPlayers}</p>
                </div>
            </div>

            {/* Nationalities */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                <div className="bg-purple-50 p-3 rounded-full text-purple-600 mb-3">
                    <Globe size={32} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Nº Países Totales</p>
                    <p className="text-3xl md:text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.totalNationalities}</p>
                </div>
            </div>

            {/* Top 3 Countries */}
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
                                src={getFlagSrc(item.country)}
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

            {/* Furthest Country */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                <div className="bg-green-50 p-3 rounded-full text-green-600 mb-3">
                    <Plane size={32} />
                </div>
                <div className="flex flex-col items-center w-full">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 group-hover:text-[#ffde59] transition-colors">País con rep. más lejano</p>
                    <div className="flex flex-col items-center justify-center gap-2">
                        <img
                            src={getFlagSrc(stats.furthestCountryName)}
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
