
import React, { useMemo } from 'react';
import InteractiveMap, { type MapMarker } from './Map';
import { TEAMS } from '../../public/consts/rivals';
import { getCoordinates } from '../consts/location-data';
import { getFlagCdnCode } from '../utils/flags';

interface RivalsMapWrapperProps {
    matches: any[];
    rivalShields?: Record<string, string>;
}

const RivalsMapWrapper: React.FC<RivalsMapWrapperProps> = ({ matches, rivalShields = {} }) => {

    const markers = useMemo(() => {
        const cityMap = new Map<string, {
            lat: number;
            lng: number;
            label: string;
            countryCode: string;
            teams: Array<{
                name: string;
                id: string;
                wins: number;
                draws: number;
                losses: number;
                matches: number;
                shieldUrl?: string
            }>;
        }>();

        const teamStats = new Map<string, { wins: number; draws: number; losses: number; matches: number }>();

        matches.forEach(m => {
            const isHome = m.club_local === 'Real Madrid' || m.club_local === 'CD Tacón';
            const rivalName = isHome ? m.club_visitante : m.club_local;
            if (!rivalName || rivalName === 'Real Madrid') return;

            const stats = teamStats.get(rivalName) || { wins: 0, draws: 0, losses: 0, matches: 0 };
            stats.matches += 1;

            const goalsRM = Number(isHome ? m.goles_rm : m.goles_rival);
            const goalsRival = Number(isHome ? m.goles_rival : m.goles_rm);

            if (goalsRM > goalsRival) {
                stats.wins += 1;
            } else if (goalsRM < goalsRival) {
                stats.losses += 1;
            } else {
                const pen = m.penaltis;
                if ((pen === '1' || pen === 1) && goalsRM === goalsRival) {
                    stats.wins += 1;
                } else if ((pen === '0' || pen === 0) && goalsRM === goalsRival) {
                    stats.losses += 1;
                } else {
                    stats.draws += 1;
                }
            }

            teamStats.set(rivalName, stats);
        });

        TEAMS.forEach(team => {
            const cityCoords = getCoordinates(team.city, 'city');

            if (cityCoords) {
                const key = `${cityCoords.lat}-${cityCoords.lng}`;
                const existing = cityMap.get(key) || {
                    lat: cityCoords.lat,
                    lng: cityCoords.lng,
                    label: team.city,
                    countryCode: team.country,
                    teams: []
                };

                const stats = teamStats.get(team.name) || { wins: 0, draws: 0, losses: 0, matches: 0 };

                existing.teams.push({
                    name: team.name,
                    id: team.id,
                    wins: stats.wins,
                    draws: stats.draws,
                    losses: stats.losses,
                    matches: stats.matches,
                    shieldUrl: rivalShields[team.id] || ''
                });

                cityMap.set(key, existing);
            }
        });

        return Array.from(cityMap.values()).map(city => ({
            lat: city.lat,
            lng: city.lng,
            label: city.label,
            type: 'rival-city' as const,
            imageUrl: `https://flagcdn.com/w80/${getFlagCdnCode(city.countryCode)}.png`,
            description: `Equipos: ${city.teams.map(t => t.name).join(', ')}`,
            data: {
                teams: city.teams,
                countryCode: city.countryCode
            }
        }));
    }, [matches, rivalShields]);

    return (
        <div className="w-full my-12 pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold mb-6 font-bebas text-[#151e42] border-l-4 border-[#ffde59] pl-3 uppercase tracking-wider">
                Mapa de Rivales
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
