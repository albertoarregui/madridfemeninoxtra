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
                <button className="nav-arrow left" onClick={prevPhoto}>
                    <ChevronLeft size={32} />
                </button>

                <div className="image-container">
                    <DynamicImage
                        src={album.photos[currentIndex]}
                        alt={`Foto ${currentIndex + 1} de ${album.title}`}
                        className="main-photo"
                    />
                </div>

                <button className="nav-arrow right" onClick={nextPhoto}>
                    <ChevronRight size={32} />
                </button>
            </div>

            <div className="thumbnails-wrapper">
                <div className="thumbnails-scroll no-scrollbar" ref={scrollRef}>
                    {album.photos.map((photo, index) => (
                        <div
                            key={index}
                            className={`thumb-item ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                        >
                            <DynamicImage src={photo} alt={`Miniatura ${index + 1}`} />
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
                    background: #fdfdfd;
                    padding: 2rem;
                    min-height: 60vh;
                }
                .image-container {
                    position: relative;
                    max-width: 90%;
                    max-height: 75vh;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.15);
                    border: 8px solid white;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .main-photo {
                    width: auto;
                    height: auto;
                    max-width: 100%;
                    max-height: 75vh;
                    object-fit: contain;
                }
                .nav-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 10;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #151e42;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }
                .nav-arrow:hover {
                    background: #ffde59;
                    transform: translateY(-50%) scale(1.1);
                    box-shadow: 0 15px 30px rgba(255, 222, 89, 0.3);
                }
                .nav-arrow.left { left: 2rem; }
                .nav-arrow.right { right: 2rem; }

                .thumbnails-wrapper {
                    padding: 1.5rem 0;
                    border-top: 1px solid #f0f0f0;
                    background: #fff;
                }
                .thumbnails-scroll {
                    display: flex;
                    gap: 1rem;
                    overflow-x: auto;
                    padding-bottom: 0.5rem;
                    -webkit-overflow-scrolling: touch;
                }
                .thumb-item {
                    position: relative;
                    min-width: 120px;
                    height: 80px;
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.3s;
                    border: 3px solid transparent;
                }
                .thumb-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.6;
                    transition: all 0.3s;
                }
                .thumb-item:hover img {
                    opacity: 1;
                }
                .thumb-item.active {
                    border-color: #ffde59;
                    transform: scale(1.05);
                }
                .thumb-item.active img {
                    opacity: 1;
                }
                .active-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(255, 222, 89, 0.1);
                }

                @media (max-width: 768px) {
                    .main-stage { padding: 1rem; min-height: 40vh; }
                    .nav-arrow { width: 44px; height: 44px; }
                    .nav-arrow.left { left: 1rem; }
                    .nav-arrow.right { right: 1rem; }
                    .image-container { max-width: 100%; border-width: 4px; }
                    .thumb-item { min-width: 80px; height: 60px; }
                }
            ` }} />
        </div>
    );
};

export default GalleryViewer;
