import React, { useMemo } from 'react';
import InteractiveMap, { type MapMarker } from './Map';

interface Player {
    nombre: string;
    lugar_nacimiento?: string;
    pais_origen?: string;
    pais_origin?: string;
    lat?: number | null;
    lng?: number | null;
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
            // Use coordinates from the DB directly
            if (player.lat == null || player.lng == null) return;

            const jitterLat = (Math.random() - 0.5) * 0.01;
            const jitterLng = (Math.random() - 0.5) * 0.01;

            const locationLabel = player.lugar_nacimiento || player.pais_origin || player.pais_origen || '';

            markerMap.set(player.slug, {
                lat: player.lat + jitterLat,
                lng: player.lng + jitterLng,
                label: player.nombre,
                description: locationLabel ? `Nacida en ${locationLabel}` : '',
                type: 'player',
                imageUrl: player.imageUrl,
                slug: `/jugadoras/${player.slug}`,
                data: {
                    posicion: player.posicion,
                    pais: player.pais_origin || player.pais_origen,
                    fecha_nacimiento: player.fecha_nacimiento
                }
            });
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
                center={{ lat: 48, lng: 10 }}
                zoom={3.5}
            />
        </div>
    );
};

export default PlayerMapWrapper;
