import React, { useMemo } from 'react';
import InteractiveMap from './Map';
import { getAssetUrl } from '../utils/assets';

function getCompetitionLogo(name: string): string | null {
    const n = (name || '').toLowerCase().replace(/[^a-z]/g, '');
    if (n.includes('liga')) return '/assets/competiciones/liga_f.png';
    if (n.includes('uwcl') || n.includes('champions')) return '/assets/competiciones/uwcl.png';
    if (n.includes('supercopa')) return '/assets/competiciones/supercopa_de_espana.png';
    if (n.includes('copa')) return '/assets/competiciones/copa_de_la_reina.png';
    return null;
}

interface Match {
    id_partido: string;
    club_local: string;
    club_visitante: string;
    estadio?: string;
    ciudad?: string;
    estadio_lat?: number | null;
    estadio_lng?: number | null;
    estadio_foto_url?: string;
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
            matches: Match[];
        }>();

        matches.forEach(match => {
            if (match.estadio_lat == null || match.estadio_lng == null) return;

            const key = `${match.estadio_lat},${match.estadio_lng}`;
            const label = match.estadio || match.ciudad || '';

            if (!locationMap.has(key)) {
                const rawFoto = match.estadio_foto_url;
                const imageUrl = rawFoto
                    ? (rawFoto.startsWith('http') ? rawFoto : getAssetUrl('estadios', rawFoto))
                    : undefined;

                locationMap.set(key, {
                    lat: match.estadio_lat,
                    lng: match.estadio_lng,
                    label,
                    imageUrl,
                    count: 0,
                    matches: []
                });
            }

            const entry = locationMap.get(key)!;
            entry.count++;
            entry.matches.push(match);
        });

        return Array.from(locationMap.values()).map(loc => {
            const sortedMatches = loc.matches.sort((a, b) => {
                const dateA = new Date(a.fecha || 0).getTime();
                const dateB = new Date(b.fecha || 0).getTime();
                return dateB - dateA;
            });

            const matchesWithLogos = sortedMatches.map(m => ({
                ...m,
                logo_competicion: m.competicion_foto_url || getCompetitionLogo(m.competicion_nombre)
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
