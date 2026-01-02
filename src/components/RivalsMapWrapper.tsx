
import React, { useMemo } from 'react';
import InteractiveMap, { type MapMarker } from './Map'; // Reuse existing Map component
import { TEAMS } from '../../public/consts/rivals';
import { getCoordinates } from '../consts/location-data';

interface RivalsMapWrapperProps {
    matches: any[]; // We might need matches to count stats per city? Or we can just use the TEAMS list + aggregated stats passed down?
    // Actually, passing matches allows us to recount valid matches if needed.
    // However, TEAMS list has the location info.
}

// We need to map TEAMS country codes to names for the popup or rely on what we have.
// Let's rely on TEAMS data + matches for stats.

const RivalsMapWrapper: React.FC<RivalsMapWrapperProps> = ({ matches }) => {

    // Aggregate data by City/Location
    const markers = useMemo(() => {
        const cityMap = new Map<string, {
            lat: number;
            lng: number;
            label: string;
            countryCode: string;
            teams: Array<{ name: string; id: string; wins: number; matches: number }>;
        }>();

        // 1. Process matches to get stats per team
        const teamStats = new Map<string, { wins: number; matches: number }>();
        matches.forEach(m => {
            const isHome = m.club_local === 'Real Madrid' || m.club_local === 'CD Tacón';
            const rivalName = isHome ? m.club_visitante : m.club_local;
            if (!rivalName || rivalName === 'Real Madrid') return;

            // Normalize name slightly? TEAMS uses exact names usually.
            // Let's just track by name string found in DB.
            const stats = teamStats.get(rivalName) || { wins: 0, matches: 0 };
            stats.matches += 1;

            const goalsRM = isHome ? m.goles_rm : m.goles_rival;
            const goalsRival = isHome ? m.goles_rival : m.goles_rm;
            if (Number(goalsRM) > Number(goalsRival)) stats.wins += 1;

            teamStats.set(rivalName, stats);
        });

        // 2. Map TEAMS to Cities
        TEAMS.forEach(team => {
            // Skip if no location? All TEAMS have city.
            // We need coordinates for the city.
            // Use getCoordinates with city name.
            const cityCoords = getCoordinates(team.city, 'city');

            if (cityCoords) {
                const key = `${cityCoords.lat}-${cityCoords.lng}`; // Unique location key
                const existing = cityMap.get(key) || {
                    lat: cityCoords.lat,
                    lng: cityCoords.lng,
                    label: team.city, // City name
                    countryCode: team.country,
                    teams: []
                };

                const stats = teamStats.get(team.name) || { wins: 0, matches: 0 };

                existing.teams.push({
                    name: team.name,
                    id: team.id,
                    wins: stats.wins,
                    matches: stats.matches
                });

                // If multiple teams, label could be "London (Arsenal, Chelsea...)" or just "London"
                // Let's keep label as City.
                cityMap.set(key, existing);
            }
        });

        return Array.from(cityMap.values()).map(city => ({
            lat: city.lat,
            lng: city.lng,
            label: city.label,
            type: 'rival-city' as const, // Custom type we'll handle in Map.tsx? Or reuse 'stadium'? 
            // Reuse 'match' type partially or add new one? 
            // Map.tsx currently handles 'player', 'match' (stadium), 'standard'.
            // Use 'match' type but override image with flag?
            // Actually Map.tsx expects `imageUrl`.
            imageUrl: `https://flagcdn.com/w80/${city.countryCode}.png`, // Flag as marker image
            description: `Equipos: ${city.teams.map(t => t.name).join(', ')}`,
            data: {
                teams: city.teams,
                countryCode: city.countryCode
            }
        }));
    }, [matches]);

    return (
        <div className="w-full my-12">
            <h2 className="text-2xl font-bold mb-4 font-bebas text-[#151e42] border-l-4 border-[#ffde59] pl-3">
                MAPA DE RIVALES
            </h2>
            <InteractiveMap
                markers={markers}
                height="600px"
                center={{ lat: 48, lng: 10 }} // Europe focus
                zoom={3.5}
            />
        </div>
    );
};

export default RivalsMapWrapper;
