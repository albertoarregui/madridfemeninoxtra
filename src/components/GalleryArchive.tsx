import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Camera, Trophy, Calendar } from 'lucide-react';

interface GalleryAlbum {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    date: string;
    cover: string;
    count: number;
}

interface GalleryArchiveProps {
    initialAlbums: GalleryAlbum[];
}

const GalleryArchive: React.FC<GalleryArchiveProps> = ({ initialAlbums }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [galleriesPerPage, setGalleriesPerPage] = useState(9);

    React.useEffect(() => {
        const updateCount = () => {
            setGalleriesPerPage(window.innerWidth >= 1024 ? 9 : 10);
        };
        updateCount();
        window.addEventListener('resize', updateCount);
        return () => window.removeEventListener('resize', updateCount);
    }, []);

    const totalPages = Math.ceil(initialAlbums.length / galleriesPerPage);
    const paginatedAlbums = useMemo(() => {
        const start = (currentPage - 1) * galleriesPerPage;
        return initialAlbums.slice(start, start + galleriesPerPage);
    }, [currentPage, galleriesPerPage, initialAlbums]);

    return (
        <div className="gallery-archive-react">
            <div className="gallery-grid">
                {paginatedAlbums.map((album) => (
                    <a href={`/fotogalerias/${album.slug}`} className="gallery-card group" key={album.id}>
                        <div className="gallery-image-wrapper">
                            <img 
                                src={album.cover} 
                                alt={album.title} 
                                loading="lazy"
                                onError={(e) => {
                                    const img = e.currentTarget;
                                    const match = img.src.match(/1\.[a-z]+$/i);
                                    if (match && !img.dataset.triedFallback) {
                                        img.dataset.triedFallback = 'true';
                                        const parts = img.src.split('/');
                                        parts[parts.length - 1] = '1%20(1).webp';
                                        img.src = parts.join('/');
                                    }
                                }}
                            />
                            <div className="photo-count-badge">
                                <Camera size={14} />
                                <span>{album.count}</span>
                            </div>
                        </div>
                        <div className="gallery-info">
                            <div className="gallery-meta">
                                <Trophy size={10} />
                                <span>{album.subtitle}</span>
                            </div>
                            <h2 className="gallery-title">{album.title}</h2>
                            <div className="gallery-footer">
                                <Calendar size={10} />
                                <span>{album.date}</span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="pagination-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`page-number ${currentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 2.5rem;
                    margin-bottom: 4rem;
                }
                .gallery-card {
                    display: flex;
                    flex-direction: column;
                    background: white;
                    border: 4px solid #ffde59;
                    border-radius: 40px 0 0 0;
                    overflow: hidden;
                    text-decoration: none;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    cursor: pointer;
                }
                .gallery-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    border-color: #d1b131;
                }
                .gallery-image-wrapper {
                    position: relative;
                    aspect-ratio: 3/4;
                    overflow: hidden;
                }
                .gallery-image-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.6s ease;
                }
                .gallery-card:hover .gallery-image-wrapper img {
                    transform: scale(1.08);
                }
                .photo-count-badge {
                    position: absolute;
                    bottom: 0px;
                    right: 0px;
                    background: #ffde59;
                    color: #151e42;
                    padding: 0.5rem 1rem;
                    font-weight: 900;
                    font-size: 0.8rem;
                    border-top-left-radius: 15px;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    z-index: 5;
                }
                .gallery-info {
                    padding: 1.5rem;
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                }
                .gallery-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #999;
                    margin-bottom: 0.5rem;
                    letter-spacing: 0.5px;
                }
                .gallery-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.8rem;
                    line-height: 1.1;
                    color: #151e42;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    flex-grow: 1;
                }
                .gallery-footer {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: #ccc;
                    text-transform: uppercase;
                    border-top: 1px solid #f0f0f0;
                    padding-top: 1rem;
                }
                
                .pagination-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 2rem 0;
                }
                .pagination-btn {
                    padding: 0.75rem;
                    border-radius: 12px;
                    border: 2px solid #f0f0f0;
                    background: white;
                    transition: all 0.3s;
                }
                .pagination-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .pagination-btn:not(:disabled):hover {
                    border-color: #ffde59;
                    transform: scale(1.1);
                }
                .pagination-numbers {
                    display: flex;
                    gap: 0.5rem;
                }
                .page-number {
                    width: 3rem;
                    height: 3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    border: 2px solid #f0f0f0;
                    background: white;
                    font-weight: 900;
                    color: #999;
                    transition: all 0.3s;
                }
                .page-number.active {
                    background: #ffde59;
                    border-color: #ffde59;
                    color: #151e42;
                    transform: scale(1.1);
                    box-shadow: 0 10px 20px rgba(255, 222, 89, 0.2);
                }
                .page-number:hover:not(.active) {
                    border-color: #ffde59;
                }

                @media (max-width: 640px) {
                    .gallery-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }
                    .gallery-title {
                        font-size: 1.3rem;
                    }
                    .gallery-info {
                        padding: 1rem;
                    }
                    .gallery-footer, .gallery-meta {
                        display: none;
                    }
                }
            ` }} />
        </div>
    );
};

export default GalleryArchive;
