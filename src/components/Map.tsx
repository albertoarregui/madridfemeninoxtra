import React, { useMemo, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Info, Users, Trophy, Calendar } from 'lucide-react';

export interface MapMarker {
    lat: number;
    lng: number;
    label: string;
    description?: string;
    type?: 'player' | 'match' | 'stadium' | 'rival-city';
    imageUrl?: string;
    slug?: string;
    data?: any;
}

interface InteractiveMapProps {
    markers: MapMarker[];
    center?: { lat: number; lng: number };
    zoom?: number;
    height?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
    markers,
    center = { lat: 40.4168, lng: -3.7038 },
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
                        {marker.imageUrl ? (
                            <div style={{ width:'44px', height:'44px', borderRadius:'50%', border:'2px solid rgba(212,168,67,0.7)', boxShadow:'0 0 12px rgba(212,168,67,0.3)', overflow:'hidden', background:'#06080f', transition:'transform 0.2s, box-shadow 0.2s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='scale(1.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 0 20px rgba(212,168,67,0.6)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='scale(1)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 0 12px rgba(212,168,67,0.3)'; }}
                            >
                                <img src={marker.imageUrl} alt={marker.label} style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'bottom center' }} />
                            </div>
                        ) : (
                            <div className="hover:scale-110 transition-transform">
                                <MapPin className="w-7 h-7 drop-shadow-md" style={{ color:'#d4a843', fill:'rgba(212,168,67,0.4)' }} />
                            </div>
                        )}

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

            <style>{`
                .custom-popup .maplibregl-popup-content {
                    padding: 0 !important;
                    border-radius: 4px !important;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;
                    border: 1px solid rgba(212,168,67,0.25) !important;
                    background: transparent !important;
                }
                .custom-popup .maplibregl-popup-tip {
                    border-top-color: rgba(8,16,34,0.97) !important;
                    border-bottom-color: rgba(8,16,34,0.97) !important;
                }
            `}</style>

            <Map
                initialViewState={{
                    longitude: center.lng,
                    latitude: center.lat,
                    zoom: zoom
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
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
                        closeButton={false}
                        className="custom-popup"
                        maxWidth="320px"
                    >
                        <div style={{ minWidth:'260px', maxWidth:'90vw', background:'rgba(8,16,34,0.97)', borderRadius:'4px', overflow:'hidden', fontFamily:"'DM Sans', sans-serif" }}>

                            <button
                                onClick={(e) => { e.stopPropagation(); setPopupInfo(null); }}
                                style={{ position:'absolute', top:'0.6rem', right:'0.6rem', zIndex:10, background:'transparent', border:'none', cursor:'pointer', color:'rgba(200,210,220,0.5)', padding:'4px', lineHeight:1 }}
                                aria-label="Cerrar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                            </button>

                            {popupInfo.type === 'player' && (
                                <div style={{ display:'flex', flexDirection:'column' }}>
                                    <div style={{ width:'100%', height:'200px', background:'#060d1c', position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'center', overflow:'hidden' }}>
                                        <img
                                            src={popupInfo.imageUrl}
                                            alt={popupInfo.label}
                                            style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'bottom center' }}
                                        />
                                        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(to top, rgba(8,16,34,0.98) 0%, rgba(8,16,34,0.6) 50%, transparent 100%)', padding:'2rem 1rem 0.75rem', textAlign:'center' }}>
                                            <span style={{ color:'#f0f0f0', fontFamily:"'Cinzel', serif", fontSize:'1.1rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', display:'block', lineHeight:1.1 }}>{popupInfo.label}</span>
                                        </div>
                                    </div>
                                    <div style={{ padding:'0.85rem 1rem 1rem', background:'rgba(8,16,34,0.97)' }}>
                                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.9rem', textAlign:'center' }}>
                                            <div>
                                                <span style={{ display:'block', fontFamily:"'Cinzel', serif", fontSize:'0.48rem', letterSpacing:'0.16em', color:'rgba(212,168,67,0.55)', textTransform:'uppercase', marginBottom:'0.25rem' }}>Posición</span>
                                                <span style={{ color:'rgba(200,210,220,0.85)', fontSize:'0.75rem' }}>{popupInfo.data?.posicion || '-'}</span>
                                            </div>
                                            <div>
                                                <span style={{ display:'block', fontFamily:"'Cinzel', serif", fontSize:'0.48rem', letterSpacing:'0.16em', color:'rgba(212,168,67,0.55)', textTransform:'uppercase', marginBottom:'0.25rem' }}>Origen</span>
                                                <span style={{ color:'rgba(200,210,220,0.85)', fontSize:'0.75rem' }}>{popupInfo.description?.replace('Nacida en ', '') || '-'}</span>
                                            </div>
                                        </div>

                                        <a
                                            href={popupInfo.slug}
                                            style={{ display:'block', width:'100%', textAlign:'center', background:'rgba(212,168,67,0.1)', border:'1px solid rgba(212,168,67,0.35)', color:'#d4a843', fontFamily:"'Cinzel', serif", fontSize:'0.55rem', letterSpacing:'0.18em', textTransform:'uppercase', padding:'0.55rem 1rem', borderRadius:'2px', textDecoration:'none', transition:'background 0.2s', boxSizing:'border-box' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.2)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.1)')}
                                        >
                                            Ver Ficha Completa
                                        </a>
                                    </div>
                                </div>
                            )}



                            {popupInfo.type === 'match' && (
                                <div className="flex flex-col">

                                    {popupInfo.imageUrl && (
                                        <div className="w-full h-40 bg-gray-200 relative">
                                            <img
                                                src={popupInfo.imageUrl}
                                                alt={`Estadio ${popupInfo.label}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40"></div>
                                            <div className="absolute bottom-2 left-3 right-3 text-white">

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


                            {popupInfo.type === 'stadium' && (
                                <div className="flex flex-col">

                                    {popupInfo.imageUrl && (
                                        <div className="w-full h-48 bg-gray-200 relative">
                                            <img
                                                src={popupInfo.imageUrl}
                                                alt={popupInfo.label}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 right-3 text-white">
                                                <h3 className="font-bebas text-2xl leading-tight drop-shadow-lg font-bold">
                                                    {popupInfo.label}
                                                </h3>
                                                {popupInfo.description && (
                                                    <p className="text-sm opacity-90 mt-1">{popupInfo.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 bg-white">
                                        {!popupInfo.imageUrl && (
                                            <>
                                                <h3 className="font-bebas text-2xl mb-2 font-bold text-[#151e42]">
                                                    {popupInfo.label}
                                                </h3>
                                                {popupInfo.description && (
                                                    <p className="text-sm text-gray-600 mb-3">{popupInfo.description}</p>
                                                )}
                                            </>
                                        )}

                                        {popupInfo.data?.capacity && (
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Capacidad</span>
                                                <span className="text-lg font-bold text-[#151e42]">{popupInfo.data.capacity.toLocaleString()}</span>
                                            </div>
                                        )}

                                        <a
                                            href={popupInfo.slug}
                                            className="block w-full text-center bg-[#ffde59] hover:bg-[#ffe57f] text-[#151e42] font-bold py-3 rounded shadow-sm hover:shadow-md transition-all uppercase tracking-wide text-sm"
                                        >
                                            Ver Estadio
                                        </a>
                                    </div>
                                </div>
                            )}


                            {popupInfo.type === 'rival-city' && (
                                <div className="p-0 min-w-[260px]">
                                    <div className="bg-[#ffde59] text-[#151e42] p-3 pr-10 rounded-t-lg relative flex items-center justify-center gap-3">
                                        <img src={popupInfo.imageUrl} className="w-6 h-auto rounded shadow-sm" alt={popupInfo.label} />
                                        <h3 className="font-bebas text-xl font-bold tracking-wide">{popupInfo.label}</h3>
                                    </div>
                                    <div className="p-3 bg-white max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {popupInfo.data?.teams?.map((team: any, idx: number) => (
                                            <div key={idx} className="mb-3 last:mb-0 bg-white rounded-lg border border-gray-100 shadow-sm p-3 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                                        {team.shieldUrl ? (
                                                            <img src={team.shieldUrl} alt={team.name} className="w-full h-full object-contain drop-shadow-sm" />
                                                        ) : (
                                                            <span className="text-[8px] font-bold text-gray-300">LOGO</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-[#151e42] leading-tight text-sm">{team.name}</h4>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{team.matches} partidos</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-0 mb-3 text-center bg-gray-50 rounded-md py-2 px-1 border border-gray-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-green-600 font-black text-sm">{team.wins}</span>
                                                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Vic</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-gray-200">
                                                        <span className="text-yellow-600 font-black text-sm">{team.draws}</span>
                                                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Emp</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-gray-200">
                                                        <span className="text-red-600 font-black text-sm">{team.losses}</span>
                                                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Der</span>
                                                    </div>
                                                </div>

                                                <a
                                                    href={`/rivales/${team.id || '#'}`}
                                                    className="block w-full text-center py-3 px-4 rounded-full transition-all font-bold text-sm uppercase tracking-wide"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                                                        color: '#000',
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                                    }}
                                                >
                                                    Ver Historial
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}


                            {!['player', 'match', 'rival-city'].includes(popupInfo.type || '') && (
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
                .maplibregl-popup-close-button {
                    background: transparent;
                    border: none;
                    font-size: 20px;
                    padding: 5px 10px;
                    color: #2b2b2b;
                    right: 0;
                    top: 0;
                    z-index: 10;
                    outline: none;
                    cursor: pointer;
                }
                .maplibregl-popup-close-button:hover {
                    color: #ffde59;
                    background: transparent;
                }
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


