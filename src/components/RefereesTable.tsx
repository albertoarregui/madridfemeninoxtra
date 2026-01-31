import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Referee {
    id_arbitra: string | number;
    nombre: string;
    stats: {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        winPct: string;
        drawPct: string;
        lossPct: string;
        penaltiesFor: number;
        penaltiesAgainst: number;
        yellowCards: number;
        redCards: number;
        yellowCardsAgainst: number;
        redCardsAgainst: number;
        foulsCommitted: number;
        foulsReceived: number;
        foulsCommittedAvg: string;
        foulsReceivedAvg: string;
    };
}

interface RefereesTableProps {
    referees: Referee[];
}

const RefereesTable: React.FC<RefereesTableProps> = ({ referees }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'stats.played', direction: 'desc' });

    const sortedReferees = useMemo(() => {
        let sortableItems = [...referees];
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
    }, [referees, sortConfig]);

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

    const SortableHeader = ({ label, sortKey, align = 'center', className = '' }: { label: string, sortKey: string, align?: 'left' | 'center' | 'right', className?: string }) => (
        <th
            className={`py-4 px-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none ${className}`}
            onClick={() => requestSort(sortKey)}
        >
            <div className={`flex items-center ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="w-full max-w-7xl mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-xl bg-white mb-10">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-bold whitespace-nowrap">
                            <th className="sticky left-0 bg-gray-50 z-20 py-3 px-2 text-center w-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                #
                            </th>
                            <SortableHeader
                                sortKey="nombre"
                                label="Árbitra"
                                className="sticky left-10 bg-gray-50 z-20 border-r border-gray-100 shadow-[5px_0_10px_rgba(0,0,0,0.05)] min-w-[160px]"
                                align="left"
                            />

                            <SortableHeader sortKey="stats.played" label="PJ" />

                            <SortableHeader sortKey="stats.wins" label="V" className="text-green-600 bg-green-50/50" />
                            <SortableHeader sortKey="stats.winPct" label="% V" className="text-green-600 bg-green-50/50" />

                            <SortableHeader sortKey="stats.draws" label="E" className="text-gray-600 bg-gray-50/50" />
                            <SortableHeader sortKey="stats.drawPct" label="% E" className="text-gray-600 bg-gray-50/50" />

                            <SortableHeader sortKey="stats.losses" label="D" className="text-red-500 bg-red-50/50" />
                            <SortableHeader sortKey="stats.lossPct" label="% D" className="text-red-500 bg-red-50/50" />

                            <SortableHeader sortKey="stats.penaltiesFor" label="P. Fav" className="text-blue-600" />
                            <SortableHeader sortKey="stats.penaltiesAgainst" label="P. Con" className="text-orange-600" />

                            <SortableHeader sortKey="stats.yellowCards" label="TA F" className="text-yellow-600" />
                            <SortableHeader sortKey="stats.yellowCardsAgainst" label="TA C" className="text-orange-400" />

                            <SortableHeader sortKey="stats.redCards" label="TR F" className="text-red-600" />
                            <SortableHeader sortKey="stats.redCardsAgainst" label="TR C" className="text-red-800" />

                            <SortableHeader sortKey="stats.foulsCommitted" label="FC" className="text-purple-600" />
                            <SortableHeader sortKey="stats.foulsCommittedAvg" label="FC/PJ" className="text-purple-500" />

                            <SortableHeader sortKey="stats.foulsReceived" label="FR" className="text-indigo-600" />
                            <SortableHeader sortKey="stats.foulsReceivedAvg" label="FR/PJ" className="text-indigo-500" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {sortedReferees.map((referee, index) => (
                            <tr
                                key={referee.id_arbitra}
                                className="hover:bg-gray-50 transition-colors group text-gray-700"
                            >
                                <td className="sticky left-0 bg-white group-hover:bg-gray-50 z-10 py-3 px-2 text-center font-mono text-gray-400 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    {index + 1}
                                </td>
                                <td className="sticky left-10 bg-white group-hover:bg-gray-50 z-10 py-3 px-3 border-r border-gray-100 font-bold text-gray-900 shadow-[5px_0_10px_rgba(0,0,0,0.05)] truncate max-w-[160px]" title={referee.nombre}>
                                    <a href={`/arbitras/${referee.nombre.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className="hover:text-[#ffde59] transition-colors">
                                        {referee.nombre}
                                    </a>
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-gray-900 bg-gray-50/50">
                                    {referee.stats.played}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-green-600 bg-green-50/30">
                                    {referee.stats.wins}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-green-700 bg-green-50/30">
                                    {referee.stats.winPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-gray-500 bg-gray-50/30">
                                    {referee.stats.draws}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-gray-500 bg-gray-50/30">
                                    {referee.stats.drawPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-red-500 bg-red-50/30">
                                    {referee.stats.losses}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-red-600 bg-red-50/30">
                                    {referee.stats.lossPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-blue-600">
                                    {referee.stats.penaltiesFor}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-orange-600">
                                    {referee.stats.penaltiesAgainst}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-yellow-600">
                                    {referee.stats.yellowCards}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-orange-400">
                                    {referee.stats.yellowCardsAgainst}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-red-600">
                                    {referee.stats.redCards}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-red-800">
                                    {referee.stats.redCardsAgainst}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-purple-600">
                                    {referee.stats.foulsCommitted}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-purple-500">
                                    {referee.stats.foulsCommittedAvg}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-indigo-600">
                                    {referee.stats.foulsReceived}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-indigo-500">
                                    {referee.stats.foulsReceivedAvg}
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

export default RefereesTable;
