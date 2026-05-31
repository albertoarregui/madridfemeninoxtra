import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import { getFlagSrc } from '../utils/flags';

function generateSlug(text: string | null | undefined): string {
    if (!text) return 'desconocido';
    return text.toString().toLowerCase()
        .trim()
        .replace(/\u00f8/g, 'o').replace(/\u00d8/g, 'O')
        .replace(/\u00f6/g, 'o').replace(/\u00d6/g, 'O')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

interface Referee {
    id_arbitra: string | number;
    nombre: string;
    foto_url: string | null;
    iso: string | null;
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
            return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" style={{ color: 'rgba(212,168,67,0.6)' }} />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-yellow-400" />
            : <ArrowDown className="w-3 h-3 ml-1 text-yellow-400" />;
    };

    const SortableHeader = ({ label, sortKey, align = 'center', className = '' }: { label: string, sortKey: string, align?: 'left' | 'center' | 'right', className?: string }) => (
        <th
            className={`py-4 px-4 font-bold cursor-pointer transition-colors select-none ${className}`}
            style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', color: 'rgba(212,168,67,0.75)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
            onClick={() => requestSort(sortKey)}
        >
            <div className={`flex items-center ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="w-full max-w-7xl mx-auto overflow-hidden mb-10" style={{ borderRadius: '8px', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(6,13,28,0.95)' }}>
            <div className="overflow-x-auto referees-scrollbar">
                <table className="w-full border-collapse text-left min-w-[800px]">
                    <thead>
                        <tr className="text-xs font-bold whitespace-nowrap" style={{ background: 'rgba(212,168,67,0.08)', borderBottom: '1px solid rgba(212,168,67,0.15)' }}>
                            <th className="sticky left-0 z-30 py-3 px-2 text-center w-[50px] min-w-[50px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', color: 'rgba(212,168,67,0.75)', background: 'rgba(212,168,67,0.08)', borderRight: '1px solid rgba(212,168,67,0.1)' }}>
                                #
                            </th>
                            <SortableHeader
                                sortKey="nombre"
                                label="Árbitra"
                                className="sticky left-[50px] z-30 shadow-[5px_0_10px_rgba(0,0,0,0.3)] min-w-[200px]"
                                align="left"
                            />

                            <th className="py-3 px-2 text-center min-w-[60px]"
                                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', color: 'rgba(212,168,67,0.75)' }}>
                                País
                            </th>

                            <SortableHeader sortKey="stats.played" label="PJ" />

                            <SortableHeader sortKey="stats.wins" label="V" className="" />
                            <SortableHeader sortKey="stats.winPct" label="% V" className="" />

                            <SortableHeader sortKey="stats.draws" label="E" className="" />
                            <SortableHeader sortKey="stats.drawPct" label="% E" className="" />

                            <SortableHeader sortKey="stats.losses" label="D" className="" />
                            <SortableHeader sortKey="stats.lossPct" label="% D" className="" />

                            <SortableHeader sortKey="stats.penaltiesFor" label="P. Fav" className="text-blue-400" />
                            <SortableHeader sortKey="stats.penaltiesAgainst" label="P. Con" className="text-orange-400" />

                            <SortableHeader sortKey="stats.yellowCards" label="TA F" className="text-yellow-400" />
                            <SortableHeader sortKey="stats.yellowCardsAgainst" label="TA C" className="text-orange-400" />

                            <SortableHeader sortKey="stats.redCards" label="TR F" className="" />
                            <SortableHeader sortKey="stats.redCardsAgainst" label="TR C" className="" />

                            <SortableHeader sortKey="stats.foulsCommittedAvg" label="FC/PJ" />
                            <SortableHeader sortKey="stats.foulsReceivedAvg" label="FR/PJ" />
                        </tr>
                    </thead>
                    <tbody className="text-sm" style={{ color: '#f0f0f0' }}>
                        {sortedReferees.map((referee, index) => (
                            <tr
                                key={referee.id_arbitra}
                                className="transition-colors group"
                                style={{ borderBottom: '1px solid rgba(212,168,67,0.08)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                            >
                                <td className="sticky left-0 z-20 py-3 px-2 text-center font-mono w-[50px] min-w-[50px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                                    style={{ color: 'rgba(212,168,67,0.55)', background: 'rgba(6,13,28,0.98)', borderRight: '1px solid rgba(212,168,67,0.08)' }}>
                                    {index + 1}
                                </td>
                                <td className="sticky left-[50px] z-20 py-3 px-3 font-bold shadow-[5px_0_10px_rgba(0,0,0,0.3)] truncate min-w-[200px]"
                                    style={{ background: 'rgba(6,13,28,0.98)', borderRight: '1px solid rgba(212,168,67,0.08)', color: '#f0f0f0' }}
                                    title={referee.nombre}>
                                    <a href={`/arbitras/${generateSlug(referee.nombre)}`}
                                        className="transition-colors whitespace-normal break-words leading-tight block"
                                        style={{ color: '#f0f0f0' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#f0f0f0')}>
                                        {referee.nombre}
                                    </a>
                                </td>

                                <td className="py-3 px-2 text-center">
                                    {referee.iso ? (
                                        <img
                                            src={getFlagSrc(referee.iso)}
                                            alt={referee.iso}
                                            className="w-6 h-auto mx-auto shadow-sm rounded-sm"
                                            title={referee.iso}
                                        />
                                    ) : '-'}
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: '#f0f0f0' }}>
                                    {referee.stats.played}
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(74,222,128,0.9)', background: 'rgba(74,222,128,0.06)' }}>
                                    {referee.stats.wins}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(74,222,128,0.9)', background: 'rgba(74,222,128,0.06)' }}>
                                    {referee.stats.winPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(148,163,184,0.8)', background: 'rgba(148,163,184,0.06)' }}>
                                    {referee.stats.draws}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(148,163,184,0.8)', background: 'rgba(148,163,184,0.06)' }}>
                                    {referee.stats.drawPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(248,113,113,0.85)', background: 'rgba(248,113,113,0.06)' }}>
                                    {referee.stats.losses}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(248,113,113,0.85)', background: 'rgba(248,113,113,0.06)' }}>
                                    {referee.stats.lossPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-blue-400" style={{ color: '#f0f0f0' }}>
                                    {referee.stats.penaltiesFor}
                                </td>
                                <td className="py-3 px-2 text-center font-bold" style={{ color: '#f0f0f0' }}>
                                    {referee.stats.penaltiesAgainst}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-yellow-400">
                                    {referee.stats.yellowCards}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-orange-400">
                                    {referee.stats.yellowCardsAgainst}
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: '#f0f0f0' }}>
                                    {referee.stats.redCards}
                                </td>
                                <td className="py-3 px-2 text-center font-bold" style={{ color: '#f0f0f0' }}>
                                    {referee.stats.redCardsAgainst}
                                </td>

                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: '#f0f0f0' }}>
                                    {referee.stats.foulsCommittedAvg}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: '#f0f0f0' }}>
                                    {referee.stats.foulsReceivedAvg}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .referees-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    background: rgba(6,13,28,0.95);
                }
                .referees-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(212,168,67,0.3);
                    border-radius: 4px;
                }
                .referees-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(212,168,67,0.55);
                }
            `}</style>
        </div>
    );
};

export default RefereesTable;


