import { contentfulClient } from "../lib/contentful";
import { fetchPlayersDirectly } from "./players";
import { cached, TTL } from "./cache";

export type NotaMfx = {
  id: string;
  nombre: string;
  nota: number | null;
  comentario: string;
  mvp: boolean;
  orden: number;
  estado: "Puntuada" | "No puntuada";
  fotoUrl: string | null;
};
export type UnoPorUnoMfx = { titulo: string; partidoId: string; temporada: string; introduccion: string; jugadoras: NotaMfx[] };

const assetUrl = (asset: any): string | null => {
  const url = asset?.fields?.file?.url;
  if (typeof url !== "string" || !url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
};
const yearSeason = (s: string) => /^20\d{2}\/\d{2}$/.test(s);

export async function getUnoPorUnoPartido(partidoId: string): Promise<UnoPorUnoMfx | null> {
  if (!partidoId) return null;
  const response = await contentfulClient.getEntries({
    content_type: "unoPorUnoMfx",
    "fields.partidoId": String(partidoId),
    include: 4,
    limit: 2,
  });
  const entry: any = response.items[0];
  if (!entry || response.items.length !== 1) return null;
  const f = entry.fields ?? {};
  const temporada = String(f.temporada ?? "");
  if (!yearSeason(temporada)) return null;
  // La fotografía se toma de Turso por ID y temporada, nunca de la foto actual
  // de la jugadora. Solo se admiten fichas del primer equipo (categoría 4).
  const plantilla = await cached(`uno-por-uno:plantilla:${temporada}`, TTL.medio, async () => {
    const players = await fetchPlayersDirectly();
    return Object.fromEntries(players
      .filter((p: any) => Number(p.season_info?.[temporada]?.id_categoria) === 4)
      .map((p: any) => [String(p.id_jugadora), {
        nombre: String(p.nombre),
        fotoUrl: String(p.season_photos?.[temporada] || ""),
      }]));
  }, { tags: ["players"] });
  const jugadoras: NotaMfx[] = (f.valoraciones ?? []).filter((j: any) => j?.fields).map((item: any, index: number) => {
    const j = item.fields;
    // La editora solo introduce la nota: las valoraciones con nota válida
    // aparecen puntuadas automáticamente, sin cambiar el selector de estado.
    const nota = typeof j.nota === "number" && j.nota >= 0 && j.nota <= 10 ? j.nota : null;
    const estado = nota === null ? "No puntuada" : "Puntuada";
    const id = String(j.jugadoraId ?? "").trim();
    const perfil = id ? plantilla[id] : undefined;
    // Sin coincidencia por ID y temporada: no se muestra una fotografía incorrecta.
    const fotoUrl = perfil?.fotoUrl || null;
    return {
      id: item.sys.id,
      nombre: perfil?.nombre || String(j.nombre ?? ""),
      nota,
      comentario: String(j.comentario ?? ""),
      mvp: Boolean(j.mvp) && nota !== null,
      orden: typeof j.orden === "number" ? j.orden : index,
      estado: nota === null ? "No puntuada" : estado,
      fotoUrl,
    };
  }).sort((a, b) => a.orden - b.orden);
  // Solo una MVP, incluso si el editor marca varias por error.
  let foundMvp = false;
  for (const jugadora of jugadoras) {
    if (jugadora.mvp && !foundMvp) foundMvp = true;
    else jugadora.mvp = false;
  }
  return { titulo: String(f.titulo ?? "El 1x1 del Real Madrid"), partidoId: String(f.partidoId ?? ""), temporada, introduccion: String(f.introduccion ?? ""), jugadoras };
}
