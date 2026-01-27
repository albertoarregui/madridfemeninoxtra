
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
            const isHome = m.club_local === 'Real Madrid' || m.club_local === 'Real Madrid Femenino' || m.club_local === 'CD Tacón';
            const rivalName = isHome ? m.club_visitante : m.club_local;
            if (!rivalName || rivalName === 'Real Madrid') return;

            const stats = teamStats.get(rivalName) || { wins: 0, draws: 0, losses: 0, matches: 0 };
            stats.matches += 1;

            // goles_rm and goles_rival are ALREADY correct in the database
            // No need to swap based on isHome
            const goalsRM = parseInt(m.goles_rm) || 0;
            const goalsRival = parseInt(m.goles_rival) || 0;

            if (goalsRM > goalsRival) {
                stats.wins += 1;
            } else if (goalsRM < goalsRival) {
                stats.losses += 1;
            } else {
                // Draw in regular time, check penalties
                const penalties = m.penaltis;
                if (penalties === 1 || penalties === '1') {
                    stats.wins += 1;
                } else if (penalties === 0 || penalties === '0') {
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

            <InteractiveMap
                markers={markers}
                height="600px"
                center={{ lat: 48, lng: 10 }}
                zoom={3.5}
            />
        </div>
    );
};

export default RivalsMapWrapper;
