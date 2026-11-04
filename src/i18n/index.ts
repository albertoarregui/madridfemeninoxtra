export type SiteLocale = "es" | "en";

export function localeFromPath(pathname: string): SiteLocale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";
}

export function stripLocale(pathname: string): string {
  if (pathname === "/en" || pathname === "/en/") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

export function localizePath(pathname: string, locale: SiteLocale): string {
  if (!pathname.startsWith("/")) return pathname;
  const clean = stripLocale(pathname);
  if (locale === "es") return clean;
  return clean === "/" ? "/en/" : `/en${clean}`;
}

export const ui = {
  es: {
    home: "Inicio", news: "Actualidad", articles: "Noticias", squad: "Plantilla",
    calendar: "Calendario", galleries: "Fotogalerías", awards: "Premios", statistics: "Estadísticas",
    players: "Jugadoras", coaches: "Entrenadores", referees: "Árbitras", matches: "Partidos",
    rivals: "Rivales", stadiums: "Estadios", charts: "Gráficos", advancedSearch: "Buscador avanzado",
    seasons: "Temporadas", records: "Récords", comparator: "Comparador", ratings: "Valoraciones",
    history: "Historia", spain: "España", about: "Sobre nosotros", contact: "Contacto",
  },
  en: {
    home: "Home", news: "News", articles: "Articles", squad: "Squad", calendar: "Fixtures",
    galleries: "Photo galleries", awards: "Awards", statistics: "Statistics", players: "Players",
    coaches: "Coaches", referees: "Referees", matches: "Matches", rivals: "Opponents",
    stadiums: "Stadiums", charts: "Charts", advancedSearch: "Advanced search", seasons: "Seasons",
    records: "Records", comparator: "Comparison tool", ratings: "Ratings", history: "History",
    spain: "Spain", about: "About us", contact: "Contact",
  },
} as const;

export function getUi(locale: SiteLocale) { return ui[locale]; }
