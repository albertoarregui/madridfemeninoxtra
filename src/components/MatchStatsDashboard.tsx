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

    const cardStyle: React.CSSProperties = {
        background: 'rgba(8,16,34,0.85)',
        border: '1px solid rgba(212,168,67,0.18)',
        borderRadius: '4px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '0.75rem',
        position: 'relative',
    };

    const iconWrapStyle: React.CSSProperties = {
        color: 'rgba(212,168,67,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: "'Cinzel', serif",
        fontSize: '0.58rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
        color: 'rgba(200,210,220,0.45)',
        margin: 0,
    };

    const valueStyle: React.CSSProperties = {
        fontFamily: "'Cinzel', serif",
        fontSize: '2.2rem',
        fontWeight: 700,
        color: '#d4a843',
        lineHeight: 1,
        margin: 0,
    };

    return (
        <div style={{ width: '100%', maxWidth: '56rem', margin: '0 auto 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={cardStyle}>
                    <div style={iconWrapStyle}><Navigation size={28} /></div>
                    <div>
                        <p style={labelStyle}>Desplazamientos</p>
                        <p style={valueStyle}>{stats.totalTrips}</p>
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={iconWrapStyle}><MapPin size={28} /></div>
                    <div>
                        <p style={labelStyle}>Distancia Total</p>
                        <p style={valueStyle}>{stats.totalKm.toLocaleString()} <span style={{ fontSize: '1rem' }}>km</span></p>
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={iconWrapStyle}><Clock size={28} /></div>
                    <div>
                        <p style={labelStyle}>Tiempo en Ruta</p>
                        <p style={valueStyle}>~{stats.totalHours} <span style={{ fontSize: '1rem' }}>h</span></p>
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(8,16,34,0.85)', border: '1px solid rgba(212,168,67,0.18)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(212,168,67,0.12)', background: 'rgba(212,168,67,0.03)' }}>
                    <Calendar size={14} style={{ color: 'rgba(212,168,67,0.6)', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.75)' }}>
                        Desglose por Temporada
                    </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem' }}>
                        <thead>
                            <tr>
                                {['Temporada','Viajes','Kilómetros','Horas (Est.)'].map(h => (
                                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'center', fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.7)', background: 'rgba(212,168,67,0.06)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {stats.seasonBreakdown.map((row, i) => (
                                <tr key={row.season} style={{ borderBottom: '1px solid rgba(212,168,67,0.07)', background: i % 2 === 0 ? 'rgba(6,13,28,0.6)' : 'rgba(6,13,28,0.4)' }}>
                                    <td style={{ padding: '0.55rem 1rem', textAlign: 'center', fontFamily: "'Cinzel', serif", fontSize: '0.78rem', color: 'rgba(200,210,220,0.85)', fontWeight: 600 }}>{row.season}</td>
                                    <td style={{ padding: '0.55rem 1rem', textAlign: 'center', color: 'rgba(200,210,220,0.65)' }}>{row.trips}</td>
                                    <td style={{ padding: '0.55rem 1rem', textAlign: 'center', color: 'rgba(200,210,220,0.65)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(row.km).toLocaleString()} km</td>
                                    <td style={{ padding: '0.55rem 1rem', textAlign: 'center', color: 'rgba(200,210,220,0.65)' }}>{Math.round(row.hours)}h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid rgba(212,168,67,0.07)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: 'rgba(200,210,220,0.3)', fontStyle: 'italic', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>* Estimación: &lt;300km en autobús (80km/h), &gt;300km en avión (800km/h + 2.5h gestión).</span>
                    <span>** "Viajes" excluye desplazamientos locales (&lt;70km), pero sus km y horas se suman al total.</span>
                </div>
            </div>
        </div>
    );
};

export default MatchStatsDashboard;
