import { useState, useMemo } from 'react';

const RankingTable = ({ title, data, valueKey, labelKey }) => {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
                No hay datos registrados para {title.toLowerCase()} con los filtros actuales.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <h3 className="text-xl font-bold text-gray-800 p-4 border-b bg-gray-50">{title}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Pos</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugadora</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{labelKey}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item, index) => (
                            <tr key={item.jugadora} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="text-sm font-medium text-gray-900">{item.jugadora}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                                    {item[valueKey]}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function StatsRankings({ goalsData, seasons, competitions }) {
    const [selectedSeason, setSelectedSeason] = useState('todos');
    const [selectedCompetition, setSelectedCompetition] = useState('todos');

    // Lógica de filtrado y cálculo
    const { topScorers, topAssisters } = useMemo(() => {
        // 1. Filtrar los datos crudos
        const filteredData = goalsData.filter(item => {
            const matchesSeason = selectedSeason === 'todos' || item.temporada === selectedSeason;
            const matchesCompetition = selectedCompetition === 'todos' || item.competicion === selectedCompetition;
            return matchesSeason && matchesCompetition;
        });

        // 2. Calcular Goleadoras
        const scorersMap = {};
        filteredData.forEach(item => {
            if (item.goleadora) {
                scorersMap[item.goleadora] = (scorersMap[item.goleadora] || 0) + 1;
            }
        });

        const sortedScorers = Object.entries(scorersMap)
            .map(([jugadora, goles]) => ({ jugadora, goles }))
            .sort((a, b) => b.goles - a.goles);

        // 3. Calcular Asistentes
        const assistersMap = {};
        filteredData.forEach(item => {
            if (item.asistente) {
                assistersMap[item.asistente] = (assistersMap[item.asistente] || 0) + 1;
            }
        });

        const sortedAssisters = Object.entries(assistersMap)
            .map(([jugadora, asistencias]) => ({ jugadora, asistencias }))
            .sort((a, b) => b.asistencias - a.asistencias);

        return {
            topScorers: sortedScorers,
            topAssisters: sortedAssisters
        };
    }, [goalsData, selectedSeason, selectedCompetition]);

    return (
        <div className="stats-rankings-ui">
            {/* Filtros */}
            <div className="filters-container mb-8 bg-gray-50 p-4 rounded-lg shadow-sm flex flex-wrap gap-4">
                <div className="filter-group flex-1 min-w-[200px]">
                    <label htmlFor="filtro-temporada" className="block text-sm font-medium text-gray-700 mb-1">Temporada</label>
                    <select
                        id="filtro-temporada"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="todos">Todas las Temporadas</option>
                        {seasons.map(season => (
                            <option key={season} value={season}>{season}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group flex-1 min-w-[200px]">
                    <label htmlFor="filtro-competicion" className="block text-sm font-medium text-gray-700 mb-1">Competición</label>
                    <select
                        id="filtro-competicion"
                        value={selectedCompetition}
                        onChange={(e) => setSelectedCompetition(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="todos">Todas las Competiciones</option>
                        {competitions.map(comp => (
                            <option key={comp} value={comp}>{comp}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid de Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <RankingTable
                    title="Máximas Goleadoras"
                    data={topScorers}
                    valueKey="goles"
                    labelKey="Goles"
                />
                <RankingTable
                    title="Máximas Asistentes"
                    data={topAssisters}
                    valueKey="asistencias"
                    labelKey="Asistencias"
                />
            </div>
        </div>
    );
}