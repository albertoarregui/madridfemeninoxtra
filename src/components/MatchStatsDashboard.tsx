import React, { useMemo } from 'react';
import { calculateDistance, estimateTravelTime, MADRID_COORDS } from '../utils/geo';
import { MapPin, Navigation, Clock, Calendar } from 'lucide-react';

interface Match {
    temporada_nombre: string;
    club_local: string;
    club_visitante: string;
    [key: string]: any;
}

interface MatchStatsDashboardProps {
    matches: Match[];
}

const MatchStatsDashboard: React.FC<MatchStatsDashboardProps> = ({ matches }) => {
    const stats = useMemo(() => {
        if (!matches || matches.length === 0) return null;

        const seasonStats: Record<string, { trips: number; km: number; hours: number }> = {};

        let totalTrips = 0;
        let totalKm = 0;
        let totalHours = 0;

        matches.forEach(m => {
            const season = m.temporada_nombre || 'Desconocida';
            if (!seasonStats[season]) {
                seasonStats[season] = { trips: 0, km: 0, hours: 0 };
            }

            const localName = (m.club_local || '').toLowerCase().replace(/\s/g, '');
            const isHomeGame = localName.includes('realmadrid') ||
                localName.includes('tacon') ||
                (m.estadio || '').toLowerCase().includes('alfredo') ||
                (m.estadio || '').toLowerCase().includes('ciudad real madrid');

            if (!isHomeGame && m.estadio_lat != null && m.estadio_lng != null) {
                const oneWayKm = calculateDistance(
                    MADRID_COORDS.lat, MADRID_COORDS.lng,
                    Number(m.estadio_lat), Number(m.estadio_lng)
                );

                const roundTripKm = oneWayKm * 2;
                const tripHours = estimateTravelTime(oneWayKm) * 2;

                if (oneWayKm > 70) {
                    seasonStats[season].trips += 1;
                    totalTrips += 1;
                }

                seasonStats[season].km += roundTripKm;
                seasonStats[season].hours += tripHours;
                totalKm += roundTripKm;
                totalHours += tripHours;
            }
        });

        const sortedSeasons = Object.keys(seasonStats).sort().reverse();

        return {
            totalTrips,
            totalKm: Math.round(totalKm),
            totalHours: Math.round(totalHours),
            seasonBreakdown: sortedSeasons.map(s => ({
                season: s,
                ...seasonStats[s]
            }))
        };
    }, [matches]);

    if (!stats) return null;

    return (
        <div className="w-full max-w-7xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-6 font-bebas text-[#151e42] border-l-4 border-[#ffde59] pl-3 uppercase">Estadísticas de Viaje</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                    <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-3">
                        <Navigation size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Desplazamientos</p>
                        <p className="text-3xl md:text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.totalTrips}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                    <div className="bg-orange-50 p-3 rounded-full text-orange-600 mb-3">
                        <MapPin size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Distancia Total</p>
                        <p className="text-3xl md:text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">{stats.totalKm.toLocaleString()} km</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group">
                    <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 mb-3">
                        <Clock size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-[#ffde59] transition-colors">Tiempo en Ruta</p>
                        <p className="text-3xl md:text-4xl font-black text-[#151e42] leading-none group-hover:text-[#ffde59] transition-colors">~{stats.totalHours} h</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
                    <Calendar size={16} className="text-gray-500 mr-2" />
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Desglose por Temporada</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Temporada</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Viajes</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Kilómetros</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Horas (Est.) *</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.seasonBreakdown.map((row) => (
                                <tr key={row.season} className="hover:bg-gray-50 transaction-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#151e42] text-center">{row.season}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.trips}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-center">{Math.round(row.km).toLocaleString()} km</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{Math.round(row.hours)}h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-white rounded-lg px-4 py-3 border-t border-gray-200 text-xs text-gray-500 italic space-y-1">
                    <p>* Estimación: &lt;300km en autobús (80km/h), &gt;300km en avión (800km/h + 2.5h gestión).</p>
                    <p>** "Viajes" excluye desplazamientos locales (&lt;70km), pero sus km y horas se suman al total.</p>
                </div>
            </div>
        </div>
    );
};

export default MatchStatsDashboard;
