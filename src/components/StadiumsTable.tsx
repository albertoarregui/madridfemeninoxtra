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
            return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400 opacity-50" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-[#151e42]" />
            : <ArrowDown className="w-3 h-3 ml-1 text-[#151e42]" />;
    };

    const SortableHeader = ({ label, sortKey, align = 'center', className = '', title = '' }: { label: string, sortKey: string, align?: 'left' | 'center' | 'right', className?: string, title?: string }) => (
        <th
            className={`py-4 px-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none ${className}`}
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
        <div className="w-full max-w-[1600px] mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-xl bg-white mb-10">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left min-w-[1000px] md:min-w-[1200px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-bold whitespace-nowrap">
                            <th className="sticky left-0 bg-gray-50 z-30 py-3 px-2 text-center w-10 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                #
                            </th>

                            <SortableHeader
                                sortKey="name"
                                label="Estadio"
                                className="sticky left-10 bg-gray-50 z-30 border-r-2 border-gray-200 shadow-[5px_0_10px_rgba(0,0,0,0.05)] min-w-[160px]"
                                align="left"
                            />

                            <SortableHeader sortKey="city" label="Ciudad" />
                            <SortableHeader sortKey="capacity" label="Capacidad" />

                            <SortableHeader sortKey="stats.played" label="PJ" />

                            <SortableHeader sortKey="stats.wins" label="V" className="text-green-600 bg-green-50/50" />
                            <SortableHeader sortKey="stats.winPct" label="% V" className="text-green-600 bg-green-50/50" />

                            <SortableHeader sortKey="stats.draws" label="E" className="text-gray-600 bg-gray-50/50" />
                            <SortableHeader sortKey="stats.drawPct" label="% E" className="text-gray-600 bg-gray-50/50" />

                            <SortableHeader sortKey="stats.losses" label="D" className="text-red-500 bg-red-50/50" />
                            <SortableHeader sortKey="stats.lossPct" label="% D" className="text-red-500 bg-red-50/50" />

                            <SortableHeader sortKey="stats.gf" label="GF" />
                            <SortableHeader sortKey="stats.ga" label="GC" />
                            <SortableHeader sortKey="stats.gd" label="Dif" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {sortedStadiums.map((stadium, index) => (
                            <tr
                                key={stadium.slug}
                                className="hover:bg-gray-50 transition-colors group text-gray-700"
                            >
                                <td className="sticky left-0 bg-white group-hover:bg-gray-50 z-20 py-3 px-2 text-center font-mono text-gray-400 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    {index + 1}
                                </td>

                                <td className="sticky left-10 bg-white group-hover:bg-gray-50 z-20 py-3 px-3 border-r-2 border-gray-200 font-bold text-gray-900 shadow-[5px_0_10px_rgba(0,0,0,0.05)] truncate max-w-[160px]" title={stadium.name}>
                                    <a href={`/estadios/${stadium.slug}`} className="hover:text-[#ffde59] transition-colors">
                                        {stadium.name}
                                    </a>
                                </td>

                                <td className="py-3 px-2 text-gray-600 truncate max-w-[120px]" title={stadium.city}>{stadium.city || '-'}</td>
                                <td className="py-3 px-2 text-center font-mono text-xs text-gray-400">
                                    {stadium.capacity ? Number(stadium.capacity).toLocaleString() : '-'}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-gray-900 bg-gray-50/50">
                                    {stadium.stats.played}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-green-600 bg-green-50/30">
                                    {stadium.stats.wins}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-green-700 bg-green-50/30">
                                    {stadium.stats.winPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-gray-500 bg-gray-50/30">
                                    {stadium.stats.draws}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-gray-500 bg-gray-50/30">
                                    {stadium.stats.drawPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-red-500 bg-red-50/30">
                                    {stadium.stats.losses}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-red-600 bg-red-50/30">
                                    {stadium.stats.lossPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-mono text-gray-600">{stadium.stats.gf}</td>
                                <td className="py-3 px-2 text-center font-mono text-gray-600">{stadium.stats.ga}</td>
                                <td className="py-3 px-2 text-center font-mono font-bold text-gray-900">
                                    {stadium.stats.gd > 0 ? `+${stadium.stats.gd}` : stadium.stats.gd}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    background: #f1f5f9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default StadiumsTable;
