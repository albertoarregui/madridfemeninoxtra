import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Stadium {
    name: string;
    city: string;
    capacity: string | number;
    imageUrl: string | null;
    slug: string;
    stats: {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        gf: number;
        ga: number;
        gd: number;
        winPct: string;
        drawPct: string;
        lossPct: string;
    };
}

interface StadiumsTableProps {
    stadiums: Stadium[];
}

const StadiumsTable: React.FC<StadiumsTableProps> = ({ stadiums }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'stats.played', direction: 'desc' });

    const sortedStadiums = useMemo(() => {
        let sortableItems = [...stadiums];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const getValue = (item: any, path: string) => {
                    return path.split('.').reduce((o, i) => (o ? o[i] : undefined), item);
                };

                let aValue = getValue(a, sortConfig.key);
                let bValue = getValue(b, sortConfig.key);

                if (typeof aValue === 'string' && sortConfig.key.includes('Pct')) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }

                if (sortConfig.key === 'capacity') {
                    aValue = typeof aValue === 'string' ? parseInt(aValue.replace(/\D/g, '')) || 0 : Number(aValue) || 0;
                    bValue = typeof bValue === 'string' ? parseInt(bValue.replace(/\D/g, '')) || 0 : Number(bValue) || 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [stadiums, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" style={{ color: 'rgba(212,168,67,0.6)' }} />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-yellow-400" />
            : <ArrowDown className="w-3 h-3 ml-1 text-yellow-400" />;
    };

    const SortableHeader = ({ label, sortKey, align = 'center', className = '', title = '' }: { label: string, sortKey: string, align?: 'left' | 'center' | 'right', className?: string, title?: string }) => (
        <th
            className={`py-4 px-4 font-bold cursor-pointer transition-colors select-none ${className}`}
            style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', color: 'rgba(212,168,67,0.75)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
            onClick={() => requestSort(sortKey)}
            title={title}
        >
            <div className={`flex items-center ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="w-full max-w-[1600px] mx-auto overflow-hidden mb-10" style={{ borderRadius: '8px', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(6,13,28,0.95)' }}>
            <div className="overflow-x-auto stadiums-scrollbar">
                <table className="w-full border-collapse text-left min-w-[1000px] md:min-w-[1200px]">
                    <thead>
                        <tr className="text-xs font-bold whitespace-nowrap" style={{ background: 'rgba(212,168,67,0.08)', borderBottom: '1px solid rgba(212,168,67,0.15)' }}>
                            <th className="sticky left-0 z-30 py-3 px-2 text-center w-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', color: 'rgba(212,168,67,0.75)', background: 'rgba(212,168,67,0.08)', borderRight: '1px solid rgba(212,168,67,0.1)' }}>
                                #
                            </th>

                            <SortableHeader
                                sortKey="name"
                                label="Estadio"
                                className="sticky left-10 z-30 shadow-[5px_0_10px_rgba(0,0,0,0.3)] min-w-[160px]"
                                align="left"
                            />

                            <SortableHeader sortKey="city" label="Ciudad" />
                            <SortableHeader sortKey="capacity" label="Capacidad" />

                            <SortableHeader sortKey="stats.played" label="PJ" />

                            <SortableHeader sortKey="stats.wins" label="V" className="" />
                            <SortableHeader sortKey="stats.winPct" label="% V" className="" />

                            <SortableHeader sortKey="stats.draws" label="E" className="" />
                            <SortableHeader sortKey="stats.drawPct" label="% E" className="" />

                            <SortableHeader sortKey="stats.losses" label="D" className="" />
                            <SortableHeader sortKey="stats.lossPct" label="% D" className="" />

                            <SortableHeader sortKey="stats.gf" label="GF" />
                            <SortableHeader sortKey="stats.ga" label="GC" />
                            <SortableHeader sortKey="stats.gd" label="Dif" />
                        </tr>
                    </thead>
                    <tbody className="text-sm" style={{ color: '#f0f0f0' }}>
                        {sortedStadiums.map((stadium, index) => (
                            <tr
                                key={stadium.slug}
                                className="transition-colors group"
                                style={{ borderBottom: '1px solid rgba(212,168,67,0.08)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                            >
                                <td className="sticky left-0 z-20 py-3 px-2 text-center font-mono shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                                    style={{ color: 'rgba(212,168,67,0.55)', background: 'rgba(6,13,28,0.98)', borderRight: '1px solid rgba(212,168,67,0.08)' }}>
                                    {index + 1}
                                </td>

                                <td className="sticky left-10 z-20 py-3 px-3 font-bold shadow-[5px_0_10px_rgba(0,0,0,0.3)] truncate max-w-[160px]"
                                    style={{ background: 'rgba(6,13,28,0.98)', borderRight: '1px solid rgba(212,168,67,0.12)', color: '#f0f0f0' }}
                                    title={stadium.name}>
                                    <a href={`/estadios/${stadium.slug}`}
                                        style={{ color: '#f0f0f0' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#f0f0f0')}
                                        className="transition-colors">
                                        {stadium.name}
                                    </a>
                                </td>

                                <td className="py-3 px-2 truncate max-w-[120px]" style={{ color: 'rgba(200,210,220,0.65)' }} title={stadium.city}>{stadium.city || '-'}</td>
                                <td className="py-3 px-2 text-center font-mono text-xs" style={{ color: 'rgba(200,210,220,0.65)' }}>
                                    {stadium.capacity ? Number(stadium.capacity).toLocaleString() : '-'}
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: '#f0f0f0' }}>
                                    {stadium.stats.played}
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(74,222,128,0.9)', background: 'rgba(74,222,128,0.06)' }}>
                                    {stadium.stats.wins}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(74,222,128,0.9)', background: 'rgba(74,222,128,0.06)' }}>
                                    {stadium.stats.winPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(148,163,184,0.8)', background: 'rgba(148,163,184,0.06)' }}>
                                    {stadium.stats.draws}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(148,163,184,0.8)', background: 'rgba(148,163,184,0.06)' }}>
                                    {stadium.stats.drawPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(248,113,113,0.85)', background: 'rgba(248,113,113,0.06)' }}>
                                    {stadium.stats.losses}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(248,113,113,0.85)', background: 'rgba(248,113,113,0.06)' }}>
                                    {stadium.stats.lossPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-mono" style={{ color: '#f0f0f0' }}>{stadium.stats.gf}</td>
                                <td className="py-3 px-2 text-center font-mono" style={{ color: '#f0f0f0' }}>{stadium.stats.ga}</td>
                                <td className="py-3 px-2 text-center font-mono font-bold" style={{ color: '#f0f0f0' }}>
                                    {stadium.stats.gd > 0 ? `+${stadium.stats.gd}` : stadium.stats.gd}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .stadiums-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    background: rgba(6,13,28,0.95);
                }
                .stadiums-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(212,168,67,0.3);
                    border-radius: 4px;
                }
                .stadiums-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(212,168,67,0.55);
                }
            `}</style>
        </div>
    );
};

export default StadiumsTable;


