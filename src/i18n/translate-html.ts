export const interfaceReplacements: Array<[string, string]> = [
  ["Real Madrid Femenino: noticias, partidos, plantilla y estadísticas", "Real Madrid Women: news, matches, squad and statistics"],
  ["Real Madrid Femenino: noticias, resultados y estadísticas", "Real Madrid Women: news, results and statistics"],
  ["Real Madrid Femenino: últimas noticias y actualidad", "Real Madrid Women: latest news and updates"],
  ["Jugadoras del Real Madrid Femenino", "Real Madrid Women players"],
  ["Entrenadores del Real Madrid Femenino", "Real Madrid Women coaches"],
  ["Árbitras del Real Madrid Femenino", "Real Madrid Women referees"],
  ["Partidos del Real Madrid Femenino", "Real Madrid Women matches"],
  ["Rivales del Real Madrid Femenino", "Real Madrid Women opponents"],
  ["Estadios del Real Madrid Femenino", "Real Madrid Women stadiums"],
  ["Estadísticas del Real Madrid Femenino", "Real Madrid Women statistics"],
  ["Rankings del Real Madrid Femenino", "Real Madrid Women rankings"],
  ["Temporadas del Real Madrid Femenino", "Real Madrid Women seasons"],
  ["Calendario Real Madrid Femenino", "Real Madrid Women fixtures"],
  ["Plantilla Real Madrid Femenino", "Real Madrid Women squad"],
  ["Últimas noticias", "Latest news"], ["ÚLTIMAS NOTICIAS", "LATEST NEWS"],
  ["Noticias y actualidad", "News and updates"],
  ["Resultados y próximos partidos", "Results and upcoming matches"],
  ["Ver última hora", "View latest news"],
  ["Real Madrid Femenino", "Real Madrid Women"],
  ["Real Madrid femenino", "Real Madrid Women"],
  ["Todas las temporadas", "All seasons"], ["Todas las Temporadas", "All seasons"],
  ["Todas las competiciones", "All competitions"], ["Todas las Competiciones", "All competitions"],
  ["Partidos Oficiales", "Official matches"], ["Partidos oficiales", "Official matches"],
  ["BUSCADOR AVANZADO", "ADVANCED SEARCH"], ["BUSCADOR DE PARTIDOS", "MATCH SEARCH"],
  ["BUSCADOR DE TEMPORADAS", "SEASON COMPARISON"], ["GRÁFICOS", "CHARTS"],
  ["JUGADORAS", "PLAYERS"], ["ENTRENADORES", "COACHES"], ["ÁRBITRAS", "REFEREES"],
  ["PARTIDOS", "MATCHES"], ["RIVALES", "OPPONENTS"], ["ESTADIOS", "STADIUMS"],
  ["PLANTILLA", "SQUAD"], ["CALENDARIO", "FIXTURES"], ["FOTOGALERÍAS", "PHOTO GALLERIES"],
  ["RÉCORDS GOLEADORES", "SCORING MILESTONES"], ["VALORACIONES", "RATINGS"],
  ["CLASIFICACIONES", "STANDINGS"], ["ESTADÍSTICAS", "STATISTICS"],
  ["MÁXIMAS GOLEADORAS", "TOP SCORERS"], ["MÁXIMAS ASISTENTES", "TOP ASSIST PROVIDERS"],
  ["Más partidos", "Most appearances"], ["Más minutos", "Most minutes"],
  ["Más capitanías", "Most captaincies"], ["Porterías a cero", "Clean sheets"],
  ["Temporada", "Season"], ["TEMPORADA", "SEASON"], ["Competición", "Competition"],
  ["COMPETICIÓN", "COMPETITION"], ["Posición", "Position"], ["País", "Country"],
  ["Jugadora", "Player"], ["Entrenador", "Coach"], ["Entrenadora", "Coach"],
  ["Árbitra", "Referee"], ["Rival", "Opponent"], ["Estadio", "Stadium"],
  ["Partido", "Match"], ["Partidos", "Matches"], ["Goles", "Goals"],
  ["Asistencias", "Assists"], ["Minutos", "Minutes"], ["Victorias", "Wins"],
  ["Empates", "Draws"], ["Derrotas", "Losses"], ["Fecha", "Date"],
  ["Resultado", "Result"], ["Local", "Home"], ["Visitante", "Away"],
  ["Anterior", "Previous"], ["Siguiente", "Next"], ["Ver ficha", "View profile"],
  ["Ver todos los resultados", "View all results"], ["Buscar", "Search"],
  ["Filtros", "Filters"], ["Limpiar", "Clear"], ["Cargando", "Loading"],
  ["Sin datos disponibles", "No data available"], ["No se encontraron resultados", "No results found"],
  ["Introducción", "Introduction"], ["Utilidad", "Purpose"], ["Metodología", "Methodology"],
  ["Sobre nosotros", "About us"], ["Contacto", "Contact"], ["Aviso legal", "Legal notice"],
  ["Política de Privacidad", "Privacy Policy"], ["Política de Cookies", "Cookie Policy"],
  ["Todos los derechos reservados", "All rights reserved"],
  ["Volver al resto de partidos", "Back to all matches"], ["Compartir", "Share"],
  ["Descargar imagen", "Download image"], ["Cerrar", "Close"], ["Foto con ", "Photo with "],
  ["Clasificación ofrecida por", "Standings provided by"],
];

export function translateInterfaceHtml(input: string): string {
  let html = input;
  for (const [source, target] of [...interfaceReplacements].sort((a, b) => b[0].length - a[0].length)) {
    html = html.split(source).join(target);
  }
  html = html.replace(/href="\/(?!en(?:\/|\")|api\/|_astro\/|assets\/|icon|site\.webmanifest|rss\.xml|sitemap\.xml)([^"]*)"/g, 'href="/en/$1"');
  html = html.replace(/href="\/en\/"/g, 'href="/en/"');
  return html;
}
