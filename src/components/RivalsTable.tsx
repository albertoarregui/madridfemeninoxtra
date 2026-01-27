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

const RivalsTable: React.FC<RivalsTableProps> = ({ rivals }) => {
    // We can add local state for sorting if needed, but for now it's static as requested
    // Default sort: Played (desc), Wins (desc) [Done by SQL]

    const getFlagSrc = (country: string) => {
        if (!country) return '';
        // Map common names/codes if needed, simplistic approach:
        const normalized = country.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/ñ/g, 'n')
            .replace(/\s+/g, '_');

        // Handle common variations if data isn't clean
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
        <div className="w-full max-w-[1600px] mx-auto overflow-hidden rounded-2xl border border-[#ffde59]/20 shadow-2xl bg-[#151e42]/90 backdrop-blur-md">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left min-w-[1200px]">
                    <thead>
                        <tr className="bg-[#1d274e] text-white uppercase text-sm tracking-wider font-extrabold border-b border-white/10">
                            {/* Sticky Columns */}
                            <th className="sticky left-0 bg-[#1d274e] z-20 py-5 px-6 font-mono text-[#ffde59] text-center w-16 border-r border-white/5 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                #
                            </th>
                            <th className="sticky left-16 bg-[#1d274e] z-20 py-5 px-4 w-16 border-r border-white/5 text-center">
                                Escudo
                            </th>
                            <th className="sticky left-32 bg-[#1d274e] z-20 py-5 px-6 border-r border-white/5 shadow-[5px_0_10px_rgba(0,0,0,0.5)] min-w-[200px]">
                                Rival
                            </th>

                            {/* Scrollable Columns */}
                            <th className="py-5 px-6 font-bebas tracking-widest text-lg">Ciudad</th>
                            <th className="py-5 px-4 text-center">País</th>
                            <th className="py-5 px-6 font-bebas tracking-widest text-lg">Estadio</th>
                            <th className="py-5 px-4 text-center font-mono text-xs text-gray-400">Cap.</th>

                            <th className="py-5 px-4 text-center font-black text-[#ffde59] text-xl bg-white/5 border-l border-white/5">PJ</th>
                            <th className="py-5 px-4 text-center text-green-400 font-bold border-l border-white/5">V</th>
                            <th className="py-5 px-4 text-center text-gray-300 font-bold">E</th>
                            <th className="py-5 px-4 text-center text-red-400 font-bold border-r border-white/5">D</th>

                            <th className="py-5 px-4 text-center font-mono">GF</th>
                            <th className="py-5 px-4 text-center font-mono">GC</th>
                            <th className="py-5 px-4 text-center font-mono text-[#ffde59] font-bold">DIF</th>
                            <th className="py-5 px-4 text-center font-mono text-blue-300">0P</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-200 divide-y divide-white/5">
                        {rivals.map((rival, index) => (
                            <tr
                                key={rival.id_club}
                                className="hover:bg-white/5 transition-colors group"
                            >
                                {/* Sticky Columns */}
                                <td className="sticky left-0 bg-[#151e42]/95 group-hover:bg-[#1d274e] z-10 py-4 px-6 font-mono text-center font-bold text-gray-500 border-r border-white/5 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                    {index + 1}
                                </td>
                                <td className="sticky left-16 bg-[#151e42]/95 group-hover:bg-[#1d274e] z-10 py-4 px-4 border-r border-white/5 text-center">
                                    <img
                                        src={rival.shieldUrl}
                                        alt={rival.nombre}
                                        className="w-10 h-10 object-contain mx-auto drop-shadow-md transform group-hover:scale-110 transition-transform"
                                        onError={(e) => (e.target as HTMLImageElement).src = '/assets/escudos/placeholder.png'}
                                    />
                                </td>
                                <td className="sticky left-32 bg-[#151e42]/95 group-hover:bg-[#1d274e] z-10 py-4 px-6 border-r border-white/5 font-bold text-lg text-white shadow-[5px_0_10px_rgba(0,0,0,0.5)]">
                                    <a href={`/rivales/${rival.slug}`} className="hover:text-[#ffde59] transition-colors">
                                        {rival.nombre}
                                    </a>
                                </td>

                                {/* Scrollable Columns */}
                                <td className="py-4 px-6 text-sm">{rival.ciudad}</td>
                                <td className="py-4 px-4 text-center">
                                    <img
                                        src={getFlagSrc(rival.pais)}
                                        alt={rival.pais}
                                        className="w-6 h-auto inline-block rounded-sm shadow-sm"
                                        title={rival.pais}
                                    />
                                </td>
                                <td className="py-4 px-6 text-sm truncate max-w-[200px]" title={rival.estadio}>
                                    {rival.estadio || '-'}
                                </td>
                                <td className="py-4 px-4 text-center font-mono text-xs text-gray-500">
                                    {rival.capacidad !== 0 ? Number(rival.capacidad).toLocaleString() : '-'}
                                </td>

                                <td className="py-4 px-4 text-center font-black text-xl text-white bg-white/5 border-l border-white/5">
                                    {rival.stats.played}
                                </td>
                                <td className="py-4 px-4 text-center border-l border-white/5">
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-green-400 text-lg">{rival.stats.wins}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">{rival.stats.winPct}%</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-gray-300 text-lg">{rival.stats.draws}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">{rival.stats.drawPct}%</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-center border-r border-white/5">
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-red-400 text-lg">{rival.stats.losses}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">{rival.stats.lossPct}%</span>
                                    </div>
                                </td>

                                <td className="py-4 px-4 text-center font-mono font-bold">{rival.stats.gf}</td>
                                <td className="py-4 px-4 text-center font-mono text-gray-400">{rival.stats.ga}</td>
                                <td className="py-4 px-4 text-center font-mono font-black text-[#ffde59]">
                                    {rival.stats.gd > 0 ? `+${rival.stats.gd}` : rival.stats.gd}
                                </td>
                                <td className="py-4 px-4 text-center font-bold text-blue-300">
                                    {rival.stats.cleanSheets}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 12px;
                    background: #0f1535;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2a3b75;
                    border-radius: 6px;
                    border: 3px solid #0f1535;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ffde59;
                }
            `}</style>
        </div>
    );
};

export default RivalsTable;
