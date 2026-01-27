import React, { useState, useMemo } from 'react';

interface Rival {
    id_club: string | number;
    nombre: string;
    shieldUrl: string;
    ciudad: string;
    pais: string; // ISO code or name for flag
    estadio: string;
    capacidad: string | number;
    slug: string;
    stats: {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        gf: number;
        ga: number;
        gd: number;
        cleanSheets: number;
        winPct: string;
        drawPct: string;
        lossPct: string;
    };
}

interface RivalsTableProps {
    rivals: Rival[];
}

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const RivalsTable: React.FC<RivalsTableProps> = ({ rivals }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'stats.played', direction: 'desc' });

    const sortedRivals = useMemo(() => {
        let sortableItems = [...rivals];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const getValue = (item: any, path: string) => {
                    return path.split('.').reduce((o, i) => (o ? o[i] : undefined), item);
                };

                let aValue = getValue(a, sortConfig.key);
                let bValue = getValue(b, sortConfig.key);

                // Handle numeric percentages
                if (typeof aValue === 'string' && sortConfig.key.includes('Pct')) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }

                // Handle numbers (played, wins, etc are numbers)

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
    }, [rivals, sortConfig]);

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

    const getFlagSrc = (country: string) => {
        if (!country) return '';
        const normalized = country.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/ñ/g, 'n')
            .replace(/\s+/g, '_');

        const map: { [key: string]: string } = {
            'espana': 'es', 'spain': 'es', 'es': 'es',
            'inglaterra': 'gb-eng', 'uk': 'gb',
            'alemania': 'de', 'germany': 'de',
            'francia': 'fr', 'france': 'fr',
            'italia': 'it', 'italy': 'it',
            'portugal': 'pt',
            'suecia': 'se',
            'noruega': 'no',
            'ucrania': 'ua',
            'islandia': 'is',
            'albania': 'al',
            'austria': 'at',
            'republica_checa': 'cz',
            'mexico': 'mx',
            'suiza': 'ch',
            'paises_bajos': 'nl', 'holanda': 'nl'
        };

        const code = map[normalized] || normalized;
        return `https://flagcdn.com/w40/${code}.png`;
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-xl bg-white mb-10">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left min-w-[1200px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-bold whitespace-nowrap">
                            {/* Sticky Columns */}
                            <th className="sticky left-0 bg-gray-50 z-20 py-4 px-4 text-center w-12 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                #
                            </th>
                            <th className="sticky left-12 bg-gray-50 z-20 py-4 px-4 w-16 border-r border-gray-100 text-center">
                                Escudo
                            </th>
                            <SortableHeader
                                sortKey="nombre"
                                label="Rival"
                                className="sticky left-28 bg-gray-50 z-20 border-r border-gray-100 shadow-[5px_0_10px_rgba(0,0,0,0.05)] min-w-[200px]"
                                align="left"
                            />

                            {/* Scrollable Columns */}
                            <SortableHeader sortKey="ciudad" label="Ciudad" />
                            <th className="py-4 px-4 text-center">País</th>
                            <SortableHeader sortKey="estadio" label="Estadio" />
                            <SortableHeader sortKey="capacidad" label="Capacidad" />

                            <SortableHeader sortKey="stats.played" label="Partidos" />

                            <SortableHeader sortKey="stats.wins" label="Victorias" className="text-green-600 bg-green-50/50" />
                            <SortableHeader sortKey="stats.winPct" label="% Vic" className="text-green-600 bg-green-50/50" />

                            <SortableHeader sortKey="stats.draws" label="Empates" className="text-gray-600 bg-gray-50/50" />
                            <SortableHeader sortKey="stats.drawPct" label="% Emp" className="text-gray-600 bg-gray-50/50" />

                            <SortableHeader sortKey="stats.losses" label="Derrotas" className="text-red-500 bg-red-50/50" />
                            <SortableHeader sortKey="stats.lossPct" label="% Der" className="text-red-500 bg-red-50/50" />

                            <SortableHeader sortKey="stats.gf" label="Goles Favor" />
                            <SortableHeader sortKey="stats.ga" label="Goles Contra" />
                            <SortableHeader sortKey="stats.gd" label="Diferencia" />
                            <SortableHeader sortKey="stats.cleanSheets" label="Porterías a cero" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {sortedRivals.map((rival, index) => (
                            <tr
                                key={rival.id_club}
                                className="hover:bg-gray-50 transition-colors group text-gray-700"
                            >
                                {/* Sticky Columns */}
                                <td className="sticky left-0 bg-white group-hover:bg-gray-50 z-10 py-3 px-4 text-center font-mono text-gray-400 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    {index + 1}
                                </td>
                                <td className="sticky left-12 bg-white group-hover:bg-gray-50 z-10 py-3 px-4 border-r border-gray-100 text-center">
                                    <img
                                        src={rival.shieldUrl}
                                        alt={rival.nombre}
                                        className="w-8 h-8 object-contain mx-auto transition-transform group-hover:scale-110"
                                        onError={(e) => (e.target as HTMLImageElement).src = '/assets/escudos/placeholder.png'}
                                    />
                                </td>
                                <td className="sticky left-28 bg-white group-hover:bg-gray-50 z-10 py-3 px-6 border-r border-gray-100 font-bold text-gray-900 shadow-[5px_0_10px_rgba(0,0,0,0.05)]">
                                    <a href={`/rivales/${rival.slug}`} className="hover:text-blue-600 transition-colors">
                                        {rival.nombre}
                                    </a>
                                </td>

                                {/* Scrollable Columns */}
                                <td className="py-3 px-4 text-gray-600">{rival.ciudad}</td>
                                <td className="py-3 px-4 text-center">
                                    <img
                                        src={getFlagSrc(rival.pais)}
                                        alt={rival.pais}
                                        className="w-5 h-auto inline-block rounded-sm shadow-sm opacity-90"
                                        title={rival.pais}
                                    />
                                </td>
                                <td className="py-3 px-4 text-gray-500 whitespace-nowrap" title={rival.estadio}>
                                    {rival.estadio || '-'}
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-xs text-gray-400">
                                    {rival.capacidad !== 0 ? Number(rival.capacidad).toLocaleString() : '-'}
                                </td>

                                <td className="py-3 px-4 text-center font-bold text-gray-900 bg-gray-50/50">
                                    {rival.stats.played}
                                </td>

                                <td className="py-3 px-4 text-center font-bold text-green-600 bg-green-50/30">
                                    {rival.stats.wins}
                                </td>
                                <td className="py-3 px-4 text-center text-xs font-mono text-green-700 bg-green-50/30">
                                    {rival.stats.winPct}%
                                </td>

                                <td className="py-3 px-4 text-center font-bold text-gray-500 bg-gray-50/30">
                                    {rival.stats.draws}
                                </td>
                                <td className="py-3 px-4 text-center text-xs font-mono text-gray-500 bg-gray-50/30">
                                    {rival.stats.drawPct}%
                                </td>

                                <td className="py-3 px-4 text-center font-bold text-red-500 bg-red-50/30">
                                    {rival.stats.losses}
                                </td>
                                <td className="py-3 px-4 text-center text-xs font-mono text-red-600 bg-red-50/30">
                                    {rival.stats.lossPct}%
                                </td>

                                <td className="py-3 px-4 text-center font-mono text-gray-600">{rival.stats.gf}</td>
                                <td className="py-3 px-4 text-center font-mono text-gray-600">{rival.stats.ga}</td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-gray-900">
                                    {rival.stats.gd > 0 ? `+${rival.stats.gd}` : rival.stats.gd}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-blue-500">
                                    {rival.stats.cleanSheets}
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

export default RivalsTable;
