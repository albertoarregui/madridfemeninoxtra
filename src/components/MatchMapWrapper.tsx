import React, { useMemo } from 'react';
import InteractiveMap from './Map';
import { getCoordinates, getCompetitionLogo } from '../consts/location-data';

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
        // We want unique locations, not unique matches, because 100 matches in Di Stefano is too many pins.
        // We want: Markers for stadiums.
        // Popup shows: "Estadio Alfredo Di Stéfano. Partidos: 50. Último: RM vs Barça..."

        const locationMap = new Map<string, {
            lat: number;
            lng: number;
            label: string;
            count: number;
            lastMatch: string;
            matches: Match[];
        }>();

        matches.forEach(match => {
            // Priority: Stadium -> City -> Visitor Team City (heuristic)
            let locationName = match.estadio || match.ciudad;

            // Heuristic for away games without stadium data: use home team name as location
            if (!locationName && match.club_visitante === 'Real Madrid') {
                locationName = match.club_local;
            } else if (!locationName && match.club_local === 'Real Madrid') {
                locationName = 'Madrid'; // Default to Madrid if playing home
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
            // Sort matches by date descending
            const sortedMatches = loc.matches.sort((a, b) => {
                const dateA = new Date(a.fecha || 0).getTime();
                const dateB = new Date(b.fecha || 0).getTime();
                return dateB - dateA;
            });

            // Add competition logo to each match
            const matchesWithLogos = sortedMatches.map(m => ({
                ...m,
                logo_competicion: getCompetitionLogo(m.competicion_nombre)
            }));

            // Get image url from location data (it was in coords)
            // But we didn't save it in locationMap values.
            // Let's re-retrieve or better yet save it in locationMap value
            const coords = getCoordinates(loc.matches[0].estadio || loc.matches[0].ciudad || '', 'stadium');
            const imageUrl = coords?.imageUrl;

            return {
                lat: loc.lat,
                lng: loc.lng,
                label: loc.label,
                description: `Se han jugado ${loc.count} partidos aquí.`,
                type: 'match' as const,
                imageUrl: imageUrl, // Pass it here
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
