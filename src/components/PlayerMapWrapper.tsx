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


const PLAYER_LOCATION_OVERRIDES: Record<string, string> = {
    'linda-caicedo': 'candelaria',
    'kenti-robles': 'mexico',
    'oihane-hernandez': 'sopelana',
    'andrea-alonso': 'alcorcon',
    'amaya-garcia': 'pozuelo',
    'antonia-silva': 'paudosferros',
    'lotte-keukelaar': 'vleuten',
    'irune-dorado': 'pozuelo',
    'sara-holmgaard': 'ikast',
    'chioma-ubogagu': 'london',
    'chi-obogagu': 'london',
    'mylene-chavas': 'saintecolombe',
    'bella-andersson': 'stockholm',
    'oihane-san-martin': 'pamplona',
    'misa-rodriguez': 'laspalmas',
    'maria-isabel-rodriguez': 'laspalmas',
    'misa': 'laspalmas',
    'sara-lopez': 'laspalmas',
    'nahikari-garcia': 'urnieta',
    'carla-camacho': 'rivasvaciamadrid',
    'paula-partido': 'madrid',
    'andrea-tellez': 'alcorcon',
    'marina-salas': 'madrid',
    'belen-de-gracia': 'madrid',
    'andrea-rodriguez': 'madrid',
    'dana-benitez': 'madrid',
    'clara-villanueva': 'madrid',
    'maria-portoles': 'madrid',
    'noe-llamas': 'jarandilladelavera',
};

const PlayerMapWrapper: React.FC<PlayerMapWrapperProps> = ({ players }) => {
    const markers = useMemo(() => {
        const markerMap = new Map<string, MapMarker>();

        players.forEach(player => {
            let locationName = player.lugar_nacimiento || player.pais_origen;


            if (PLAYER_LOCATION_OVERRIDES[player.slug]) {
                locationName = PLAYER_LOCATION_OVERRIDES[player.slug];
            }

            if (!locationName) return;

            const coords = getCoordinates(locationName, 'city');
            if (coords) {


                const jitterLat = (Math.random() - 0.5) * 0.01;
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
                        fecha_nacimiento: player.fecha_nacimiento
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

                center={{ lat: 48, lng: 10 }}
                zoom={3.5}
            />
        </div>
    );
};

export default PlayerMapWrapper;
