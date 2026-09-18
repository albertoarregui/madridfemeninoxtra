import React, { useMemo } from 'react';

interface Rival {
    id_club: string | number;
    nombre: string;
    shieldUrl: string;
    ciudad: string;
    pais: string;
    flagUrl: string;
    estadio: string;
    slug: string;
    stats: {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        gf: number;
        ga: number;
        cleanSheets: number;
    };
}

interface RivalsTableProps {
    rivals: Rival[];
}

const RivalsTable: React.FC<RivalsTableProps> = ({ rivals }) => {
    const sortedRivals = useMemo(
        () => [...rivals].sort((a, b) => b.stats.played - a.stats.played || a.nombre.localeCompare(b.nombre)),
        [rivals],
    );

    return (
        <div className="rivals-card-grid">
            {sortedRivals.map((rival) => (
                <a className="rival-card" href={`/rivales/${rival.slug}`} key={rival.id_club}>
                    <div className="rival-card__photo">
                        <img
                            src={rival.shieldUrl}
                            alt={`Escudo de ${rival.nombre}`}
                            loading="lazy"
                            onError={(event) => { event.currentTarget.src = '/assets/escudos/placeholder.png'; }}
                        />
                        <span className="rival-card__played"><strong>{rival.stats.played}</strong> PJ</span>
                    </div>

                    <div className="rival-card__body">
                        <h3>{rival.nombre}</h3>
                        <p>
                            {rival.flagUrl && <img src={rival.flagUrl} alt="" loading="lazy" />}
                            <span>{rival.ciudad || rival.pais || 'Ubicación no disponible'}</span>
                        </p>

                        <div className="rival-card__stadium">
                            <span>Estadio</span>
                            <strong>{rival.estadio || 'No disponible'}</strong>
                        </div>

                        <div className="rival-card__stats">
                            <span className="is-win"><strong>{rival.stats.wins}</strong>V</span>
                            <span className="is-draw"><strong>{rival.stats.draws}</strong>E</span>
                            <span className="is-loss"><strong>{rival.stats.losses}</strong>D</span>
                            <span><strong>{rival.stats.gf}-{rival.stats.ga}</strong>Goles</span>
                            <span><strong>{rival.stats.cleanSheets}</strong>PaC</span>
                        </div>
                    </div>
                </a>
            ))}

            <style>{`
                .rivals-card-grid {
                    width: min(100%, 1600px);
                    margin: 0 auto 2.5rem;
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 1rem;
                }
                .rival-card {
                    min-width: 0;
                    overflow: hidden;
                    border: 1px solid rgba(212,168,67,0.2);
                    border-radius: 10px;
                    background: rgba(6,13,28,0.94);
                    color: #f0f0f0;
                    text-decoration: none;
                    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
                }
                .rival-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(212,168,67,0.5);
                    box-shadow: 0 16px 32px rgba(0,0,0,0.3);
                }
                .rival-card__photo {
                    position: relative;
                    height: 165px;
                    display: grid;
                    place-items: center;
                    overflow: hidden;
                    background: radial-gradient(circle at center, rgba(212,168,67,0.09), transparent 58%), linear-gradient(135deg, #111b2d, #071022);
                }
                .rival-card__photo::after {
                    content: '';
                    position: absolute;
                    inset: auto 0 0;
                    height: 30%;
                    background: linear-gradient(to bottom, transparent, rgba(6,13,28,0.68));
                    pointer-events: none;
                }
                .rival-card__photo > img {
                    width: 104px;
                    height: 104px;
                    display: block;
                    object-fit: contain;
                    filter: saturate(1.05) contrast(1.03);
                    transition: transform 0.35s ease;
                }
                .rival-card:hover .rival-card__photo > img { transform: scale(1.06); }
                .rival-card__played {
                    position: absolute;
                    right: 0.7rem;
                    bottom: 0.65rem;
                    z-index: 1;
                    display: flex;
                    align-items: baseline;
                    gap: 0.28rem;
                    padding: 0.3rem 0.5rem;
                    border: 1px solid rgba(212,168,67,0.3);
                    border-radius: 999px;
                    background: rgba(6,13,28,0.8);
                    color: rgba(200,210,220,0.58);
                    font-family: 'Cinzel', serif;
                    font-size: 0.46rem;
                    letter-spacing: 0.08em;
                    backdrop-filter: blur(5px);
                }
                .rival-card__played strong { color: #d4a843; font-size: 0.88rem; }
                .rival-card__body { padding: 0.9rem; }
                .rival-card__body h3 { margin: 0; overflow: hidden; color: #f0f0f0; font-family: 'Cinzel', serif; font-size: 0.9rem; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
                .rival-card__body > p { display: flex; align-items: center; gap: 0.4rem; min-width: 0; margin: 0.3rem 0 0; color: rgba(200,210,220,0.52); font-size: 0.7rem; }
                .rival-card__body > p img { width: 17px; height: 12px; object-fit: cover; flex-shrink: 0; }
                .rival-card__body > p span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .rival-card__stadium { display: flex; justify-content: space-between; gap: 0.65rem; margin-top: 0.75rem; padding: 0.6rem 0; border-top: 1px solid rgba(212,168,67,0.09); color: rgba(200,210,220,0.44); font-size: 0.62rem; }
                .rival-card__stadium strong { overflow: hidden; color: rgba(232,236,240,0.78); font-weight: 600; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
                .rival-card__stats { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); margin: 0 -0.9rem -0.9rem; border-top: 1px solid rgba(212,168,67,0.08); }
                .rival-card__stats span { min-width: 0; padding: 0.65rem 0.1rem; border-right: 1px solid rgba(212,168,67,0.07); color: rgba(200,210,220,0.42); font-size: 0.5rem; text-align: center; }
                .rival-card__stats span:last-child { border-right: 0; }
                .rival-card__stats strong { display: block; margin-bottom: 0.15rem; color: #f0f0f0; font-size: 0.86rem; }
                .rival-card__stats .is-win strong { color: rgba(74,222,128,0.9); }
                .rival-card__stats .is-draw strong { color: rgba(180,190,205,0.85); }
                .rival-card__stats .is-loss strong { color: rgba(248,113,113,0.88); }
                @media (max-width: 1200px) {
                    .rivals-card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                }
                @media (max-width: 850px) {
                    .rivals-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
                @media (max-width: 560px) {
                    .rivals-card-grid { grid-template-columns: 1fr; gap: 0.85rem; }
                    .rival-card__photo { height: 135px; }
                    .rival-card__photo > img { width: 86px; height: 86px; }
                }
            `}</style>
        </div>
    );
};

export default RivalsTable;
