import { useState, useMemo } from 'react';

const RankingTable = ({ title, data, valueKey, labelKey, playerMap }) => {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500 border border-gray-200">
                No hay datos registrados para {title.toLowerCase()} con los filtros actuales.
            </div>
        );
    }

    // Función para obtener los detalles de la jugadora (nombre y path de imagen)
    const getPlayerDetails = (playerId) => {
        const details = playerMap[playerId];
        if (details) {
            const imagePath = `src/assets/jugadoras/${details.slug}.png`;
            return {
                displayName: details.name,
                imageSrc: imagePath,
            };
        }
        // Fallback si el ID no se encuentra en el mapa
        return {
            displayName: `ID Desconocido (${playerId})`,
            imageSrc: 'https://placehold.co/40x40/9ca3af/ffffff?text=N/A',
        };
    };

    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.01] transition duration-300">
            <h3 className="text-xl font-extrabold text-white p-4 bg-indigo-600 border-b border-indigo-700 rounded-t-xl">{title}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-indigo-700 uppercase tracking-wider w-12 rounded-tl-xl">Pos</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Jugadora</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-indigo-700 uppercase tracking-wider">{labelKey}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((item, index) => {
                            // Usamos item.jugadora como ID para buscar en el mapa
                            const { displayName, imageSrc } = getPlayerDetails(item.jugadora);
                            return (
                                <tr key={item.jugadora} className="hover:bg-indigo-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-bold text-center">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-4">
                                            {/* Foto de la Jugadora */}
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover border-2 border-indigo-300 shadow-md"
                                                    src={imageSrc}
                                                    alt={displayName}
                                                    // Manejo de error: si la imagen no carga, muestra un avatar con la inicial
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null; // Previene bucle infinito
                                                        e.currentTarget.src = `https://placehold.co/40x40/4f46e5/ffffff?text=${displayName.charAt(0)}`;
                                                        e.currentTarget.className = "h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold border-2 border-indigo-300 shadow-md";
                                                    }}
                                                />
                                            </div>
                                            {/* Nombre de la Jugadora (Normalizado) */}
                                            <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-base font-extrabold text-indigo-700">
                                        {item[valueKey]}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

RankingTable.propTypes = {
    title: PropTypes.string.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    valueKey: PropTypes.string.isRequired,
    labelKey: PropTypes.string.isRequired,
    playerMap: PropTypes.object.isRequired,
};

// ========================================================================

export default function StatsRankings({ goalsData: rawGoalsData, seasons, competitions }) {
    const [selectedSeason, setSelectedSeason] = useState('todos');
    const [selectedCompetition, setSelectedCompetition] = useState('todos');

    // Usamos goalsData directamente, asumiendo que los datos de la DB se pasan aquí.
    const goalsData = rawGoalsData || [];

    // Lógica de filtrado y cálculo
    const { topScorers, topAssisters, topContributions } = useMemo(() => {
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

        // 4. Calcular Contribuciones Totales (Goles + Asistencias)
        const contributionsMap = {};

        // Función auxiliar para sumar 1 a la contribución de un jugador
        const addContribution = (playerId) => {
            if (playerId) {
                contributionsMap[playerId] = (contributionsMap[playerId] || 0) + 1;
            }
        };

        filteredData.forEach(item => {
            // Sumar gol
            addContribution(item.goleadora);
            // Sumar asistencia
            addContribution(item.asistente);
        });

        const sortedContributions = Object.entries(contributionsMap)
            .map(([jugadora, total]) => ({ jugadora, total }))
            .sort((a, b) => b.total - a.total);


        return {
            topScorers: sortedScorers,
            topAssisters: sortedAssisters,
            topContributions: sortedContributions, // Nueva lista de rankings
        };
    }, [goalsData, selectedSeason, selectedCompetition]);

    // Usamos las listas de temporadas y competiciones proporcionadas por el usuario como valores por defecto.
    const defaultSeasons = ['2020/21', '2021/22', '2022/23', '2023/24', '2025/26'];
    const defaultCompetitions = ['Amistosos', 'Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España'];

    const availableSeasons = seasons && seasons.length > 0 ? seasons : defaultSeasons;
    const availableCompetitions = competitions && competitions.length > 0 ? competitions : defaultCompetitions;

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Rankings de Estadísticas</h1>

            {/* Filtros */}
            <div className="filters-container mb-8 bg-white p-6 rounded-2xl shadow-lg flex flex-wrap gap-6 border border-indigo-100">
                <div className="filter-group flex-1 min-w-[200px]">
                    <label htmlFor="filtro-temporada" className="block text-sm font-medium text-gray-700 mb-1">Temporada</label>
                    <select
                        id="filtro-temporada"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        className="block w-full pl-4 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm appearance-none cursor-pointer transition duration-150 ease-in-out hover:border-indigo-400"
                    >
                        <option value="todos">Todas las Temporadas</option>
                        {availableSeasons.map(season => (
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
                        className="block w-full pl-4 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm appearance-none cursor-pointer transition duration-150 ease-in-out hover:border-indigo-400"
                    >
                        <option value="todos">Todas las Competiciones</option>
                        {availableCompetitions.map(comp => (
                            <option key={comp} value={comp}>{comp}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid de Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <RankingTable
                    title="Máximas Goleadoras"
                    data={topScorers}
                    valueKey="goles"
                    labelKey="Goles"
                    playerMap={PLAYER_MAP}
                />
                <RankingTable
                    title="Máximas Asistentes"
                    data={topAssisters}
                    valueKey="asistencias"
                    labelKey="Asistencias"
                    playerMap={PLAYER_MAP}
                />
                <RankingTable
                    title="Contribuciones Totales"
                    data={topContributions}
                    valueKey="total"
                    labelKey="Goles + Asistencias"
                    playerMap={PLAYER_MAP}
                />
            </div>
        </div>
    );
}

StatsRankings.propTypes = {
    goalsData: PropTypes.arrayOf(PropTypes.object),
    seasons: PropTypes.arrayOf(PropTypes.string),
    competitions: PropTypes.arrayOf(PropTypes.string),
};
