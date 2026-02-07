
import React, { useState, useMemo } from 'react';
import { StatsCharts } from './StatsCharts';
import { COMPETITION_NAMES, getCompetitionId } from '../../utils/stats-mapper';
import fbrefDataStr from '../../consts/fbref-data.json';

const fbrefData = fbrefDataStr as Record<string, Record<string, any[]>>;

export const StatsExplorer: React.FC<{ playerImageMap: Record<string, string> }> = ({ playerImageMap }) => {
    const seasons = useMemo(() => Object.keys(fbrefData).filter(s => s !== '2020-2021').sort().reverse(), []);

    const formatSeason = (season: string) => {
        const parts = season.split('-');
        if (parts.length === 2) {
            return `${parts[0]}/${parts[1].slice(-2)}`;
        }
        return season;
    };

    const [season, setSeason] = useState('todas');
    const [competition, setCompetition] = useState('todas');

    const matchLogs = useMemo(() => {
        const logs: any[] = [];
        const targetSeasons = season === 'todas' ? seasons : [season];

        targetSeasons.forEach(s => {
            const seasonData = fbrefData[s] || {};
            const resultKeys = Object.keys(seasonData).filter(k => k.includes('results') && k.includes('overall'));

            resultKeys.forEach(key => {
                let isValidComp = false;
                if (competition === 'todas') {
                    isValidComp = true;
                } else {
                    if (key.includes(competition)) isValidComp = true;
                }

                if (isValidComp) {
                    const rows = seasonData[key];
                    if (Array.isArray(rows)) {
                        logs.push(...rows);
                    }
                }
            });
        });

        return logs;
    }, [season, competition, seasons]);

    const aggregatedData = useMemo(() => {
        const uniqueContexts: Record<string, any> = {};

        const targetSeasons = season === 'todas' ? seasons : [season];

        targetSeasons.forEach(s => {
            const seasonData = fbrefData[s] || {};
            const availableKeys = Object.keys(seasonData).filter(k => k.startsWith('stats_'));

            availableKeys.forEach(tableKey => {
                const compId = getCompetitionId(tableKey);
                if (competition !== 'todas' && compId !== competition) return;

                const rows = seasonData[tableKey];
                if (!Array.isArray(rows)) return;

                rows.forEach(row => {
                    const contextKey = `${row.player}_${s}_${compId}`;

                    let rowToMerge = { ...row };

                    const isPassingTable = /^stats_passing_\d/.test(tableKey) && !tableKey.includes('types');
                    const isPassingTypesTable = tableKey.includes('passing_types');

                    if (!isPassingTable) {
                        const {
                            passes, passes_completed, passes_pct, passess_completed,
                            passes_short, passes_medium, passes_long,
                            passes_completed_short, passes_completed_medium, passes_completed_long,
                            passes_pct_short, passes_pct_medium, passes_pct_long,
                            ...rest
                        } = row;
                        rowToMerge = rest;
                    } else if (isPassingTypesTable) {
                        const { passes, passes_completed, passes_pct, passess_completed, ...rest } = row;
                        rowToMerge = rest;
                    }

                    if (!uniqueContexts[contextKey]) {
                        uniqueContexts[contextKey] = rowToMerge;
                    } else {
                        Object.assign(uniqueContexts[contextKey], rowToMerge);
                    }
                });
            });
        });

        const aggregatedRows: Record<string, any> = {};

        Object.values(uniqueContexts).forEach(row => {
            const playerName = row.player;
            if (!aggregatedRows[playerName]) {
                aggregatedRows[playerName] = {
                    player: playerName,
                    nationality: row.nationality,
                    position: row.position,
                    age: row.age,
                    games: 0,
                    games_starts: 0,
                    minutes: 0,
                };
            }

            Object.keys(row).forEach(k => {
                if (typeof row[k] === 'number') {
                    if (k.includes('per90') || k.includes('percent') || k.includes('pct') || k.includes('rate') || k.includes('age')) return;
                    aggregatedRows[playerName][k] = (aggregatedRows[playerName][k] || 0) + row[k];
                }
            });
        });

        return Object.values(aggregatedRows).map(row => {
            const mins = row.minutes || 1;
            const is90 = mins / 90;
            const newRow = { ...row };

            Object.keys(newRow).forEach(k => {
                if (!k.includes('per90') && typeof newRow[k] === 'number') {
                    const per90Key = `${k}_per90`;
                    if (is90 > 0) {
                        newRow[per90Key] = Number((newRow[k] / is90).toFixed(2));
                    }
                }
            });

            if (newRow.passes_completed && newRow.passes) {
                const rawPct = (newRow.passes_completed / newRow.passes) * 100;
                newRow.passes_pct = Math.min(100, Number(rawPct.toFixed(1)));
            }
            if (newRow.passes_completed_short && newRow.passes_short) {
                newRow.passes_pct_short = Math.min(100, Number(((newRow.passes_completed_short / newRow.passes_short) * 100).toFixed(1)));
            }
            if (newRow.passes_completed_medium && newRow.passes_medium) {
                newRow.passes_pct_medium = Math.min(100, Number(((newRow.passes_completed_medium / newRow.passes_medium) * 100).toFixed(1)));
            }
            if (newRow.passes_completed_long && newRow.passes_long) {
                newRow.passes_pct_long = Math.min(100, Number(((newRow.passes_completed_long / newRow.passes_long) * 100).toFixed(1)));
            }

            return newRow;
        });

    }, [season, competition, seasons]);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-4 justify-center w-full md:w-auto" style={{ marginBottom: '2rem' }}>
                <div className="relative">
                    <select
                        className="appearance-none bg-white text-[#2b2b2b] border-2 border-[#ffde59] rounded-full py-3 pl-6 pr-12 text-[0.95rem] font-semibold min-w-[220px] shadow-[0_2px_8px_rgba(255,222,89,0.2)] focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 hover:bg-[#fffef8] hover:border-[#ffd700] transition-all cursor-pointer text-center"
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                    >
                        <option value="todas">Todas las Temporadas</option>
                        {seasons.map(s => <option key={s} value={s}>{formatSeason(s)}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M6 9l6 6l6 -6" />
                        </svg>
                    </div>
                </div>

                <div className="relative">
                    <select
                        className="appearance-none bg-white text-[#2b2b2b] border-2 border-[#ffde59] rounded-full py-3 pl-6 pr-12 text-[0.95rem] font-semibold min-w-[220px] shadow-[0_2px_8px_rgba(255,222,89,0.2)] focus:outline-none focus:ring-4 focus:ring-[#ffde59]/20 hover:bg-[#fffef8] hover:border-[#ffd700] transition-all cursor-pointer text-center"
                        value={competition}
                        onChange={(e) => setCompetition(e.target.value)}
                    >
                        <option value="todas">Todas las Competiciones</option>
                        <option value="230">Liga F</option>
                        <option value="181">UWCL</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2b2b2b]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M6 9l6 6l6 -6" />
                        </svg>
                    </div>
                </div>
            </div>

            <StatsCharts data={aggregatedData} matchLogs={matchLogs} season={season} playerImageMap={playerImageMap} />
        </div>
    );
};
