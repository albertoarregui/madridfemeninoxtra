import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface GalleryViewerProps {
    album: {
        title: string;
        subtitle: string;
        date: string;
        photos: string[];
    };
    children?: React.ReactNode;
}

const DynamicImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [triedExtensions, setTriedExtensions] = useState<string[]>([]);
    const extensions = ['.webp', '.jpg', '.png'];

    const handleError = () => {
        const currentExt = extensions.find(ext => currentSrc.toLowerCase().endsWith(ext));
        const nextExt = extensions.find(ext => !triedExtensions.includes(ext) && ext !== currentExt);

        if (nextExt) {
            const baseUrl = currentSrc.substring(0, currentSrc.lastIndexOf('.'));
            setTriedExtensions(prev => [...prev, currentExt || '']);
            setCurrentSrc(`${baseUrl}${nextExt}`);
        }
    };

    useEffect(() => {
        setCurrentSrc(src);
        setTriedExtensions([]);
    }, [src]);

    return <img src={currentSrc} alt={alt} className={className} onError={handleError} loading="lazy" />;
};

const GalleryViewer: React.FC<GalleryViewerProps> = ({ album, children }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const nextPhoto = () => {
        setCurrentIndex((prev) => (prev + 1) % album.photos.length);
    };

    const prevPhoto = () => {
        setCurrentIndex((prev) => (prev - 1 + album.photos.length) % album.photos.length);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevPhoto();
            if (e.key === 'ArrowRight') nextPhoto();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    useEffect(() => {
        const carousel = scrollRef.current;
        if (!carousel) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                carousel.scrollLeft += e.deltaY;
            }
        };

        carousel.addEventListener('wheel', handleWheel, { passive: false });
        return () => carousel.removeEventListener('wheel', handleWheel);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            const activeThumb = scrollRef.current.children[currentIndex] as HTMLElement;
            if (activeThumb) {
                activeThumb.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [currentIndex]);

    return (
        <div className="gallery-viewer-container">
            {children}

            <div className="viewer-controls-row flex justify-between items-center px-2 py-4 border-b border-gray-100 mb-6">
                <div className="photo-counter">
                    <span>{currentIndex + 1}</span> / {album.photos.length}
                </div>
                <div className="flex gap-4">
                    <Camera size={20} className="text-gray-300" />
                </div>
            </div>

            <div className="main-stage">
                <div className="image-container">
                    <button className="nav-arrow left" onClick={prevPhoto}>
                        <ChevronLeft size={32} />
                    </button>

                    <DynamicImage
                        src={album.photos[currentIndex]}
                        alt={`Foto ${currentIndex + 1} de ${album.title}`}
                        className="main-photo"
                    />

                    <button className="nav-arrow right" onClick={nextPhoto}>
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>

            <div className="thumbnails-wrapper">
                <div className="thumbnails-scroll no-scrollbar" ref={scrollRef}>
                    {album.photos.map((photo, index) => (
                        <div
                            key={index}
                            className={`thumb-item ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                        >
                            <DynamicImage src={photo} alt={`Miniatura ${index + 1}`} className="thumb-img" />
                            {index === currentIndex && <div className="active-overlay"></div>}
                        </div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .gallery-viewer-container {
                    background: #fff;
                    min-height: calc(100vh - 80px);
                    display: flex;
                    flex-direction: column;
                    padding-bottom: 2rem;
                }
                .photo-counter {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.5rem;
                    color: #ccc;
                    letter-spacing: 2px;
                }
                .photo-counter span {
                    color: #151e42;
                }

                .main-stage {
                    flex-grow: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    padding: 0;
                    min-height: 60vh;
                }
                .image-container {
                    position: relative;
                    max-width: 100%;
                    max-height: 85vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .main-photo {
                    width: auto;
                    height: auto;
                    max-width: 100%;
                    max-height: 85vh;
                    object-fit: contain;
                }
                .nav-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 50;
                    width: 50px;
                    height: 50px;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffde59;
                    transition: all 0.3s;
                    border: none;
                    cursor: pointer;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }
                .nav-arrow:hover {
                    color: #fff;
                    transform: translateY(-50%) scale(1.2);
                }
                .nav-arrow.left { left: 20px; }
                .nav-arrow.right { right: 20px; }

                .thumbnails-wrapper {
                    padding: 1.5rem 0;
                    background: transparent;
                }
                .thumbnails-scroll {
                    display: flex;
                    gap: 0.75rem;
                    overflow-x: auto;
                    padding-bottom: 0.5rem;
                    -webkit-overflow-scrolling: touch;
                }
                .thumb-item {
                    min-width: 100px;
                    height: 65px;
                    border-radius: 6px;
                    overflow: hidden;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.3s;
                    border: 2px solid transparent;
                    background: #eee;
                }
                .thumb-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.5;
                    transition: all 0.3s;
                }
                .thumb-item.active {
                    border-color: #ffde59;
                    transform: scale(1.05);
                    opacity: 1;
                }
                .thumb-item.active .thumb-img {
                    opacity: 1;
                }
                .active-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(255, 222, 89, 0.1);
                }

                @media (max-width: 768px) {
                    .main-stage { padding: 0.25rem; min-height: 40vh; }
                    .nav-arrow { width: 44px; height: 44px; }
                    .nav-arrow.left { left: 1rem; }
                    .nav-arrow.right { right: 1rem; }
                    .image-container { max-width: 100%; border: none; box-shadow: none; }
                    .thumb-item { min-width: 80px; height: 55px; }
                    .thumbnails-wrapper { padding: 0.5rem 0; }
                }
            ` }} />
        </div>
    );
};

export default GalleryViewer;
