import React, { useMemo } from 'react';
import InteractiveMap from './Map';
import { getCoordinates, getCompetitionLogo } from '../consts/location-data';
import { getAssetUrl } from '../utils/assets';

interface Match {
    id_partido: string;
    club_local: string;
    club_visitante: string;
    estadio?: string;
    ciudad?: string;
    slug: string;
    fecha_formateada: string;
    competicion_nombre: string;
    [key: string]: any;
}

interface MatchMapWrapperProps {
    matches: Match[];
}

const MatchMapWrapper: React.FC<MatchMapWrapperProps> = ({ matches }) => {
    const markers = useMemo(() => {


        const locationMap = new Map<string, {
            lat: number;
            lng: number;
            label: string;
            imageUrl?: string;
            count: number;
            lastMatch: string;
            matches: Match[];
        }>();

        matches.forEach(match => {

            let locationName = match.estadio || match.ciudad;


            if (!locationName && match.club_visitante === 'Real Madrid') {
                locationName = match.club_local;
            } else if (!locationName && match.club_local === 'Real Madrid') {
                locationName = 'Madrid';
            }

            if (!locationName) return;

            const coords = getCoordinates(locationName, 'stadium');

            if (coords) {
                const key = `${coords.lat},${coords.lng}`;

                if (!locationMap.has(key)) {
                    locationMap.set(key, {
                        lat: coords.lat,
                        lng: coords.lng,
                        label: coords.label || locationName,
                        imageUrl: getAssetUrl('estadios', coords.imageUrl),
                        count: 0,
                        lastMatch: '',
                        matches: []
                    });
                }

                const entry = locationMap.get(key)!;
                entry.count++;
                entry.matches.push(match);
            }
        });

        return Array.from(locationMap.values()).map(loc => {

            const sortedMatches = loc.matches.sort((a, b) => {
                const dateA = new Date(a.fecha || 0).getTime();
                const dateB = new Date(b.fecha || 0).getTime();
                return dateB - dateA;
            });


            const matchesWithLogos = sortedMatches.map(m => ({
                ...m,
                logo_competicion: getCompetitionLogo(m.competicion_nombre)
            }));

            return {
                lat: loc.lat,
                lng: loc.lng,
                label: loc.label,
                description: `Se han jugado ${loc.count} partidos aquí.`,
                type: 'match' as const,
                imageUrl: loc.imageUrl,
                data: {
                    count: loc.count,
                    matches: matchesWithLogos
                }
            };
        });
    }, [matches]);

    return (
        <div className="w-full my-8">
            <h2 className="text-2xl font-bold mb-4 font-bebas text-[#151e42] border-l-4 border-[#ffde59] pl-3">
                MAPA DE PARTIDOS
            </h2>
            <InteractiveMap
                markers={markers}
                height="600px"
                center={{ lat: 40, lng: -3 }}
                zoom={4}
            />
        </div>
    );
};

export default MatchMapWrapper;
