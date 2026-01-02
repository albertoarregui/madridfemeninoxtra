import React, { useMemo, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Info, Users, Trophy, Calendar } from 'lucide-react';

export interface MapMarker {
    lat: number;
    lng: number;
    label: string;
    description?: string;
    type?: 'player' | 'match' | 'stadium';
    imageUrl?: string;
    slug?: string;
    data?: any; // Holds specific data for the popup
}

interface InteractiveMapProps {
    markers: MapMarker[];
    center?: { lat: number; lng: number };
    zoom?: number;
    height?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
    markers,
    center = { lat: 40.4168, lng: -3.7038 }, // Madrid default
    zoom = 3,
    height = "500px"
}) => {
    const [popupInfo, setPopupInfo] = useState<MapMarker | null>(null);

    const pins = useMemo(
        () =>
            markers.map((marker, index) => (
                <Marker
                    key={`marker-${index}`}
                    longitude={marker.lng}
                    latitude={marker.lat}
                    anchor="bottom"
                    onClick={e => {
                        e.originalEvent.stopPropagation();
                        setPopupInfo(marker);
                    }}
                >
                    <div className="cursor-pointer group relative">
                        {marker.type === 'match' && marker.imageUrl ? (
                            // Rectangular marker for stadiums with image
                            <div className="w-16 h-12 rounded border-2 border-white shadow-lg overflow-hidden bg-white hover:scale-110 transition-transform">
                                <img src={marker.imageUrl} alt={marker.label} className="w-full h-full object-cover" />
                            </div>
                        ) : marker.imageUrl ? (
                            // Round marker for players - Larger and top aligned
                            <div className="w-14 h-14 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white hover:scale-110 transition-transform">
                                <img src={marker.imageUrl} alt={marker.label} className="w-full h-full object-cover object-top" />
                            </div>
                        ) : marker.type === 'rival-city' ? (
                            // Flag marker for rivals - Circular with flag
                            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-white hover:scale-110 transition-transform flex items-center justify-center">
                                <img src={marker.imageUrl} alt={marker.label} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="hover:scale-110 transition-transform">
                                <MapPin
                                    className={`w-8 h-8 drop-shadow-md ${marker.type === 'match' ? 'text-blue-500 fill-blue-500' : 'text-red-500 fill-red-500'
                                        }`}
                                />
                            </div>
                        )}
                        {/* Tooltip on hover */}
                        <span className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                            {marker.label}
                        </span>
                    </div>
                </Marker>
            )),
        [markers]
    );

    return (
        <div style={{ height: height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative' }}>
            {/* ... styles ... */}
            <style>{`
                .custom-popup .maplibregl-popup-content {
                    padding: 0 !important;
                    border-radius: 0.5rem !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
                    border: none !important;
                    background: transparent !important; /* Ensure no white bg bleeds */
                }
                .custom-popup .maplibregl-popup-tip {
                    border-bottom-color: white !important; /* Match card bg */
                }
            `}</style>

            <Map
                // ... props ...
                initialViewState={{
                    longitude: center.lng,
                    latitude: center.lat,
                    zoom: zoom
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                attributionControl={false}
            >
                <NavigationControl position="top-right" />
                <FullscreenControl position="top-right" />
                <ScaleControl />

                {pins}

                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.lng}
                        latitude={popupInfo.lat}
                        onClose={() => setPopupInfo(null)}
                        closeOnClick={false}
                        closeButton={false} // Disable default close button
                        className="custom-popup"
                        maxWidth="320px"
                    >
                        <div className="relative min-w-[280px] max-w-[90vw] text-[#151e42] bg-white rounded-lg overflow-hidden font-sans shadow-none border-0 ring-0">
                            {/* Custom Close Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPopupInfo(null);
                                }}
                                className="absolute top-2 right-2 z-10 p-1 bg-transparent hover:bg-[#ffde59] rounded-full transition-colors text-white hover:text-[#151e42]"
                                aria-label="Cerrar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                            </button>

                            {/* RIVAL CITY POPUP */}
                            {popupInfo.type === 'rival-city' && (
                                <div>
                                    <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center gap-3">
                                        {/* Big Flag */}
                                        <img src={popupInfo.imageUrl} alt={popupInfo.label} className="w-12 h-auto rounded shadow-sm border border-white" />
                                        <div>
                                            <h3 className="font-bebas text-2xl leading-none text-[#151e42]">{popupInfo.label}</h3>
                                            <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Resumen de rivales</span>
                                        </div>
                                    </div>
                                    <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <div className="flex flex-col gap-3">
                                            {popupInfo.data?.teams && popupInfo.data.teams.map((team: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3">
                                                        {/* Team Shield */}
                                                        <img
                                                            src={`/assets/escudos/${team.id.replace(/-/g, '_')}.png`}
                                                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/escudos/placeholder.png'; }}
                                                            alt={team.name}
                                                            className="w-10 h-10 object-contain"
                                                        />
                                                        <div>
                                                            <span className="block font-bold text-sm text-[#151e42] leading-tight">{team.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">{team.matches} partidos</span>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`/rivales/${team.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-bold text-[#151e42] bg-[#ffde59] hover:bg-[#ffe57f] px-3 py-1.5 rounded-full transition-colors"
                                                    >
                                                        VER
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PLAYER POPUP */}
                            {popupInfo.type === 'player' && (
                                <div className="flex flex-col">
                                    {/* ... existing player popup code ... */}
                                    <div className="w-full h-64 bg-gray-200 relative items-end justify-center flex overflow-hidden">
                                        {/* Contain image so it's not cut off, aligned bottom */}
                                        <img
                                            src={popupInfo.imageUrl}
                                            alt={popupInfo.label}
                                            className="w-full h-full object-contain object-bottom"
                                        />
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 text-center">
                                            <span className="text-white font-bebas text-3xl tracking-wider drop-shadow-md block leading-none font-bold">{popupInfo.label}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 pt-4 bg-white">
                                        <div className="grid grid-cols-2 gap-4 mb-5 text-center">
                                            <div>
                                                <span className="block font-bold text-gray-500 uppercase text-[10px] tracking-widest mb-1">Posición</span>
                                                <span className="font-semibold text-sm">{popupInfo.data?.posicion || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="block font-bold text-gray-500 uppercase text-[10px] tracking-widest mb-1">Nacimiento</span>
                                                <span className="font-semibold text-sm">
                                                    {(() => {
                                                        const dateStr = popupInfo.data?.fecha_nacimiento;
                                                        if (!dateStr) return '-';
                                                        // Assume YYYY-MM-DD from DB
                                                        const parts = dateStr.split('-');
                                                        if (parts.length === 3) {
                                                            const [year, month, day] = parts;
                                                            return `${day}/${month}/${year.slice(-2)}`;
                                                        }
                                                        return dateStr;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block font-bold text-gray-500 uppercase text-[10px] tracking-widest mb-1">Origen</span>
                                                <span className="font-semibold text-sm">{popupInfo.description?.replace('Nacida en ', '')}</span>
                                            </div>
                                        </div>

                                        <a
                                            href={popupInfo.slug}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center bg-[#ffde59] hover:bg-[#ffe57f] text-[#151e42] font-bold py-3 rounded shadow-sm hover:shadow-md transition-all uppercase tracking-wide text-xs"
                                        >
                                            Ver Ficha Completa
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* MATCH POPUP */}
                            {popupInfo.type === 'match' && (
                                <div className="flex flex-col">
                                    {/* Stadium Photo */}
                                    {popupInfo.imageUrl && (
                                        <div className="w-full h-40 bg-gray-200 relative">
                                            <img
                                                src={popupInfo.imageUrl}
                                                alt={`Estadio ${popupInfo.label}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40"></div>
                                            <div className="absolute bottom-2 left-3 right-3 text-white">
                                                {/* Bold Stadium Name */}
                                                <h3 className="font-bebas text-xl leading-tight drop-shadow-md font-bold">
                                                    {popupInfo.label}
                                                </h3>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-3 bg-white">
                                        {!popupInfo.imageUrl && (
                                            <h3 className="font-bebas text-xl mb-3 border-b-2 border-[#ffde59] pb-1 inline-block font-bold">
                                                {popupInfo.label}
                                            </h3>
                                        )}

                                        {popupInfo.data?.matches && popupInfo.data.matches.length > 0 ? (
                                            <div className="max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                                <div className="text-xs text-gray-500 mb-2 italic font-bold flex justify-between items-center px-1">
                                                    <span>{popupInfo.data.count} partidos jugados aquí</span>
                                                </div>

                                                {popupInfo.data.matches.slice(0, 5).map((m: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="mb-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all relative overflow-hidden group border border-gray-100"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase">{m.fecha_formateada}</span>
                                                            {/* Competition Logo */}
                                                            {m.logo_competicion && (
                                                                <img src={m.logo_competicion} alt={m.competicion_nombre} className="h-5 w-auto object-contain" title={m.competicion_nombre} />
                                                            )}
                                                        </div>

                                                        <div className="text-sm font-bold text-[#151e42] mb-3 text-center leading-tight">
                                                            {m.club_local} <span className="text-gray-400 font-normal text-xs px-1">vs</span> {m.club_visitante}
                                                        </div>

                                                        <div className="text-center mb-4">
                                                            {(() => {
                                                                const isRMAway = m.club_visitante === 'Real Madrid' || m.club_visitante === 'CD Tacón';
                                                                const scoreHome = isRMAway ? m.goles_rival : m.goles_rm;
                                                                const scoreAway = isRMAway ? m.goles_rm : m.goles_rival;

                                                                // Color logic remains based on RM result (Win = Green, etc.)
                                                                const isWin = Number(m.goles_rm) > Number(m.goles_rival);
                                                                const isLoss = Number(m.goles_rm) < Number(m.goles_rival);

                                                                return (
                                                                    <span className={`font-mono font-bold text-lg text-[#151e42] px-6 py-1.5 rounded-lg ${isWin ? 'bg-green-100/80 text-green-900' :
                                                                        isLoss ? 'bg-red-100/80 text-red-900' : 'bg-yellow-100/80 text-yellow-900'
                                                                        }`}>
                                                                        {scoreHome} - {scoreAway}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Styled "Ver detalles" button - Full Width Yellow */}
                                                        <a
                                                            href={`/partidos/${m.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block w-full text-center bg-[#ffde59] hover:bg-[#ffe57f] text-[#151e42] font-bold py-2 rounded shadow-sm hover:shadow-md transition-all uppercase tracking-wide text-[10px]"
                                                        >
                                                            Ver detalles
                                                        </a>
                                                    </div>
                                                ))}
                                                {popupInfo.data.matches.length > 5 && (
                                                    <p className="text-center text-xs text-gray-400 mt-2 font-medium">
                                                        ...y {popupInfo.data.matches.length - 5} más
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm italic text-gray-500">Sin información detallada de partidos.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* GENERIC FALLBACK */}
                            {!['player', 'match'].includes(popupInfo.type || '') && (
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-2">{popupInfo.label}</h3>
                                    <p className="text-sm text-gray-600">{popupInfo.description}</p>
                                </div>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
            <div className="absolute bottom-1 right-1 bg-white/50 px-1 text-[10px] text-gray-500 pointer-events-none">
                © OpenStreetMap, © Carto
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ccc; 
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #aaa; 
                }
            `}</style>
        </div>
    );
};

export default InteractiveMap;
