import React, { useMemo } from 'react';

interface Stadium {
    name: string;
    city: string;
    capacity: string | number;
    imageUrl: string | null;
    slug: string;
    stats: {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        gd: number;
    };
}

interface StadiumsTableProps {
    stadiums: Stadium[];
}

const StadiumsTable: React.FC<StadiumsTableProps> = ({ stadiums }) => {
    const sortedStadiums = useMemo(
        () => [...stadiums].sort((a, b) => b.stats.played - a.stats.played || a.name.localeCompare(b.name)),
        [stadiums],
    );

    return (
        <div className="stadiums-card-grid">
            {sortedStadiums.map((stadium) => (
                <a className="stadium-card" href={`/estadios/${stadium.slug}`} key={stadium.slug}>
                    <div className="stadium-card__photo">
                        {stadium.imageUrl && (
                            <img
                                src={stadium.imageUrl}
                                alt={`Vista de ${stadium.name}`}
                                loading="lazy"
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            />
                        )}
                        <span className="stadium-card__played"><strong>{stadium.stats.played}</strong> PJ</span>
                    </div>

                    <div className="stadium-card__body">
                        <h3>{stadium.name}</h3>
                        <p>{stadium.city || 'Ciudad no disponible'}</p>

                        <div className="stadium-card__meta">
                            <span>Capacidad</span>
                            <strong>{stadium.capacity ? Number(stadium.capacity).toLocaleString() : '—'}</strong>
                        </div>

                        <div className="stadium-card__stats">
                            <span className="is-win"><strong>{stadium.stats.wins}</strong>Victorias</span>
                            <span className="is-draw"><strong>{stadium.stats.draws}</strong>Empates</span>
                            <span className="is-loss"><strong>{stadium.stats.losses}</strong>Derrotas</span>
                            <span><strong>{stadium.stats.gd > 0 ? `+${stadium.stats.gd}` : stadium.stats.gd}</strong>Dif. goles</span>
                        </div>
                    </div>
                </a>
            ))}

            <style>{`
                .stadiums-card-grid {
                    width: min(100%, 1600px);
                    margin: 0 auto 2.5rem;
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 1.15rem;
                }
                .stadium-card {
                    min-width: 0;
                    overflow: hidden;
                    border: 1px solid rgba(212,168,67,0.2);
                    border-radius: 10px;
                    background: rgba(6,13,28,0.94);
                    color: #f0f0f0;
                    text-decoration: none;
                    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
                }
                .stadium-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(212,168,67,0.5);
                    box-shadow: 0 16px 32px rgba(0,0,0,0.3);
                }
                .stadium-card__photo {
                    position: relative;
                    height: 190px;
                    overflow: hidden;
                    background: linear-gradient(135deg, #111b2d, #071022);
                }
                .stadium-card__photo::after {
                    content: '';
                    position: absolute;
                    inset: auto 0 0;
                    height: 34%;
                    background: linear-gradient(to bottom, transparent, rgba(6,13,28,0.72));
                    pointer-events: none;
                }
                .stadium-card__photo img {
                    width: 100%;
                    height: 100%;
                    display: block;
                    object-fit: cover;
                    filter: saturate(1.04) contrast(1.02);
                    transition: transform 0.4s ease;
                }
                .stadium-card:hover .stadium-card__photo img { transform: scale(1.035); }
                .stadium-card__played {
                    position: absolute;
                    right: 0.75rem;
                    bottom: 0.7rem;
                    z-index: 1;
                    display: flex;
                    align-items: baseline;
                    gap: 0.3rem;
                    padding: 0.32rem 0.55rem;
                    border: 1px solid rgba(212,168,67,0.3);
                    border-radius: 999px;
                    background: rgba(6,13,28,0.8);
                    color: rgba(200,210,220,0.6);
                    font-family: 'Cinzel', serif;
                    font-size: 0.48rem;
                    letter-spacing: 0.08em;
                    backdrop-filter: blur(5px);
                }
                .stadium-card__played strong { color: #d4a843; font-size: 0.9rem; }
                .stadium-card__body { padding: 1rem; }
                .stadium-card__body h3 {
                    margin: 0;
                    overflow: hidden;
                    color: #f0f0f0;
                    font-family: 'Cinzel', serif;
                    font-size: 1rem;
                    line-height: 1.25;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .stadium-card__body > p { margin: 0.3rem 0 0; color: rgba(200,210,220,0.52); font-size: 0.75rem; }
                .stadium-card__meta { display: flex; justify-content: space-between; margin-top: 0.85rem; padding: 0.65rem 0; border-top: 1px solid rgba(212,168,67,0.09); color: rgba(200,210,220,0.48); font-size: 0.68rem; }
                .stadium-card__meta strong { color: rgba(235,238,242,0.82); font-variant-numeric: tabular-nums; }
                .stadium-card__stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); margin: 0 -1rem -1rem; border-top: 1px solid rgba(212,168,67,0.08); }
                .stadium-card__stats span { min-width: 0; padding: 0.72rem 0.15rem; border-right: 1px solid rgba(212,168,67,0.07); color: rgba(200,210,220,0.42); font-size: 0.53rem; text-align: center; }
                .stadium-card__stats span:last-child { border-right: 0; }
                .stadium-card__stats strong { display: block; margin-bottom: 0.17rem; color: #f0f0f0; font-size: 0.95rem; }
                .stadium-card__stats .is-win strong { color: rgba(74,222,128,0.9); }
                .stadium-card__stats .is-draw strong { color: rgba(180,190,205,0.85); }
                .stadium-card__stats .is-loss strong { color: rgba(248,113,113,0.88); }
                @media (max-width: 1050px) {
                    .stadiums-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
                @media (max-width: 640px) {
                    .stadiums-card-grid { grid-template-columns: 1fr; gap: 0.85rem; }
                    .stadium-card__photo { height: 145px; }
                    .stadium-card__body { padding: 0.9rem; }
                    .stadium-card__stats { margin: 0 -0.9rem -0.9rem; }
                }
            `}</style>
        </div>
    );
};

export default StadiumsTable;
