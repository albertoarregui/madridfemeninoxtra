import { useState, useMemo } from 'react';

const RivalCard = ({ rival }) => {
    return (
        <a href={`/rivales/${rival.slug}`} className="rival-card-link">
            <div className="rival-card">
                <div className="rival-shield-container">
                    <img
                        src={rival.shieldUrl}
                        alt={`Escudo de ${rival.nombre}`}
                        className="rival-shield"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/escudos/placeholder.png';
                        }}
                    />
                </div>

                <div className="rival-info">
                    <div className="rival-name">{rival.nombre}</div>
                    <div className="rival-location">{rival.ciudad}</div>
                </div>

                <div className="rival-details">
                    {rival.estadio_nombre && (
                        <div className="detail-item">
                            <strong>{rival.estadio_nombre}</strong>
                            <span className="detail-label">Estadio</span>
                        </div>
                    )}
                    {rival.fundacion && (
                        <div className="detail-item">
                            <strong>{rival.fundacion}</strong>
                            <span className="detail-label">Fundación</span>
                        </div>
                    )}
                </div>

                <div className="rival-origin">
                    <img
                        className="flag-svg"
                        src={`/images/banderas/${rival.pais?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '_')}.svg`}
                        alt={`Bandera de ${rival.pais}`}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="origin-text">{rival.pais}</span>
                </div>
            </div>
        </a>
    );
};

export default function RivalList({ rivals }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRivals = useMemo(() => {
        if (!searchTerm) return rivals;
        return rivals.filter(rival =>
            rival.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rivals, searchTerm]);

    return (
        <div className="rival-list-ui">
            {/* Búsqueda */}
            <div className="filters-container">
                <input
                    type="text"
                    id="search-rival"
                    placeholder="Buscar rival..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Contenedor de Rivales */}
            <div id="rivals-container" className="rivals-grid">
                {filteredRivals.length > 0 ? (
                    filteredRivals.map(rival => (
                        <RivalCard key={rival.slug} rival={rival} />
                    ))
                ) : (
                    <p className="no-results-message">
                        No se encontraron rivales con ese criterio de búsqueda.
                    </p>
                )}
            </div>
        </div>
    );
}
