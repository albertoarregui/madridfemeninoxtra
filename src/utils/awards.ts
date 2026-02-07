import { slugify } from "./players";

export interface AwardData {
    id_premio: number;
    id_jugadora: number;
    nombre: string;
    slug: string;
    tipo: string;
    titulo: string;
    fecha: string;
    temporada?: string;
    mes?: string;
}

export async function fetchPlayerAwards(): Promise<AwardData[]> {
    try {
        const { getPlayersDbClient } = await import('../db/client');
        const client = await getPlayersDbClient();

        if (!client) {
            return [];
        }

        const query = `
            SELECT 
                p.id_premio,
                p.id_jugadora,
                j.nombre,
                p.tipo,
                p.titulo,
                p.fecha
            FROM jugadora_del_mes p
            JOIN jugadoras j ON p.id_jugadora = j.id_jugadora
            ORDER BY p.fecha DESC
        `;

        const result = await client.execute(query);

        return result.rows.map((row: any) => {
            const fecha = new Date(row.fecha);
            const año = fecha.getFullYear();
            const mes = fecha.toLocaleDateString('es-ES', { month: 'long' });

            const mesNumero = fecha.getMonth() + 1;
            const temporada = mesNumero >= 8 ? `${año}-${año + 1}` : `${año - 1}-${año}`;

            return {
                id_premio: row.id_premio,
                id_jugadora: row.id_jugadora,
                nombre: row.nombre,
                slug: slugify(row.nombre),
                tipo: row.tipo,
                titulo: row.titulo,
                fecha: row.fecha,
                temporada: temporada,
                mes: mes
            };
        });

    } catch (error) {
        console.error("Error fetching player awards:", error);
        return [];
    }
}
