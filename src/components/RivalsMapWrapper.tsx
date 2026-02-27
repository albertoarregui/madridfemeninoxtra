import React, { useMemo } from 'react';
import InteractiveMap from './Map';
import { getCompetitionLogo } from '../consts/location-data';
import { getFlagCdnCode } from '../utils/flags';

interface Rival {
    nombre: string;
    ciudad?: string;
    pais?: string;
    iso?: string;
    flagUrl?: string;
    slug: string;
    shieldUrl?: string;
    lat?: number | null;
    lng?: number | null;
    stats?: {
        played: number;
        wins: number;
        draws: number;
        losses: number;
    };
    [key: string]: any;
}

interface RivalsMapWrapperProps {
    rivals: Rival[];
}

const RivalsMapWrapper: React.FC<RivalsMapWrapperProps> = ({ rivals }) => {

    const markers = useMemo(() => {
        // Group rivals by coordinates (some cities have multiple clubs)
        const cityMap = new Map<string, {
            lat: number;
            lng: number;
            label: string;
            flagUrl: string;
            countryCode: string;
            teams: Array<{
                name: string;
                slug: string;
                wins: number;
                draws: number;
                losses: number;
                matches: number;
                shieldUrl?: string;
            }>;
        }>();

        rivals.forEach(rival => {
            if (rival.lat == null || rival.lng == null) return;

            const key = `${rival.lat.toFixed(4)},${rival.lng.toFixed(4)}`;
            const isoCode = rival.iso || '';
            const flagUrl = rival.flagUrl || (isoCode ? `https://flagcdn.com/w80/${getFlagCdnCode(isoCode)}.png` : '');
            const label = rival.ciudad || rival.nombre;

            if (!cityMap.has(key)) {
                cityMap.set(key, {
                    lat: rival.lat,
                    lng: rival.lng,
                    label,
                    flagUrl,
                    countryCode: isoCode,
                    teams: []
                });
            }

            const entry = cityMap.get(key)!;
            entry.teams.push({
                name: rival.nombre,
                slug: rival.slug,
                wins: rival.stats?.wins ?? 0,
                draws: rival.stats?.draws ?? 0,
                losses: rival.stats?.losses ?? 0,
                matches: rival.stats?.played ?? 0,
                shieldUrl: rival.shieldUrl || ''
            });
        });

        return Array.from(cityMap.values()).map(city => ({
            lat: city.lat,
            lng: city.lng,
            label: city.label,
            type: 'rival-city' as const,
            imageUrl: city.flagUrl,
            description: `Equipos: ${city.teams.map(t => t.name).join(', ')}`,
            data: {
                teams: city.teams,
                countryCode: city.countryCode
            }
        }));
    }, [rivals]);

    return (
        <div className="w-full my-8">
            <h2 className="text-2xl font-bold mb-4 font-bebas text-[#151e42] border-l-4 border-[#ffde59] pl-3">
                MAPA DE RIVALES
            </h2>
            <InteractiveMap
                markers={markers}
                height="600px"
                center={{ lat: 43, lng: -3 }}
                zoom={4.5}
            />
        </div>
    );
};

export default RivalsMapWrapper;
