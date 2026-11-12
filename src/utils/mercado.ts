// Mercado: altas, bajas, cesiones, renovaciones y ascensos (tabla `mercado`).
// Una lectura al día como mucho; la tabla se edita directamente en Turso.
import { cached } from "./cache";
import { cacheTags } from "../lib/cache-tags";
import { slugify } from "./players";

export type MoveType = "alta" | "baja" | "cesion_entrada" | "cesion_salida" | "renovacion" | "ascenso";
export interface Move {
    id: number; slug: string; nombre: string; posicion: string; tipo: MoveType; temporada: string; fecha: string | null;
    origen: string | null; destino: string | null; precio: number | null; precioTipo: string; contratoHasta: string | null;
    fuente: string | null; notas: string | null;
}

async function load(): Promise<Move[]> {
    const { getPlayersDbClient } = await import("../db/client");
    const client = await getPlayersDbClient();
    if (!client) return [];
    const result = await client.execute(`
        SELECT m.*, j.nombre AS nombre_jugadora, j.posicion
        FROM mercado m LEFT JOIN jugadoras j ON j.id_jugadora = m.id_jugadora
        ORDER BY m.temporada DESC, COALESCE(m.fecha, '') DESC, m.id_movimiento DESC`);
    return (result.rows as any[]).map((r) => {
        const nombre = String(r.nombre_jugadora || r.nombre);
        return {
            id: Number(r.id_movimiento), slug: slugify(nombre), nombre, posicion: String(r.posicion || ""),
            tipo: r.tipo, temporada: String(r.temporada), fecha: r.fecha ? String(r.fecha).slice(0, 10) : null,
            origen: r.club_origen || null, destino: r.club_destino || null,
            precio: r.precio != null ? Number(r.precio) : null, precioTipo: String(r.precio_tipo || "no_revelado"),
            contratoHasta: r.contrato_hasta ? String(r.contrato_hasta).slice(0, 10) : null,
            fuente: r.fuente_url || null, notas: r.notas || null,
        };
    });
}

export const fetchMercado = () =>
    cached("mercado:v1", 24 * 60 * 60 * 1000, load, { tags: [cacheTags.players] }).catch(() => [] as Move[]);

export const TYPE_LABEL: Record<MoveType, string> = {
    alta: "Fichaje", baja: "Salida", cesion_entrada: "Cesión (llega)", cesion_salida: "Cesión (sale)", renovacion: "Renovación", ascenso: "Ascenso",
};

/** «1,2 M€», «350.000 €», «Libre», «Cesión»… */
export function feeLabel(m: Move): string {
    if (m.precio != null && m.precio > 0) {
        return m.precio >= 1_000_000
            ? `${(m.precio / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 2 })} M€`
            : `${Math.round(m.precio).toLocaleString("es-ES")} €`;
    }
    if (m.precioTipo === "libre") return "Libre";
    if (m.precioTipo === "cesion" || m.tipo.startsWith("cesion")) return "Cesión";
    if (m.tipo === "ascenso") return "Cantera";
    if (m.tipo === "renovacion") return m.contratoHasta ? `Hasta ${m.contratoHasta.slice(0, 4)}` : "Renovado";
    return "No revelado";
}
