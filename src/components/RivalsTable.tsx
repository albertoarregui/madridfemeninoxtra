import React, { useState, useMemo } from 'react';

interface Rival {
    id_club: string | number;
    nombre: string;
    shieldUrl: string;
    ciudad: string;
    pais: string;
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
            'escocia': 'gb-sct', 'scotland': 'gb-sct',
            'paises_bajos': 'nl', 'holanda': 'nl'
        };

        const code = map[normalized] || normalized;
        return `https://flagcdn.com/w40/${code}.png`;
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-xl bg-white mb-10">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left min-w-[1000px] md:min-w-[1200px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-bold whitespace-nowrap">

                            <th className="sticky left-0 bg-gray-50 z-30 py-3 px-2 text-center w-[50px] min-w-[50px] border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                #
                            </th>
                            <th className="sticky left-[50px] bg-gray-50 z-30 py-3 px-2 w-[60px] min-w-[60px] border-r border-gray-200 text-center">
                                Escudo
                            </th>
                            <SortableHeader
                                sortKey="nombre"
                                label="Rival"
                                className="sticky left-[110px] bg-gray-50 z-30 border-r-2 border-gray-200 shadow-[5px_0_10px_rgba(0,0,0,0.05)] min-w-[160px]"
                                align="left"
                            />

                            <SortableHeader sortKey="ciudad" label="Ciudad" />
                            <th className="py-3 px-2 text-center">País</th>
                            <SortableHeader sortKey="estadio" label="Estadio" />
                            <SortableHeader sortKey="capacidad" label="Cap" />

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
                            <SortableHeader sortKey="stats.cleanSheets" label="PaC" title="Porterías a cero" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {sortedRivals.map((rival, index) => (
                            <tr
                                key={rival.id_club}
                                className="hover:bg-gray-50 transition-colors group text-gray-700"
                            >
                                { }
                                <td className="sticky left-0 bg-white group-hover:bg-gray-50 z-20 py-3 px-2 text-center font-mono text-gray-400 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[50px] min-w-[50px]">
                                    {index + 1}
                                </td>
                                <td className="sticky left-[50px] bg-white group-hover:bg-gray-50 z-20 py-3 px-2 border-r border-gray-200 text-center w-[60px] min-w-[60px]">
                                    <img
                                        src={rival.shieldUrl}
                                        alt={rival.nombre}
                                        className="w-8 h-8 object-contain mx-auto transition-transform group-hover:scale-110"
                                        onError={(e) => (e.target as HTMLImageElement).src = '/assets/escudos/placeholder.png'}
                                    />
                                </td>
                                <td className="sticky left-[110px] bg-white group-hover:bg-gray-50 z-20 py-3 px-3 border-r-2 border-gray-200 font-bold text-gray-900 shadow-[5px_0_10px_rgba(0,0,0,0.05)] truncate max-w-[160px]" title={rival.nombre}>
                                    <a href={`/rivales/${rival.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#ffde59] transition-colors">
                                        {rival.nombre}
                                    </a>
                                </td>

                                <td className="py-3 px-2 text-gray-600 truncate max-w-[120px]" title={rival.ciudad}>{rival.ciudad}</td>
                                <td className="py-3 px-2 text-center">
                                    <img
                                        src={getFlagSrc(rival.pais)}
                                        alt={rival.pais}
                                        className="w-5 h-auto inline-block rounded-sm shadow-sm opacity-90"
                                        title={rival.pais}
                                    />
                                </td>
                                <td className="py-3 px-2 text-gray-500 whitespace-nowrap truncate max-w-[150px]" title={rival.estadio}>
                                    {rival.estadio ? (
                                        <a href={`/rivales/${rival.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#ffde59] transition-colors">
                                            {rival.estadio}
                                        </a>
                                    ) : '-'}
                                </td>
                                <td className="py-3 px-2 text-center font-mono text-xs text-gray-400">
                                    {rival.capacidad !== 0 ? Number(rival.capacidad).toLocaleString() : '-'}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-gray-900 bg-gray-50/50">
                                    {rival.stats.played}
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-green-600 bg-green-50/30">
                                    {rival.stats.wins}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-green-700 bg-green-50/30">
                                    {rival.stats.winPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-gray-500 bg-gray-50/30">
                                    {rival.stats.draws}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-gray-500 bg-gray-50/30">
                                    {rival.stats.drawPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold text-red-500 bg-red-50/30">
                                    {rival.stats.losses}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono text-red-600 bg-red-50/30">
                                    {rival.stats.lossPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-mono text-gray-600">{rival.stats.gf}</td>
                                <td className="py-3 px-2 text-center font-mono text-gray-600">{rival.stats.ga}</td>
                                <td className="py-3 px-2 text-center font-mono font-bold text-gray-900">
                                    {rival.stats.gd > 0 ? `+${rival.stats.gd}` : rival.stats.gd}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-blue-500">
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
