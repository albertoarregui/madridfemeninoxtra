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
            if (!seasonStats[season]) seasonStats[season] = { trips: 0, km: 0, hours: 0 };

            const localName = (m.club_local || '').toLowerCase().replace(/\s/g, '');
            const stadiumName = (m.estadio || '').toLowerCase();
            const isHomeGame = localName.includes('realmadrid') ||
                localName.includes('tacon') ||
                stadiumName.includes('alfredo') ||
                stadiumName.includes('ciudad real madrid');

            if (!isHomeGame && m.estadio_lat != null && m.estadio_lng != null) {
                const oneWayKm = calculateDistance(
                    MADRID_COORDS.lat,
                    MADRID_COORDS.lng,
                    Number(m.estadio_lat),
                    Number(m.estadio_lng),
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

        return {
            totalTrips,
            totalKm: Math.round(totalKm),
            totalHours: Math.round(totalHours),
            seasonBreakdown: Object.keys(seasonStats).sort().reverse().map(season => ({
                season,
                ...seasonStats[season],
            })),
        };
    }, [matches]);

    if (!stats) return null;

    return (
        <section className="travel-dashboard" aria-label="Resumen de desplazamientos">
            <div className="travel-cards">
                <article className="travel-card travel-card--distance">
                    <MapPin aria-hidden="true" />
                    <div>
                        <p className="travel-label">Distancia total</p>
                        <p className="travel-value">{stats.totalKm.toLocaleString()} <small>km</small></p>
                    </div>
                </article>
                <article className="travel-card">
                    <Navigation aria-hidden="true" />
                    <div>
                        <p className="travel-label">Desplazamientos</p>
                        <p className="travel-value">{stats.totalTrips}</p>
                    </div>
                </article>
                <article className="travel-card">
                    <Clock aria-hidden="true" />
                    <div>
                        <p className="travel-label">Tiempo en ruta</p>
                        <p className="travel-value">~{stats.totalHours} <small>h</small></p>
                    </div>
                </article>
            </div>

            <div className="travel-breakdown">
                <header className="travel-breakdown__header">
                    <Calendar size={15} aria-hidden="true" />
                    <span>Desglose por temporada</span>
                </header>
                <div className="travel-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Temporada</th>
                                <th>Viajes</th>
                                <th>Kilómetros</th>
                                <th>Horas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.seasonBreakdown.map(row => (
                                <tr key={row.season}>
                                    <td>{row.season}</td>
                                    <td>{row.trips}</td>
                                    <td>{Math.round(row.km).toLocaleString()} km</td>
                                    <td>{Math.round(row.hours)} h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <footer className="travel-notes">
                    <span>* Estimación: trayectos de menos de 300 km en autobús y el resto en avión.</span>
                    <span>** Los desplazamientos locales no cuentan como viaje, aunque sí en distancia y tiempo.</span>
                </footer>
            </div>

            <style>{`
                .travel-dashboard { width: 100%; }
                .travel-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.85rem; margin-bottom: 1rem; }
                .travel-card { min-height: 132px; padding: 1.15rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.65rem; text-align: center; background: rgba(8,16,34,0.9); border: 1px solid rgba(212,168,67,0.2); border-radius: 8px; }
                .travel-card svg { width: 25px; height: 25px; color: rgba(212,168,67,0.76); }
                .travel-label { margin: 0 0 0.35rem; font-family: 'Cinzel', serif; font-size: 0.55rem; line-height: 1.35; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(200,210,220,0.52); }
                .travel-value { margin: 0; font-family: 'Cinzel', serif; font-size: clamp(1.45rem, 2.2vw, 2.2rem); font-weight: 700; line-height: 1; color: #d4a843; font-variant-numeric: tabular-nums; }
                .travel-value small { font-size: 0.8rem; }
                .travel-breakdown { overflow: hidden; background: rgba(8,16,34,0.9); border: 1px solid rgba(212,168,67,0.2); border-radius: 8px; }
                .travel-breakdown__header { display: flex; align-items: center; gap: 0.55rem; padding: 0.8rem 1rem; border-bottom: 1px solid rgba(212,168,67,0.12); background: rgba(212,168,67,0.04); color: rgba(212,168,67,0.78); }
                .travel-breakdown__header span { font-family: 'Cinzel', serif; font-size: 0.61rem; letter-spacing: 0.14em; text-transform: uppercase; }
                .travel-table-wrap { overflow-x: auto; }
                .travel-breakdown table { width: 100%; border-collapse: collapse; font-family: 'DM Sans', sans-serif; font-size: 0.78rem; }
                .travel-breakdown th { padding: 0.62rem 0.55rem; background: rgba(212,168,67,0.06); font-family: 'Cinzel', serif; font-size: 0.53rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(212,168,67,0.72); white-space: nowrap; }
                .travel-breakdown td { padding: 0.55rem; border-bottom: 1px solid rgba(212,168,67,0.07); text-align: center; color: rgba(200,210,220,0.68); font-variant-numeric: tabular-nums; }
                .travel-breakdown td:first-child { font-family: 'Cinzel', serif; font-weight: 600; color: rgba(230,235,240,0.88); }
                .travel-notes { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.65rem 1rem; color: rgba(200,210,220,0.36); font-family: 'DM Sans', sans-serif; font-size: 0.64rem; font-style: italic; line-height: 1.45; }
                @media (max-width: 600px) {
                    .travel-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
                    .travel-card--distance { grid-column: 1 / -1; min-height: 118px; }
                    .travel-card { min-height: 108px; padding: 0.9rem 0.65rem; }
                    .travel-card svg { width: 22px; height: 22px; }
                    .travel-value { font-size: 1.65rem; }
                    .travel-breakdown th, .travel-breakdown td { padding-inline: 0.35rem; }
                    .travel-notes { padding-inline: 0.75rem; }
                }
            `}</style>
        </section>
    );
};

export default MatchStatsDashboard;
