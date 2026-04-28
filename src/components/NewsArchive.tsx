import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Search, X } from 'lucide-react';


interface Noticia {
    id: string;
    title: string;
    subtitle?: string;
    slug: string;
    category?: string;
    publishDate?: string;
    createdAt?: string;
    updatedAt?: string;
    featuredImage?: any;
}

interface NewsArchiveProps {
    noticias: Noticia[];
}

const PAGE_SIZE = 20;

const NewsArchive: React.FC<NewsArchiveProps> = ({ noticias }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const categories = useMemo(() => {
        const cats: string[] = [];
        noticias.forEach(n => {
            const cat = (n.category || 'ACTUALIDAD').toUpperCase();
            if (!cats.includes(cat)) cats.push(cat);
        });
        return cats;
    }, [noticias]);

    const filteredNoticias = useMemo(() => {
        let result = noticias;
        if (selectedCategory && selectedCategory !== 'TODAS') {
            result = result.filter(n => (n.category || 'ACTUALIDAD').toUpperCase() === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(n =>
                n.title?.toLowerCase().includes(q) ||
                n.subtitle?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [noticias, selectedCategory, searchQuery]);

    const visibleNoticias = filteredNoticias.slice(0, visibleCount);
    const hasMore = visibleCount < filteredNoticias.length;

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => prev + PAGE_SIZE);
                }
            },
            { rootMargin: '300px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [visibleCount, hasMore]);

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(prev => prev === cat ? 'TODAS' : cat);
    };

    const handleSearch = (q: string) => {
        setSearchQuery(q);
    };

    return (
        <div className="news-archive-react">
            <div className="news-search-wrapper">
                <div className="news-search-box">
                    <input
                        type="text"
                        placeholder="Buscar noticias..."
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        className="news-search-input"
                    />
                    <button
                        onClick={() => searchQuery ? handleSearch('') : undefined}
                        className="news-search-clear"
                        aria-label={searchQuery ? 'Limpiar búsqueda' : 'Buscar'}
                    >
                        {searchQuery ? <X size={20} /> : <Search size={20} />}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-12 px-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-6 py-2 rounded-full font-bold text-sm tracking-wider transition-all border-2
                            ${selectedCategory === cat
                                ? 'bg-[#ffde59] border-[#ffde59] text-[#151e42] shadow-md'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-[#ffde59] hover:text-[#151e42]'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="news-list-container flex flex-col gap-8 mb-16">
                {visibleNoticias.length > 0 ? (
                    visibleNoticias.map((noticia: Noticia) => (
                        <a href={`/noticias/${noticia.slug}`} className="archive-card group" key={noticia.id}>
                            <div className="archive-image">
                                <img
                                    src={noticia.featuredImage?.fields?.file?.url ? `https:${noticia.featuredImage.fields.file.url}?fm=webp&w=760&h=480&q=80&fit=fill` : "/assets/background/stadium.webp"}
                                    alt={noticia.title}
                                    loading="lazy"
                                />
                                <span className="archive-tag">{noticia.category || "ACTUALIDAD"}</span>
                            </div>
                            <div className="archive-info">
                                <time className="archive-date">
                                    {new Date(noticia.createdAt || noticia.updatedAt || "").toLocaleDateString("es-ES", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric"
                                    }).toUpperCase()}
                                </time>
                                <h2 className="archive-title">{noticia.title}</h2>
                                <p className="archive-subtitle">{noticia.subtitle}</p>
                            </div>
                        </a>
                    ))
                ) : (
                    <div className="py-24 text-center">
                        <Activity className="mx-auto text-gray-200 mb-4" size={64} />
                        <p className="text-gray-400 font-bold text-xl">
                            {searchQuery.trim()
                                ? `No hay resultados para "${searchQuery}"`
                                : 'No hay noticias en esta sección'}
                        </p>
                    </div>
                )}
            </div>

            <div ref={sentinelRef} className="h-4" />

            <style dangerouslySetInnerHTML={{
                __html: `
                .archive-card {
                    display: flex;
                    background: white;
                    border: 4px solid #ffde59;
                    border-radius: 40px 0 0 0;
                    overflow: hidden;
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    position: relative;
                }
                .archive-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    border-color: #d1b131; /* Subtle darken on hover */
                }
                .archive-image {
                    width: 380px;
                    min-width: 380px;
                    height: 240px;
                    overflow: hidden;
                    position: relative;
                }
                .archive-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.6s ease;
                }
                .archive-card:hover .archive-image img {
                    transform: scale(1.08);
                }
                .archive-tag {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    background: #ffde59;
                    color: #151e42;
                    padding: 0.6rem 1.5rem;
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.1rem;
                    border-top-left-radius: 20px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    z-index: 5;
                    font-weight: bold;
                }
                .archive-info {
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    flex-grow: 1;
                }
                .archive-date {
                    font-size: 0.85rem;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    margin-bottom: 0.75rem;
                    color: #000;
                }
                .archive-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 2.8rem;
                    line-height: 1;
                    color: #151e42;
                    margin-bottom: 0.75rem;
                    text-transform: uppercase;
                    transition: color 0.3s ease;
                }
                .archive-card:hover .archive-title {
                    color: #000;
                }
                .archive-subtitle {
                    font-size: 1rem;
                    color: #666;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    max-width: 800px;
                }

                @media (max-width: 900px) {
                    .archive-card {
                        flex-direction: column;
                        border-radius: 30px 0 0 0;
                    }
                    .archive-image {
                        width: 100%;
                        min-width: 100%;
                        height: 220px;
                    }
                    .archive-title {
                        font-size: 1.8rem;
                    }
                    .archive-subtitle {
                        display: none;
                    }
                    .archive-info {
                        padding: 1.5rem;
                    }
                    .archive-card:hover {
                        transform: translateY(-5px);
                    }
                }
                .news-search-wrapper {
                    display: flex;
                    justify-content: center;
                    padding: 1rem 0 1.5rem;
                }
                .news-search-box {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    max-width: 600px;
                    border: 2px solid #ccc;
                    border-radius: 25px;
                    overflow: hidden;
                    transition: border-color 0.3s ease;
                    background: #fff;
                }
                .news-search-box:hover,
                .news-search-box:focus-within {
                    border-color: #ffde59;
                }
                .news-search-icon {
                    display: none;
                }
                .news-search-input {
                    flex-grow: 1;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    outline: none;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    color: #151e42;
                    background: transparent;
                }
                .news-search-input::placeholder {
                    color: #aaa;
                }
                .news-search-clear {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #aaa;
                    padding: 0.75rem 1.25rem;
                    transition: color 0.3s ease;
                }
                .news-search-clear:hover {
                    color: #ffde59;
                }
            ` }} />
        </div>
    );
};

export default NewsArchive;
