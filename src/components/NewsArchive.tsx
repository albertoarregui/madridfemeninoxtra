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

const PAGE_SIZE = 10;

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
                        style={selectedCategory === cat
                            ? { background: '#d4a843', borderColor: '#d4a843', color: '#060d1c', border: '1px solid #d4a843', borderRadius: '50px', padding: '0.4rem 1.2rem', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'all 0.2s ease' }
                            : { background: 'transparent', borderColor: 'rgba(212,168,67,0.25)', color: 'rgba(212,168,67,0.65)', border: '1px solid rgba(212,168,67,0.25)', borderRadius: '50px', padding: '0.4rem 1.2rem', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="news-list-container flex flex-col gap-8 mb-16">
                {visibleNoticias.length > 0 ? (
                    visibleNoticias.map((noticia: Noticia) => (
                        <a href={`/noticias/${noticia.slug}`} className="archive-card group" key={noticia.id}>
                            <div className="archive-inner">
                                <div className="archive-image">
                                    <img
                                        src={noticia.featuredImage?.fields?.file?.url ? `https:${noticia.featuredImage.fields.file.url}?fm=webp&w=760&h=480&q=80&fit=fill` : "/og.png"}
                                        alt={noticia.title}
                                        loading="lazy"
                                    />
                                </div>
                                <div className="archive-info">
                                    <div className="archive-meta">
                                        <span className="archive-tag">{noticia.category || "ACTUALIDAD"}</span>
                                        <time className="archive-date">
                                            {new Date(noticia.createdAt || noticia.updatedAt || "").toLocaleDateString("es-ES", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric"
                                            }).toUpperCase()}
                                        </time>
                                    </div>
                                    <h2 className="archive-title">{noticia.title}</h2>
                                    <p className="archive-subtitle">{noticia.subtitle}</p>
                                </div>
                            </div>
                        </a>
                    ))
                ) : (
                    <div className="py-24 text-center">
                        <Activity style={{ color: 'rgba(212,168,67,0.35)', margin: '0 auto 1rem' }} size={64} />
                        <p style={{ color: 'rgba(200,210,220,0.5)', fontFamily: 'DM Sans, sans-serif', fontSize: '1.1rem' }}>
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
                    display: block;
                    background: rgba(212,168,67,0.14);
                    padding: 1px;
                    border-radius: 22px 0 22px 0;
                    overflow: hidden;
                    text-decoration: none;
                    color: inherit;
                    transition: transform 0.3s ease, box-shadow 0.35s ease;
                    position: relative;
                }
                .archive-card::before {
                    content: "";
                    position: absolute;
                    inset: -100%;
                    background: conic-gradient(
                        from 0deg,
                        transparent 0%,
                        transparent 80%,
                        rgba(212,168,67,0.4) 86%,
                        #d4a843 90%,
                        #f5d483 92%,
                        #d4a843 94%,
                        transparent 100%
                    );
                    z-index: 0;
                    opacity: 0;
                    transition: opacity 0.35s ease;
                    animation: archive-spin 1.8s linear infinite paused;
                }
                @keyframes archive-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .archive-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
                }
                .archive-card:hover::before {
                    opacity: 1;
                    animation-play-state: running;
                }
                .archive-inner {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: stretch;
                    width: 100%;
                    background: rgba(8,16,34,0.92);
                    border-radius: 21px 0 21px 0;
                    overflow: hidden;
                }
                .archive-image {
                    width: 380px;
                    min-width: 380px;
                    align-self: stretch;
                    min-height: 240px;
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
                .archive-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                }
                .archive-tag {
                    background: #d4a843;
                    color: #060d1c;
                    padding: 0.15rem 0.6rem;
                    font-family: 'Cinzel', serif;
                    font-size: 0.62rem;
                    letter-spacing: 0.15em;
                    border-radius: 50px;
                    text-transform: uppercase;
                    line-height: 1.6;
                    white-space: nowrap;
                }
                .archive-info {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    flex-grow: 1;
                    background: transparent;
                }
                .archive-date {
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.7rem;
                    letter-spacing: 0.12em;
                    color: rgba(212,168,67,0.6);
                }
                .archive-title {
                    font-family: 'Cinzel', serif;
                    font-size: clamp(1.2rem, 2.5vw, 1.8rem);
                    line-height: 1.25;
                    color: #f0f0f0;
                    margin-bottom: 0.75rem;
                    transition: color 0.3s ease;
                }
                .archive-card:hover .archive-title {
                    color: #d4a843;
                }
                .archive-subtitle {
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.88rem;
                    color: rgba(200,210,220,0.6);
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    max-width: 800px;
                }

                @media (max-width: 900px) {
                    .archive-inner {
                        flex-direction: column;
                    }
                    .archive-image {
                        width: 100%;
                        min-width: 100%;
                        height: 220px;
                    }
                    .archive-title {
                        font-size: 1.2rem;
                    }
                    .archive-subtitle {
                        display: none;
                    }
                    .archive-info {
                        padding: 1.5rem;
                    }
                    .archive-card:hover {
                        transform: translateY(-4px);
                    }
                }

                @media (max-width: 560px) {
                    .news-list-container {
                        display: grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        column-gap: 0.85rem !important;
                        row-gap: 1.35rem !important;
                        align-items: start;
                    }
                    .archive-card {
                        border-radius: 14px 0 14px 0;
                    }
                    .archive-card:hover {
                        transform: none;
                        box-shadow: none;
                    }
                    .archive-inner {
                        flex-direction: column;
                        border-radius: 13px 0 13px 0;
                        height: 100%;
                    }
                    .archive-image {
                        width: 100%;
                        min-width: 0;
                        height: 104px;
                        min-height: 0;
                    }
                    .archive-info {
                        padding: 0.7rem 0.75rem 0.85rem;
                    }
                    .archive-meta {
                        gap: 0.4rem;
                        margin-bottom: 0.45rem;
                        flex-wrap: wrap;
                    }
                    .archive-tag {
                        font-size: 0.5rem;
                        padding: 0.1rem 0.45rem;
                        letter-spacing: 0.08em;
                    }
                    .archive-date {
                        font-size: 0.58rem;
                        letter-spacing: 0.05em;
                    }
                    .archive-title {
                        font-size: 0.84rem;
                        line-height: 1.28;
                        margin-bottom: 0;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .archive-subtitle {
                        display: none;
                    }

                    .news-list-container > .archive-card:first-child {
                        grid-column: 1 / -1;
                    }
                    .news-list-container > .archive-card:first-child .archive-image {
                        height: 172px;
                    }
                    .news-list-container > .archive-card:first-child .archive-title {
                        font-size: 1.05rem;
                        -webkit-line-clamp: 3;
                    }
                    .news-list-container > .archive-card:first-child .archive-subtitle {
                        display: -webkit-box;
                        font-size: 0.78rem;
                        -webkit-line-clamp: 2;
                        margin-top: 0.4rem;
                    }
                }
                @media (hover: none) {
                    .archive-card::before {
                        display: none;
                    }
                    .archive-card:hover {
                        transform: none;
                        box-shadow: none;
                    }
                    .archive-card:hover .archive-image img {
                        transform: none;
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
                    border: 1px solid rgba(212,168,67,0.25);
                    border-radius: 25px;
                    overflow: hidden;
                    transition: border-color 0.3s ease;
                    background: rgba(6,13,28,0.95);
                }
                .news-search-box:hover,
                .news-search-box:focus-within {
                    border-color: rgba(212,168,67,0.6);
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
                    font-family: 'DM Sans', sans-serif;
                    color: #f0f0f0;
                    background: transparent;
                }
                .news-search-input::placeholder {
                    color: rgba(150,160,175,0.5);
                }
                .news-search-clear {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: rgba(150,160,175,0.5);
                    padding: 0.75rem 1.25rem;
                    transition: color 0.3s ease;
                }
                .news-search-clear:hover {
                    color: #d4a843;
                }
            ` }} />
        </div>
    );
};

export default NewsArchive;
