import React, { useMemo } from 'react';
import InteractiveMap, { type MapMarker } from './Map';

interface StadiumsMapWrapperProps {
    stadiums: any[];
}

const StadiumsMapWrapper: React.FC<StadiumsMapWrapperProps> = ({ stadiums }) => {
    const markers: MapMarker[] = useMemo(() => {
        return stadiums
            .filter(stadium => stadium.coordinates?.lat && stadium.coordinates?.lng)
            .map(stadium => ({
                lat: stadium.coordinates.lat,
                lng: stadium.coordinates.lng,
                label: stadium.name,
                description: stadium.city || '',
                type: 'stadium' as const,
                imageUrl: stadium.imageUrl || undefined,
                slug: `/estadios/${stadium.slug}`,
                data: {
                    name: stadium.name,
                    city: stadium.city,
                    capacity: stadium.capacity
                }
            }));
    }, [stadiums]);

    return (
        <div className="mb-12">
            <InteractiveMap
                markers={markers}
                center={{ lat: 40.4168, lng: -3.7038 }}
                zoom={5}
                height="600px"
            />
        </div>
    );
};

export default StadiumsMapWrapper;


