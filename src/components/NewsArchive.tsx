import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';

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

const NewsArchive: React.FC<NewsArchiveProps> = ({ noticias }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
    const [currentPage, setCurrentPage] = useState(1);
    const noticiasPerPage = 20;

    const categories = useMemo(() => {
        const cats: string[] = [];
        noticias.forEach(n => {
            const cat = (n.category || 'ACTUALIDAD').toUpperCase();
            if (!cats.includes(cat)) cats.push(cat);
        });
        return cats;
    }, [noticias]);

    const filteredNoticias = useMemo(() => {
        if (!selectedCategory || selectedCategory === 'TODAS') return noticias;
        return noticias.filter(n => (n.category || 'ACTUALIDAD').toUpperCase() === selectedCategory);
    }, [noticias, selectedCategory]);
    const totalPages = Math.ceil(filteredNoticias.length / noticiasPerPage);
    const paginatedNoticias = useMemo(() => {
        const start = (currentPage - 1) * noticiasPerPage;
        return filteredNoticias.slice(start, start + noticiasPerPage);
    }, [filteredNoticias, currentPage]);

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(prev => prev === cat ? 'TODAS' : cat);
        setCurrentPage(1);
    };

    return (
        <div className="news-archive-react">
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
                {paginatedNoticias.length > 0 ? (
                    paginatedNoticias.map((noticia) => (
                        <a href={`/noticias/${noticia.slug}`} className="archive-card group" key={noticia.id}>
                            <div className="archive-image">
                                <img
                                    src={noticia.featuredImage?.fields?.file?.url ? `https:${noticia.featuredImage.fields.file.url}` : "/assets/background/stadium.webp"}
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
                        <p className="text-gray-400 font-bold text-xl">No hay noticias en esta sección</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 py-12 border-t border-gray-100">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-3 rounded-xl border-2 border-gray-100 disabled:opacity-20 hover:border-[#ffde59] transition-all bg-white shadow-sm"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg transition-all border-2
                                    ${currentPage === page
                                        ? 'bg-[#ffde59] border-[#ffde59] text-[#151e42] shadow-md scale-110'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-3 rounded-xl border-2 border-gray-100 disabled:opacity-20 hover:border-[#ffde59] transition-all bg-white shadow-sm"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

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
            ` }} />
        </div>
    );
};

export default NewsArchive;
