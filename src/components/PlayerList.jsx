import { useState, useMemo } from 'react';

const PlayerCard = ({ player }) => {

    const alturaDisplay = player.altura ? `${player.altura} cm` : '-';
    const pesoDisplay = player.peso ? `${player.peso} kg` : '-';
    const fechaNacimientoDisplay = player.fecha_nacimiento
        ? new Date(player.fecha_nacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '-';

    return (
        <a href={`/jugadoras/${player.slug}`} className="jugadora-card-link">
            <div className="jugadora-card">
                <div className="player-image-container">
                    <img src={player.imageUrl} alt={`Foto de ${player.nombre}`} className="player-photo"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder_jugadora.png'; }} />
                </div>

                <div className="player-info">
                    <div className="player-name">{player.nombre}</div>
                    <div className="player-position">{player.posicion}</div>
                </div>

                <div className="player-details">
                    <div className="detail-item"><strong>{alturaDisplay}</strong><span className="detail-label">Altura</span></div>
                    <div className="detail-item"><strong>{pesoDisplay}</strong><span className="detail-label">Peso</span></div>
                    <div className="detail-item"><strong>{fechaNacimientoDisplay}</strong><span className="detail-label">Nacimiento</span></div>
                </div>

                <div className="player-origin">
                    <img className="flag-svg" src={`/images/banderas/${player.cleanCountryName}.svg`} alt={`Bandera de ${player.pais_origin}`}
                        onError={(e) => { e.target.style.display = 'none'; }} />
                    <span className="origin-text">{player.pais_origin}</span>
                </div>
            </div>
        </a>
    );
};


export default function PlayerList({ players, countries, positions }) {
    const [selectedCountry, setSelectedCountry] = useState('todos');
    const [selectedPosition, setSelectedPosition] = useState('todos');

    const filteredPlayers = useMemo(() => {
        return players.filter(player => {
            const matchesCountry = (selectedCountry === 'todos' || player.pais_origin === selectedCountry);
            const matchesPosition = (selectedPosition === 'todos' || player.posicion === selectedPosition);
            return matchesCountry && matchesPosition;
        });
    }, [players, selectedCountry, selectedPosition]);

    return (
        <div className="player-list-ui">
            {/* Controles de Filtro */}
            <div className="filters-container">
                {/* Filtro País */}
                <select id="filtro-pais" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                    <option value="todos">Todos los Países</option>
                    {countries.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
                {/* Filtro Posición */}
                <select id="filtro-posicion" value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)}>
                    <option value="todos">Todas las Posiciones</option>
                    {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
            </div>

            {/* Contenedor de Jugadoras */}
            <div id="jugadoras-container" className="jugadoras-grid">
                {filteredPlayers.length > 0 ? (
                    filteredPlayers.map(player => (
                        <PlayerCard key={player.slug} player={player} />
                    ))
                ) : (
                    <p className="no-results-message">
                        No se encontraron jugadoras con los filtros seleccionados.
                    </p>
                )}
            </div>
        </div>
    );
}