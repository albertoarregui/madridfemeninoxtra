
import React, { useMemo, useState } from 'react';
import { STATS_TRANSLATIONS } from '../../utils/stats-mapper';
import { getDisplayName, getPlayerImage, getUrlSlug, getImageSlug } from '../../utils/player-images';

interface StatsTableProps {
    data: any[];
    tableType: string;
    per90: boolean;
    playerImageMap: Record<string, string>;
}

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
};

const IconSortUp = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-up"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 15l6 -6l6 6" /></svg>
);

const IconSortDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg>
);

export const StatsTable: React.FC<StatsTableProps> = ({ data, per90, playerImageMap }) => {

    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'minutes', direction: 'desc' });

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'player') {
                const nameA = a.player.toLowerCase();
                const nameB = b.player.toLowerCase();
                return sortConfig.direction === 'asc'
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }

            if (valA === undefined || valA === null) valA = 0;
            if (valB === undefined || valB === null) valB = 0;

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });
    }, [data, sortConfig]);

    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];
        const availableKeys = Object.keys(data[0]);

        return availableKeys.filter(key => {
            if (key === 'player' || key === 'matches' || key === 'fbref_id' || key === 'nationality' || key === 'position' || key === 'squad') return false;
            if (key.includes('age')) return false;

            const hiddenStats = ['games_starts', 'minutes_90s', 'cards_yellow', 'cards_red'];
            if (hiddenStats.includes(key)) return false;

            if (per90) {
                return key.includes('per90') || key === 'minutes' || key === 'games';
            } else {
                return !key.includes('per90');
            }
        });
    }, [data, per90]);

    const topScrollRef = React.useRef<HTMLDivElement>(null);
    const bottomScrollRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = (source: 'top' | 'bottom') => {
        const top = topScrollRef.current;
        const bottom = bottomScrollRef.current;
        if (!top || !bottom) return;

        if (source === 'top') {
            bottom.scrollLeft = top.scrollLeft;
        } else {
            top.scrollLeft = bottom.scrollLeft;
        }
    };

    React.useEffect(() => {
        const top = topScrollRef.current;
        const bottom = bottomScrollRef.current;
        if (!top || !bottom) return;

        const table = bottom.querySelector('table');
        if (table) {
            const width = table.offsetWidth;
            const spacer = top.querySelector('div');
            if (spacer) spacer.style.width = `${width}px`;
        }
    }, [data, columns]);

    if (data.length === 0) return <div className="text-gray-500 text-center p-10 italic">No hay datos disponibles para esta selección.</div>;

    const renderSortIcon = (keyName: string) => {
        const isActive = sortConfig.key === keyName;
        if (!isActive) return <span className="text-gray-200 group-hover:text-[#ffde59]/50"><IconSortDown /></span>;
        return sortConfig.direction === 'asc'
            ? <span className="text-[#ffde59]"><IconSortUp /></span>
            : <span className="text-[#ffde59]"><IconSortDown /></span>;
    };

    return (
        <div className="w-full">
            {/* Top Scrollbar */}
            <div
                ref={topScrollRef}
                onScroll={() => handleScroll('top')}
                className="overflow-x-auto w-full mb-1"
                style={{ height: '20px' }}
            >
                <div style={{ height: '1px' }}></div> {/* Spacer set by effect */}
            </div>

            {/* Table Container */}
            <div
                ref={bottomScrollRef}
                onScroll={() => handleScroll('bottom')}
                className="overflow-x-auto pb-4"
            >
                <table className="w-full text-left border-collapse min-w-max">
                    <thead className="bg-[#f8f9fa] border-b-2 border-gray-200">
                        <tr>
                            {/* Rank Column */}
                            <th
                                scope="col"
                                className="px-2 py-4 sticky left-0 bg-[#f8f9fa] z-30 text-xs font-black text-[#151e42] uppercase tracking-wider text-center w-10 border-r border-gray-200"
                            >
                                #
                            </th>

                            {/* Player Column */}
                            <th
                                scope="col"
                                className="px-4 py-4 sticky left-10 bg-[#f8f9fa] z-30 text-xs font-black text-[#151e42] uppercase tracking-wider group border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:text-[#ffde59] transition-colors"
                                onClick={() => handleSort('player')}
                            >
                                <div className="flex items-center gap-1 justify-between">
                                    Jugadora
                                    {renderSortIcon('player')}
                                </div>
                            </th>

                            {columns.map(col => {
                                if (col === 'player' || col === 'games' || col === 'minutes') return null;
                                return (
                                    <th
                                        key={col}
                                        scope="col"
                                        className="px-4 py-4 text-xs font-black text-[#151e42] uppercase tracking-wider cursor-pointer hover:text-[#ffde59] transition-colors whitespace-nowrap text-center group"
                                        onClick={() => handleSort(col)}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            {STATS_TRANSLATIONS[col] || col.replace(/_/g, ' ')}
                                            {renderSortIcon(col)}
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {sortedData.map((row, idx) => {
                            const imageSlug = row.player.trim().toLowerCase()
                                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                .replace(/\s+/g, '_');

                            const img = getPlayerImage(imageSlug, playerImageMap);
                            const displayName = getDisplayName(row.player);
                            const urlSlug = displayName.trim().toLowerCase()
                                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                .replace(/\s+/g, '-');

                            return (
                                <tr key={idx} className="hover:bg-[#ffde59]/20 transition-colors duration-150 group">
                                    {/* Rank */}
                                    <td className="px-2 py-3 sticky left-0 bg-white group-hover:bg-[#ffde59]/20 z-20 text-center font-black text-gray-300 text-xs border-r border-gray-100">
                                        {idx + 1}.
                                    </td>

                                    {/* Player Name */}
                                    <td className="px-4 py-3 sticky left-10 bg-white group-hover:bg-[#ffde59]/20 z-20 whitespace-normal min-w-[200px] border-b border-gray-100 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        <a href={`/jugadoras/${urlSlug}`} className="flex items-center gap-3 group/link">
                                            <div className={`w-10 h-10 flex-shrink-0 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 p-0.5 flex items-center justify-center ${img ? '' : 'opacity-50'}`}>
                                                {img ? (
                                                    <img src={img} alt={displayName} className="w-full h-full object-cover object-top" />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" /></svg>
                                                )}
                                            </div>
                                            {/* Hover color #ffde59 handled by parent class, but specified explicit text hover color from user request */}
                                            <span className="text-sm font-bold text-[#151e42] group-hover/link:text-[#ffde59] transition-colors leading-tight">{displayName}</span>
                                        </a>
                                    </td>

                                    {columns.map(col => {
                                        if (col === 'player' || col === 'games' || col === 'minutes') return null;
                                        let val = row[col];
                                        let displayVal = val;

                                        if (val === undefined || val === null || val === 0) {
                                            if (val === undefined || val === null) displayVal = '-';
                                        } else if (typeof val === 'number') {
                                            displayVal = Number.isInteger(val) ? val : val.toFixed(2);
                                        }

                                        return (
                                            <td key={col} className="px-4 py-3 text-sm text-[#151e42] text-center font-variant-numeric tabular-nums">
                                                {displayVal}
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
