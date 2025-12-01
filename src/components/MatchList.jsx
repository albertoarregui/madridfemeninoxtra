import { useState, useMemo } from 'react';

const MatchCard = ({ match }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    const resultado = match.resultado || '-';
    const resultClass = resultado === 'V' ? 'victoria' : resultado === 'D' ? 'derrota' : 'empate';
    const resultText = resultado === 'V' ? 'Victoria' : resultado === 'D' ? 'Derrota' : 'Empate';

    return (
        <a href={`/partidos/${match.slug}`} className="match-card-link">
            <div className="match-card">
                <div className="match-header">
                    <p className="competition-name">{match.competicion_nombre || '-'}</p>
                    <p className="match-date">{formatDate(match.fecha)}</p>
                </div>

                <div className="match-teams">
                    <p className="team-name">{match.club_local}</p>
                    <div className="match-score">
                        <span className={`score ${resultClass}`}>
                            {match.goles_rm} - {match.goles_rival}
                        </span>
                    </div>
                    <p className="team-name">{match.club_visitante}</p>
                </div>

                <div className="match-result">
                    <span className={`result-badge ${resultClass}`}>{resultText}</span>
                </div>
            </div>
        </a>
    );
};

export default function MatchList({ matches, seasons = [], competitions = [] }) {
    const [selectedSeason, setSelectedSeason] = useState('todos');
    const [selectedCompetition, setSelectedCompetition] = useState('todos');

    const filteredMatches = useMemo(() => {
        return matches.filter(match => {
            const matchesSeason = (selectedSeason === 'todos' || match.temporada_nombre === selectedSeason);
            const matchesCompetition = (selectedCompetition === 'todos' || match.competicion_nombre === selectedCompetition);
            return matchesSeason && matchesCompetition;
        });
    }, [matches, selectedSeason, selectedCompetition]);

    return (
        <div className="match-list-ui">
            {/* Controles de Filtro */}
            <div className="filters-container">
                {seasons.length > 0 && (
                    <select
                        id="filtro-temporada"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
                        <option value="todos">Todas las Temporadas</option>
                        {seasons.map(season => (
                            <option key={season} value={season}>{season}</option>
                        ))}
                    </select>
                )}

                {competitions.length > 0 && (
                    <select
                        id="filtro-competicion"
                        value={selectedCompetition}
                        onChange={(e) => setSelectedCompetition(e.target.value)}
                    >
                        <option value="todos">Todas las Competiciones</option>
                        {competitions.map(comp => (
                            <option key={comp} value={comp}>{comp}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Contenedor de Partidos */}
            <div id="matches-container" className="matches-grid">
                {filteredMatches.length > 0 ? (
                    filteredMatches.map(match => (
                        <MatchCard key={match.id_partido || match.slug} match={match} />
                    ))
                ) : (
                    <p className="no-results-message">
                        No se encontraron partidos con los filtros seleccionados.
                    </p>
                )}
            </div>
        </div>
    );
}
