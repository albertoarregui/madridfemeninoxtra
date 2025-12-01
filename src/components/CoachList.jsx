import { useState, useMemo } from 'react';

const CoachCard = ({ coach }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    const fechaNacimiento = formatDate(coach.fecha_nacimiento);

    return (
        <a href={`/assets/entrenadores/${coach.slug}`} className="coach-card-link">
            <div className="coach-card">
                <div className="coach-image-container">
                    <img
                        src={coach.imageUrl}
                        alt={`Foto de ${coach.nombre}`}
                        className="coach-photo"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/placeholder.png';
                        }}
                    />
                </div>

                <div className="coach-info">
                    <div className="coach-name">{coach.nombre}</div>
                    <div className="coach-title">2025-Actualidad</div>
                </div>

                <div className="coach-details">
                    <div className="detail-item">
                        <strong>{fechaNacimiento}</strong>
                        <span className="detail-label">Nacimiento</span>
                    </div>
                    <div className="detail-item">
                        <strong>{coach.ciudad || '-'}</strong>
                        <span className="detail-label">Ciudad</span>
                    </div>
                </div>

                <div className="coach-origin">
                    <img
                        className="flag-svg"
                        src={`/assets/banderas/${coach.pais?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '_')}.svg`}
                        alt={`Bandera de ${coach.pais}`}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="origin-text">{coach.pais || '-'}</span>
                </div>
            </div>
        </a>
    );
};

export default function CoachList({ coaches }) {
    return (
        <div className="coach-list-ui">
            <div id="coaches-container" className="coaches-grid">
                {coaches.length > 0 ? (
                    coaches.map(coach => (
                        <CoachCard key={coach.slug} coach={coach} />
                    ))
                ) : (
                    <p className="no-results-message">
                        No se encontraron entrenadores.
                    </p>
                )}
            </div>
        </div>
    );
}
