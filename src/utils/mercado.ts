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
    /** libre, traspaso, cesion, promocion, retirada… */
    modalidad: string | null; variable: string | null; aproximado: boolean; estado: string;
}

async function load(): Promise<Move[]> {
    const { getPlayersDbClient } = await import("../db/client");
    const client = await getPlayersDbClient();
    if (!client) return [];
    // Solo movimientos del primer equipo: la jugadora tenía dorsal del primer
    // equipo (categoría 4) esa temporada o, si sale o renueva, la anterior.
    const result = await client.execute(`
        WITH d AS (
            SELECT dr.id_jugadora, t.temporada, MAX(dr.id_categoria) AS cat
            FROM dorsales dr JOIN temporadas t ON t.id_temporada = dr.id_temporada
            GROUP BY dr.id_jugadora, t.temporada
        )
        SELECT m.id_movimiento, m.id_jugadora, m.nombre, m.tipo, m.temporada, m.fecha, m.club_origen, m.club_destino,
               m.precio, m.precio_tipo, m.precio_variable, m.precio_aproximado, m.modalidad, m.estado,
               m.contrato_hasta, m.fuente_url, m.fuente, m.notas,
               j.nombre AS nombre_jugadora, j.posicion
        FROM mercado m
        LEFT JOIN jugadoras j ON j.id_jugadora = m.id_jugadora
        LEFT JOIN d cur ON cur.id_jugadora = m.id_jugadora AND cur.temporada = m.temporada
        LEFT JOIN d prev ON prev.id_jugadora = m.id_jugadora
            AND prev.temporada = (CAST(substr(m.temporada, 1, 4) AS INTEGER) - 1) || '/' || substr(m.temporada, 3, 2)
        WHERE (m.tipo IN ('alta', 'ascenso', 'cesion_entrada') AND COALESCE(cur.cat, 0) = 4)
           OR (m.tipo IN ('baja', 'cesion_salida', 'renovacion') AND (COALESCE(prev.cat, 0) = 4 OR COALESCE(cur.cat, 0) = 4))
        ORDER BY m.temporada DESC, COALESCE(m.fecha, '') DESC, m.id_movimiento DESC`);
    return (result.rows as any[]).map((r) => {
        const nombre = String(r.nombre_jugadora || r.nombre);
        return {
            id: Number(r.id_movimiento), slug: slugify(nombre), nombre, posicion: String(r.posicion || ""),
            tipo: r.tipo, temporada: String(r.temporada), fecha: r.fecha ? String(r.fecha).slice(0, 10) : null,
            origen: r.club_origen || null, destino: r.club_destino || null,
            precio: r.precio != null ? Number(r.precio) : null, precioTipo: String(r.precio_tipo || "no_revelado"),
            contratoHasta: r.contrato_hasta ? String(r.contrato_hasta).slice(0, 10) : null,
            fuente: r.fuente_url || r.fuente || null, notas: r.notas || null,
            modalidad: r.modalidad || null, variable: r.precio_variable || null,
            aproximado: Number(r.precio_aproximado) === 1, estado: String(r.estado || "publicado"),
        };
    });
}

export const fetchMercado = () =>
    cached("mercado:v3", 24 * 60 * 60 * 1000, load, { tags: [cacheTags.players] }).catch(() => [] as Move[]);

export const TYPE_LABEL: Record<MoveType, string> = {
    alta: "Fichaje", baja: "Salida", cesion_entrada: "Cesión (llega)", cesion_salida: "Cesión (sale)", renovacion: "Renovación", ascenso: "Ascenso",
};

/** «1,5 M€», «≈150.000 €», «600.000 € + variables», «Libre», «Cesión»… Un importe desconocido nunca es 0 €. */
export function feeLabel(m: Move): string {
    if (m.precio != null && m.precio > 0) {
        const base = m.precio >= 1_000_000
            ? `${(m.precio / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 2 })} M€`
            : `${Math.round(m.precio).toLocaleString("es-ES")} €`;
        return `${m.aproximado ? "≈" : ""}${base}${m.variable ? ` ${m.variable}` : ""}`;
    }
    if (m.modalidad === "retirada") return "Retirada";
    if (m.modalidad === "libre" || m.precioTipo === "libre") return "Libre";
    if (m.modalidad === "cesion" || m.tipo.startsWith("cesion")) return "Cesión";
    if (m.tipo === "ascenso") return "Cantera";
    if (m.tipo === "renovacion") return m.contratoHasta ? `Hasta ${m.contratoHasta.slice(0, 4)}` : "Renovado";
    if (m.modalidad === "traspaso") return "Cifra no publicada";
    return "No revelado";
}

/** Etiqueta del tipo, con la retirada como caso propio de las salidas. */
export const typeLabel = (m: Move) => (m.modalidad === "retirada" ? "Retirada" : TYPE_LABEL[m.tipo]);
