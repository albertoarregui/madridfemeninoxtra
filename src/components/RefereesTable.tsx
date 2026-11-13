import React, { useMemo } from 'react';

import { getFlagSrc } from '../utils/flags';

function generateSlug(text: string | null | undefined): string {
    if (!text) return 'desconocido';
    return text.toString().toLowerCase()
        .trim()
        .replace(/ø/g, 'o').replace(/Ø/g, 'O')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

interface Referee {
    id_arbitra: string | number;
    nombre: string;
    foto_url: string | null;
    iso: string | null;
    colegio?: string | null;
    pais_origen?: string | null;
    stats: {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        yellowCards: number;
        redCards: number;
        yellowCardsAgainst: number;
        redCardsAgainst: number;
    };
}

interface RefereesTableProps {
    referees: Referee[];
}

const photoSrc = (url: string | null) =>
    url ? (url.startsWith('http') ? url : `https://media.madridfemeninoxtra.com${url}`) : '';

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

const RefereesTable: React.FC<RefereesTableProps> = ({ referees }) => {
    const sorted = useMemo(
        () => [...referees].sort((a, b) => b.stats.played - a.stats.played || a.nombre.localeCompare(b.nombre, 'es')),
        [referees],
    );

    return (
        <div className="referees-card-grid">
            {sorted.map((referee) => {
                const photo = photoSrc(referee.foto_url);
                const yellows = referee.stats.yellowCards + referee.stats.yellowCardsAgainst;
                const reds = referee.stats.redCards + referee.stats.redCardsAgainst;
                return (
                    <a className="referee-card mfx-link-card" href={`/arbitras/${generateSlug(referee.nombre)}`} key={referee.id_arbitra}><span className="mfx-spin" aria-hidden="true" />
                        <div className="referee-card__photo">
                            {photo ? (
                                <img src={photo} alt={`Foto de ${referee.nombre}`} loading="lazy"
                                    onError={(event) => { event.currentTarget.style.display = 'none'; (event.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('hidden'); }} />
                            ) : null}
                            <span className="referee-card__initials" hidden={Boolean(photo)}>{initials(referee.nombre)}</span>
                            <span className="referee-card__played"><strong>{referee.stats.played}</strong> PJ</span>
                        </div>

                        <div className="referee-card__body">
                            <h3>{referee.nombre}</h3>
                            <p>
                                {referee.iso && <img src={getFlagSrc(referee.iso)} alt="" loading="lazy" />}
                                <span>{referee.colegio || referee.pais_origen || 'Árbitra'}</span>
                            </p>

                            <div className="referee-card__stats">
                                <span className="is-win"><strong>{referee.stats.wins}</strong><span>V</span></span>
                                <span className="is-draw"><strong>{referee.stats.draws}</strong><span>E</span></span>
                                <span className="is-loss"><strong>{referee.stats.losses}</strong><span>D</span></span>
                                <span className="is-yellow"><strong>{yellows}</strong><span>TA</span></span>
                                <span className="is-red"><strong>{reds}</strong><span>TR</span></span>
                            </div>
                        </div>
                    </a>
                );
            })}

            <style>{`
                .referees-card-grid {
                    width: min(100%, 1600px);
                    margin: 0 auto 2.5rem;
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 1rem;
                }
                .referee-card {
                    min-width: 0;
                    overflow: hidden;
                    border: 1px solid rgba(212,168,67,0.2);
                    border-radius: 10px;
                    background: rgba(var(--l-card, 6, 13, 28), 0.94);
                    color: rgb(var(--l-ink, 240, 240, 240));
                    text-decoration: none;
                    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
                }
                .referee-card:hover { transform: translateY(-4px); border-color: rgba(212,168,67,0.5); box-shadow: 0 16px 32px rgba(0,0,0,0.3); }
                .referee-card__photo {
                    position: relative;
                    height: 200px;
                    display: grid;
                    place-items: center;
                    overflow: hidden;
                    background: radial-gradient(circle at center, rgba(212,168,67,0.09), transparent 58%), linear-gradient(135deg, #111b2d, #071022);
                }
                .referee-card__photo::after { content: ''; position: absolute; inset: auto 0 0; height: 30%; background: linear-gradient(to bottom, transparent, rgba(6,13,28,0.68)); pointer-events: none; }
                .referee-card__photo > img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center top; transition: transform 0.35s ease; }
                .referee-card:hover .referee-card__photo > img { transform: scale(1.05); }
                .referee-card__initials[hidden] { display: none; }
                .referee-card__initials { display: grid; place-items: center; width: 92px; height: 92px; border-radius: 50%; border: 1px solid rgba(212,168,67,0.45); background: rgba(212,168,67,0.1); color: #d4a843; font: 700 1.6rem/1 'Cinzel', serif; }
                .referee-card__played {
                    position: absolute; right: 0.7rem; bottom: 0.65rem; z-index: 1;
                    display: flex; align-items: baseline; gap: 0.28rem; padding: 0.3rem 0.5rem;
                    border: 1px solid rgba(212,168,67,0.3); border-radius: 999px; background: rgba(6,13,28,0.8);
                    color: rgba(200,210,220,0.58); font-family: 'Cinzel', serif; font-size: 0.46rem; letter-spacing: 0.08em; backdrop-filter: blur(5px);
                }
                .referee-card__played strong { color: #d4a843; font-size: 0.88rem; }
                .referee-card__body { padding: 0.9rem; }
                .referee-card__body h3 { margin: 0; overflow: hidden; color: rgb(var(--l-ink, 240, 240, 240)); font-family: 'Cinzel', serif; font-size: 0.9rem; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
                .referee-card__body > p { display: flex; align-items: center; gap: 0.4rem; min-width: 0; margin: 0.3rem 0 0.75rem; color: rgba(var(--l-ink, 200, 210, 220), 0.52); font-size: 0.7rem; }
                .referee-card__body > p img { width: 17px; height: 12px; object-fit: cover; flex-shrink: 0; }
                .referee-card__body > p span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .referee-card__stats { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); margin: 0 -0.9rem -0.9rem; border-top: 1px solid rgba(212,168,67,0.08); }
                .referee-card__stats > span { min-width: 0; padding: 0.65rem 0.1rem; border-right: 1px solid rgba(212,168,67,0.07); color: rgba(var(--l-ink, 200, 210, 220), 0.42); font-size: 0.5rem; text-align: center; }
                .referee-card__stats > span:last-child { border-right: 0; }
                .referee-card__stats strong { display: block; margin-bottom: 0.15rem; color: rgb(var(--l-ink, 240, 240, 240)); font-size: 0.86rem; }
                .referee-card__stats .is-win strong { color: rgba(74,222,128,0.9); }
                .referee-card__stats .is-draw strong { color: rgba(180,190,205,0.85); }
                .referee-card__stats .is-loss strong { color: rgba(248,113,113,0.88); }
                .referee-card__stats .is-yellow strong { color: #facc15; }
                .referee-card__stats .is-red strong { color: #ef4444; }
                @media (max-width: 1200px) { .referees-card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
                @media (max-width: 850px) { .referees-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (max-width: 560px) {
                    .referees-card-grid { grid-template-columns: 1fr; gap: 0.85rem; }
                    .referee-card__photo { height: 170px; }
                }
            `}</style>
        </div>
    );
};

export default RefereesTable;
