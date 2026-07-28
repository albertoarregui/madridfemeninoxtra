import React, { useState, useMemo } from 'react';

interface Rival {
    id_club: string | number;
    nombre: string;
    shieldUrl: string;
    ciudad: string;
    pais: string;
    iso: string;
    flagUrl: string;
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
            <div className="overflow-x-auto rivals-scrollbar">
                <table className="w-full border-collapse text-left min-w-[1000px] md:min-w-[1200px]">
                    <thead>
                        <tr className="text-xs font-bold whitespace-nowrap" style={{ background: 'rgba(212,168,67,0.08)', borderBottom: '1px solid rgba(212,168,67,0.15)' }}>

                            <th className="sticky left-0 z-30 py-3 px-2 text-center w-[50px] min-w-[50px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', color: 'rgba(212,168,67,0.75)', background: 'rgba(212,168,67,0.08)', borderRight: '1px solid rgba(212,168,67,0.1)' }}>
                                #
                            </th>
                            <th className="sticky left-[50px] z-30 py-3 px-2 w-[60px] min-w-[60px] text-center"
                                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', color: 'rgba(212,168,67,0.75)', background: 'rgba(212,168,67,0.08)', borderRight: '1px solid rgba(212,168,67,0.1)' }}>
                                Escudo
                            </th>
                            <SortableHeader
                                sortKey="nombre"
                                label="Rival"
                                className="sticky left-[110px] z-30 shadow-[5px_0_10px_rgba(0,0,0,0.3)] min-w-[160px]"
                                align="left"
                            />

                            <SortableHeader sortKey="ciudad" label="Ciudad" />
                            <th className="py-3 px-2 text-center"
                                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', color: 'rgba(212,168,67,0.75)' }}>
                                País
                            </th>
                            <SortableHeader sortKey="estadio" label="Estadio" />
                            <SortableHeader sortKey="capacidad" label="Cap" />

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
                            <SortableHeader sortKey="stats.cleanSheets" label="PaC" title="Porterías a cero" />
                        </tr>
                    </thead>
                    <tbody className="text-sm" style={{ color: '#f0f0f0' }}>
                        {sortedRivals.map((rival, index) => (
                            <tr
                                key={rival.id_club}
                                className="transition-colors group"
                                style={{ borderBottom: '1px solid rgba(212,168,67,0.08)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                            >
                                { }
                                <td className="sticky left-0 z-20 py-3 px-2 text-center font-mono w-[50px] min-w-[50px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                                    style={{ color: 'rgba(212,168,67,0.55)', background: 'rgba(6,13,28,0.98)', borderRight: '1px solid rgba(212,168,67,0.08)' }}>
                                    {index + 1}
                                </td>
                                <td className="sticky left-[50px] z-20 py-3 px-2 text-center w-[60px] min-w-[60px]"
                                    style={{ background: 'rgba(6,13,28,0.98)', borderRight: '1px solid rgba(212,168,67,0.08)' }}>
                                    <img
                                        src={rival.shieldUrl}
                                        alt={rival.nombre}
                                        className="w-8 h-8 object-contain mx-auto transition-transform group-hover:scale-110"
                                        onError={(e) => (e.target as HTMLImageElement).src = '/assets/escudos/placeholder.png'}
                                    />
                                </td>
                                <td className="sticky left-[110px] z-20 py-3 px-3 font-bold shadow-[5px_0_10px_rgba(0,0,0,0.3)] truncate max-w-[160px]"
                                    style={{ background: 'rgba(6,13,28,0.98)', borderRight: '1px solid rgba(212,168,67,0.12)', color: '#f0f0f0' }}
                                    title={rival.nombre}>
                                    <a href={`/rivales/${rival.slug}`} target="_self"
                                        style={{ color: '#f0f0f0' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#f0f0f0')}
                                        className="transition-colors">
                                        {rival.nombre}
                                    </a>
                                </td>

                                <td className="py-3 px-2 truncate max-w-[120px]" style={{ color: 'rgba(200,210,220,0.65)' }} title={rival.ciudad}>{rival.ciudad}</td>
                                <td className="py-3 px-2 text-center">
                                    {rival.flagUrl ? (
                                        <img
                                            src={rival.flagUrl}
                                            alt={rival.pais}
                                            className="w-5 h-auto inline-block shadow-sm opacity-90"
                                            title={rival.pais}
                                        />
                                    ) : rival.pais || '-'}
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap truncate max-w-[150px]" style={{ color: 'rgba(200,210,220,0.65)' }} title={rival.estadio}>
                                    {rival.estadio ? (
                                        <a href={`/rivales/${rival.slug}`} target="_self"
                                            style={{ color: 'rgba(200,210,220,0.65)' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,210,220,0.65)')}
                                            className="transition-colors">
                                            {rival.estadio}
                                        </a>
                                    ) : '-'}
                                </td>
                                <td className="py-3 px-2 text-center font-mono text-xs" style={{ color: 'rgba(200,210,220,0.65)' }}>
                                    {Number.isFinite(Number(rival.capacidad)) && Number(rival.capacidad) !== 0
                                        ? Number(rival.capacidad).toLocaleString()
                                        : '-'}
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: '#f0f0f0' }}>
                                    {rival.stats.played}
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(74,222,128,0.9)', background: 'rgba(74,222,128,0.06)' }}>
                                    {rival.stats.wins}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(74,222,128,0.9)', background: 'rgba(74,222,128,0.06)' }}>
                                    {rival.stats.winPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(148,163,184,0.8)', background: 'rgba(148,163,184,0.06)' }}>
                                    {rival.stats.draws}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(148,163,184,0.8)', background: 'rgba(148,163,184,0.06)' }}>
                                    {rival.stats.drawPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-bold" style={{ color: 'rgba(248,113,113,0.85)', background: 'rgba(248,113,113,0.06)' }}>
                                    {rival.stats.losses}
                                </td>
                                <td className="py-3 px-2 text-center text-xs font-mono" style={{ color: 'rgba(248,113,113,0.85)', background: 'rgba(248,113,113,0.06)' }}>
                                    {rival.stats.lossPct}%
                                </td>

                                <td className="py-3 px-2 text-center font-mono" style={{ color: '#f0f0f0' }}>{rival.stats.gf}</td>
                                <td className="py-3 px-2 text-center font-mono" style={{ color: '#f0f0f0' }}>{rival.stats.ga}</td>
                                <td className="py-3 px-2 text-center font-mono font-bold" style={{ color: '#f0f0f0' }}>
                                    {rival.stats.gd > 0 ? `+${rival.stats.gd}` : rival.stats.gd}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-blue-400">
                                    {rival.stats.cleanSheets}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .rivals-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    background: rgba(6,13,28,0.95);
                }
                .rivals-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(212,168,67,0.3);
                    border-radius: 4px;
                }
                .rivals-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(212,168,67,0.55);
                }
            `}</style>
        </div>
    );
};

export default RivalsTable;


