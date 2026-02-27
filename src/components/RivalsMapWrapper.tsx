import React, { useMemo } from 'react';
import InteractiveMap from './Map';
import { getCompetitionLogo } from '../consts/location-data';

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

interface Match {
    id_partido: string;
    club_local: string;
    club_visitante: string;
    estadio?: string;
    ciudad?: string;
    estadio_lat?: number | null;
    estadio_lng?: number | null;
    slug: string;
    fecha_formateada: string;
    competicion_nombre: string;
    competicion_foto_url?: string | null;
    goles_rm: any;
    goles_rival: any;
    [key: string]: any;
}

interface RivalsMapWrapperProps {
    rivals: Rival[];
    matches?: Match[];
}

const RivalsMapWrapper: React.FC<RivalsMapWrapperProps> = ({ rivals, matches = [] }) => {

    // Build a lookup: rival name → {flagUrl, shieldUrl, slug, stats}
    const rivalLookup = useMemo(() => {
        const map = new Map<string, Rival>();
        rivals.forEach(r => {
            map.set(r.nombre.toLowerCase(), r);
        });
        return map;
    }, [rivals]);

    const markers = useMemo(() => {
        // If matches provided, group by location using match coordinates (original behavior)
        if (matches.length > 0) {
            const locationMap = new Map<string, {
                lat: number;
                lng: number;
                label: string;
                flagUrl: string;
                teams: Set<string>;
                teamData: Map<string, {
                    name: string;
                    slug: string;
                    wins: number;
                    draws: number;
                    losses: number;
                    matches: number;
                    shieldUrl: string;
                }>;
                matchList: Match[];
            }>();

            matches.forEach(match => {
                if (match.estadio_lat == null || match.estadio_lng == null) return;
                // Skip Real Madrid home matches for rival map context
                const key = `${match.estadio_lat.toFixed(4)},${match.estadio_lng.toFixed(4)}`;

                // Determine the rival team name
                const isHome = match.club_local === 'Real Madrid' ||
                    match.club_local === 'Real Madrid Femenino' ||
                    match.club_local === 'CD Tacón';
                const rivalName = isHome ? match.club_visitante : match.club_local;

                const rivalData = rivalLookup.get(rivalName.toLowerCase());
                const flagUrl = rivalData?.flagUrl || '';
                const label = match.ciudad || match.estadio || rivalName;

                if (!locationMap.has(key)) {
                    locationMap.set(key, {
                        lat: match.estadio_lat,
                        lng: match.estadio_lng,
                        label,
                        flagUrl,
                        teams: new Set(),
                        teamData: new Map(),
                        matchList: []
                    });
                }

                const entry = locationMap.get(key)!;
                entry.matchList.push(match);

                // Update flag with the one from rivals if we have it
                if (!entry.flagUrl && flagUrl) entry.flagUrl = flagUrl;

                // Track team data
                if (rivalData && !entry.teamData.has(rivalData.nombre)) {
                    entry.teamData.set(rivalData.nombre, {
                        name: rivalData.nombre,
                        slug: rivalData.slug,
                        wins: rivalData.stats?.wins ?? 0,
                        draws: rivalData.stats?.draws ?? 0,
                        losses: rivalData.stats?.losses ?? 0,
                        matches: rivalData.stats?.played ?? 0,
                        shieldUrl: rivalData.shieldUrl || ''
                    });
                }
            });

            return Array.from(locationMap.values())
                .filter(loc => loc.matchList.length > 0)
                .map(loc => {
                    const sortedMatches = [...loc.matchList].sort((a, b) => {
                        return new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime();
                    });
                    const matchesWithLogos = sortedMatches.map(m => ({
                        ...m,
                        logo_competicion: m.competicion_foto_url || getCompetitionLogo(m.competicion_nombre)
                    }));

                    return {
                        lat: loc.lat,
                        lng: loc.lng,
                        label: loc.label,
                        type: 'rival-city' as const,
                        imageUrl: loc.flagUrl || undefined,
                        description: `${loc.matchList.length} partidos jugados aquí`,
                        data: {
                            teams: Array.from(loc.teamData.values()),
                            matches: matchesWithLogos,
                            count: loc.matchList.length
                        }
                    };
                });
        }

        // Fallback: use rivals directly if they have coordinates
        const cityMap = new Map<string, {
            lat: number;
            lng: number;
            label: string;
            flagUrl: string;
            teams: Array<{
                name: string;
                slug: string;
                wins: number;
                draws: number;
                losses: number;
                matches: number;
                shieldUrl: string;
            }>;
        }>();

        rivals.forEach(rival => {
            if (rival.lat == null || rival.lng == null) return;
            const key = `${rival.lat.toFixed(4)},${rival.lng.toFixed(4)}`;
            const label = rival.ciudad || rival.nombre;
            const flagUrl = rival.flagUrl || '';

            if (!cityMap.has(key)) {
                cityMap.set(key, { lat: rival.lat, lng: rival.lng, label, flagUrl, teams: [] });
            }
            cityMap.get(key)!.teams.push({
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
            imageUrl: city.flagUrl || undefined,
            description: `${city.teams.length} equipo(s) en esta ciudad`,
            data: { teams: city.teams }
        }));

    }, [rivals, matches, rivalLookup]);

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
