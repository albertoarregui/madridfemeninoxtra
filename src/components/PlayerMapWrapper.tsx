import React, { useMemo } from 'react';
import InteractiveMap, { type MapMarker } from './Map';
import { getCoordinates } from '../consts/location-data';

interface Player {
    nombre: string;
    lugar_nacimiento?: string;
    pais_origen?: string;
    imageUrl: string;
    slug: string;
    [key: string]: any;
}

interface PlayerMapWrapperProps {
    players: Player[];
}

const PlayerMapWrapper: React.FC<PlayerMapWrapperProps> = ({ players }) => {
    const markers = useMemo(() => {
        const markerMap = new Map<string, MapMarker>();

        players.forEach(player => {
            const locationName = player.lugar_nacimiento || player.pais_origen;
            if (!locationName) return;

            const coords = getCoordinates(locationName, 'city');
            if (coords) {
                // Creates a unique key for the marker based on location + player to allow individual pins
                // Or we can group. Let's create individual pins but maybe slightly offset them if needed?
                // For now, let's just make one marker per player.

                // Better approach for clarity: One marker per city, popup lists players?
                // Or just one marker per player. Let's do marker per player.
                // If coordinates are exact same, they stack.
                // To avoid perfect stacking, we can add a tiny random jitter.

                const jitterLat = (Math.random() - 0.5) * 0.01; // Slightly increased jitter
                const jitterLng = (Math.random() - 0.5) * 0.01;

                markerMap.set(player.slug, {
                    lat: coords.lat + jitterLat,
                    lng: coords.lng + jitterLng,
                    label: player.nombre,
                    description: `Nacida en ${coords.label || locationName}`,
                    type: 'player',
                    imageUrl: player.imageUrl,
                    slug: `/jugadoras/${player.slug}`,
                    data: {
                        posicion: player.posicion,
                        pais: player.pais_origin,
                        fecha_nacimiento: player.fecha_nacimiento // Assuming this field exists in player data
                    }
                });
            }
        });

        return Array.from(markerMap.values());
    }, [players]);

    return (
        <div className="w-full my-8">
            <h2 className="text-2xl font-bold mb-4 font-bebas text-[#151e42] border-l-4 border-[#ffde59] pl-3">
                MAPA DE ORIGEN
            </h2>
            <InteractiveMap
                markers={markers}
                height="600px"
                // Center on Europe roughly
                center={{ lat: 48, lng: 10 }}
                zoom={3.5}
            />
        </div>
    );
};

export default PlayerMapWrapper;
