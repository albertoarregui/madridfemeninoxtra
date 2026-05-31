import React, { useState, useMemo, useEffect } from 'react';

interface Player {
    id_jugadora: string;
    nombre: string;
    slug: string;
    imageUrl: string;
    thumbnailUrl?: string;
    posicion: string;
    pais_origen: string;
    pais_origin?: string;
    countryName: string;
    flagUrl: string;
    temporadas?: string[];
    dorsales?: Record<string, number>;
    lat?: number | null;
    lng?: number | null;
    [key: string]: any;
}

interface PlayersGridProps {
    players: Player[];
}

const POSITION_ORDER: Record<string, number> = {
    'Portera': 1, 'Lateral izquierda': 2, 'Defensa central': 3, 'Defensa': 3,
    'Lateral derecha': 4, 'Centrocampista': 5, 'Extremo izquierdo': 6,
    'Extremo derecho': 6, 'Extremo': 6, 'Delantera': 7
};

const POSITION_ABBREV: Record<string, string> = {
    'Portera': 'POR', 'Lateral izquierda': 'LI', 'Defensa central': 'DC',
    'Defensa': 'DEF', 'Lateral derecha': 'LD', 'Centrocampista': 'MC',
    'Extremo izquierdo': 'EI', 'Extremo derecho': 'ED', 'Extremo': 'EXT', 'Delantera': 'DEL'
};


const PlayersGrid: React.FC<PlayersGridProps> = ({ players }) => {
    const [selectedPosition, setSelectedPosition] = useState<string>('Todas');
    const [selectedCountry, setSelectedCountry] = useState<string>('Todos');
    const [selectedSeason, setSelectedSeason] = useState<string>('Todas');
    const [sortOrder, setSortOrder] = useState<'position' | 'az' | 'za'>('position');
    const [cols, setCols] = useState(5);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            setIsMobile(w < 960);
            if (w < 540) setCols(2);
            else if (w < 800) setCols(3);
            else if (w < 1100) setCols(4);
            else setCols(5);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const cardCols = `repeat(${cols}, 1fr)`;

    const positionData = useMemo((): [string, number][] => {
        const map: Record<string, number> = {};
        players.forEach(p => { if (p.posicion) map[p.posicion] = (map[p.posicion] || 0) + 1; });
        const sorted = Object.entries(map).sort((a, b) => (POSITION_ORDER[a[0]] || 99) - (POSITION_ORDER[b[0]] || 99));
        return [['Todas', players.length], ...sorted];
    }, [players]);

    const countryData = useMemo(() => {
        const map: Record<string, { count: number; flagUrl: string }> = {};
        players.forEach(p => {
            const country = p.pais_origin || p.pais_origen;
            if (country) {
                if (!map[country]) map[country] = { count: 0, flagUrl: p.flagUrl };
                map[country].count++;
            }
        });
        return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
    }, [players]);

    const seasons = useMemo(() => {
        const all = new Set<string>();
        players.forEach(p => { if (Array.isArray(p.temporadas)) p.temporadas.forEach(s => all.add(s)); });
        return Array.from(all).sort().reverse();
    }, [players]);

    const filteredPlayers = useMemo(() => {
        const filtered = players.filter(player => {
            const matchesPos = selectedPosition === 'Todas' || player.posicion === selectedPosition;
            const country = player.pais_origin || player.pais_origen;
            const matchesCountry = selectedCountry === 'Todos' || country === selectedCountry;
            const matchesSeason = selectedSeason === 'Todas'
                ? true
                : Array.isArray(player.temporadas) && player.temporadas.includes(selectedSeason);
            return matchesPos && matchesCountry && matchesSeason;
        });

        if (sortOrder === 'position') {
            filtered.sort((a, b) => {
                const diff = (POSITION_ORDER[a.posicion] || 99) - (POSITION_ORDER[b.posicion] || 99);
                return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
            });
        } else if (sortOrder === 'az') {
            filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
        } else {
            filtered.sort((a, b) => b.nombre.localeCompare(a.nombre));
        }
        return filtered;
    }, [players, selectedPosition, selectedCountry, selectedSeason, sortOrder]);

    const badge = (count: number, active: boolean): React.CSSProperties => ({
        background: active ? 'rgba(212,168,67,0.22)' : 'rgba(212,168,67,0.06)',
        color: active ? '#d4a843' : 'rgba(200,210,220,0.35)',
        padding: '0 0.28rem', borderRadius: '2px',
        fontSize: '0.54rem', fontFamily: "'DM Sans', sans-serif",
        marginLeft: 'auto', flexShrink: 0,
    });

    const sectionLabel: React.CSSProperties = {
        fontFamily: "'Cinzel', serif", fontSize: '0.55rem',
        letterSpacing: '0.18em', color: 'rgba(212,168,67,0.55)',
        textTransform: 'uppercase', display: 'block',
        marginBottom: '0.45rem', marginTop: '1rem',
    };

    const filterBtnStyle = (active: boolean): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        width: '100%', padding: '0.38rem 0.6rem',
        borderRadius: '2px',
        border: `1px solid ${active ? 'rgba(212,168,67,0.45)' : 'rgba(212,168,67,0.08)'}`,
        marginBottom: '0.25rem',
        fontFamily: "'Cinzel', serif", fontSize: '0.59rem',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        cursor: 'pointer', textAlign: 'left',
        background: active ? 'rgba(212,168,67,0.08)' : 'transparent',
        color: active ? '#d4a843' : 'rgba(200,210,220,0.45)',
        transition: 'all 0.15s',
    });

    const sortBtnStyle = (active: boolean): React.CSSProperties => ({
        padding: '0.3rem 0.8rem', borderRadius: '2px',
        border: `1px solid ${active ? '#d4a843' : 'rgba(212,168,67,0.22)'}`,
        fontFamily: "'Cinzel', serif", fontSize: '0.57rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: 'pointer',
        background: active ? '#d4a843' : 'transparent',
        color: active ? '#060d1c' : 'rgba(200,210,220,0.55)',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
    });

    return (
        <>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '230px minmax(0, 1fr)',
                alignItems: 'start',
                gap: '1.75rem',
                width: '100%',
            }}>

                {/* ── Sidebar ── */}
                <aside className="pg-sidebar" style={{ position: isMobile ? 'static' : 'sticky', top: '90px', alignSelf: 'start' }}>
                    <div style={{ textAlign: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(212,168,67,0.1)', marginBottom: '0.35rem' }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.58rem', letterSpacing: '0.22em', color: 'rgba(212,168,67,0.6)', textTransform: 'uppercase' }}>♦ FILTROS ♦</span>
                    </div>

                    <span style={sectionLabel}>♦ Posición</span>
                    <div>
                        {positionData.map(([pos, count]) => (
                            <button key={pos} style={filterBtnStyle(selectedPosition === pos)} onClick={() => setSelectedPosition(pos)}>
                                <span style={{ flex: 1 }}>{pos}</span>
                                <span style={badge(count, selectedPosition === pos)}>{count}</span>
                            </button>
                        ))}
                    </div>

                    <span style={sectionLabel}>♦ País</span>
                    <div>
                        <button style={filterBtnStyle(selectedCountry === 'Todos')} onClick={() => setSelectedCountry('Todos')}>
                            <span style={{ flex: 1 }}>Todos</span>
                            <span style={badge(players.length, selectedCountry === 'Todos')}>{players.length}</span>
                        </button>
                        {countryData.map(([country, { count, flagUrl }]) => (
                            <button key={country} style={filterBtnStyle(selectedCountry === country)} onClick={() => setSelectedCountry(country)}>
                                {flagUrl && <img src={flagUrl} alt="" style={{ width: '14px', height: '14px', objectFit: 'cover', borderRadius: '1px', flexShrink: 0 }} />}
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{country}</span>
                                <span style={badge(count, selectedCountry === country)}>{count}</span>
                            </button>
                        ))}
                    </div>

                    {seasons.length > 0 && (
                        <>
                            <span style={sectionLabel}>♦ Temporada</span>
                            <div style={{ maxHeight: '175px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                                <button style={filterBtnStyle(selectedSeason === 'Todas')} onClick={() => setSelectedSeason('Todas')}>
                                    <span style={{ flex: 1 }}>Todas</span>
                                </button>
                                {seasons.map(s => (
                                    <button key={s} style={filterBtnStyle(selectedSeason === s)} onClick={() => setSelectedSeason(s)}>
                                        <span style={{ flex: 1 }}>{s.replace('-', '/')}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </aside>

                {/* ── Main ── */}
                <main className="pg-main">
                    {/* Sort bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.56rem', letterSpacing: '0.14em', color: 'rgba(212,168,67,0.45)', textTransform: 'uppercase' }}>♦ Ordenar Por</span>
                        {(['position', 'az', 'za'] as const).map(order => (
                            <button key={order} style={sortBtnStyle(sortOrder === order)} onClick={() => setSortOrder(order)}>
                                {order === 'position' ? 'Por Posición' : order === 'az' ? 'A → Z' : 'Z → A'}
                            </button>
                        ))}
                        <span style={{ marginLeft: 'auto', fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: 'rgba(200,210,220,0.35)' }}>
                            {filteredPlayers.length} jugadoras
                        </span>
                    </div>

                    {/* Card grid */}
                    {filteredPlayers.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: cardCols, gap: '0.75rem' }}>
                            {filteredPlayers.map((player, index) => (
                                <a key={player.id_jugadora || player.slug} href={`/jugadoras/${player.slug}`} className="player-portrait-card" data-astro-prefetch="hover">
                                    {/* 4 corner brackets */}
                                    <span className="pg-corner pg-corner-tl" />
                                    <span className="pg-corner pg-corner-tr" />
                                    <span className="pg-corner pg-corner-bl" />
                                    <span className="pg-corner pg-corner-br" />

                                    {/* Gold glow */}
                                    <div className="pg-card-glow" />

                                    {/* Position — top-left */}
                                    <span className="pg-pos-label">
                                        ♦ {POSITION_ABBREV[player.posicion] || player.posicion?.slice(0, 3).toUpperCase() || '–'}
                                    </span>

                                    {/* Photo fills card */}
                                    <div className="pg-card-photo" style={{ viewTransitionName: `player-${player.slug}` } as React.CSSProperties}>
                                        <img
                                            src={player.thumbnailUrl || player.imageUrl}
                                            alt={player.nombre}
                                            loading={index < 16 ? 'eager' : 'lazy'}
                                            decoding="async"
                                            width={200}
                                            height={267}
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/jugadoras-perfil/placeholder.png'; }}
                                        />
                                    </div>

                                    {/* Text overlaid on photo with gradient */}
                                    <div className="pg-card-overlay">
                                        <div className="pg-card-name">{player.nombre}</div>
                                        <div className="pg-card-country">
                                            {player.flagUrl && (
                                                <img src={player.flagUrl} alt="" style={{ width: '14px', height: '14px', objectFit: 'cover', borderRadius: '1px', flexShrink: 0 }} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            )}
                                            <span>{player.countryName}</span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(6,13,28,0.8)', border: '1px dashed rgba(212,168,67,0.15)', borderRadius: '4px' }}>
                            <p style={{ fontFamily: "'Cinzel', serif", color: 'rgba(200,210,220,0.4)', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>No hay resultados</p>
                            <button
                                onClick={() => { setSelectedPosition('Todas'); setSelectedCountry('Todos'); setSelectedSeason('Todas'); }}
                                style={{ padding: '0.55rem 1.4rem', background: '#d4a843', color: '#060d1c', border: 'none', borderRadius: '2px', fontFamily: "'Cinzel', serif", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                            >
                                Reiniciar filtros
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default PlayersGrid;
