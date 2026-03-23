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
    foto_url?: string | null;
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
                p.fecha,
                p.foto_url
            FROM mvp p
            JOIN jugadoras j ON p.id_jugadora = j.id_jugadora
            ORDER BY 
                substr(p.fecha, 7, 4) DESC, 
                substr(p.fecha, 4, 2) DESC, 
                substr(p.fecha, 1, 2) DESC
        `;

        const result = await client.execute(query);

        const parsedAwards = result.rows.map((row: any) => {

            const parts = row.fecha.split('/');
            let date: Date;
            if (parts.length === 3) {
                date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            } else {
                date = new Date(row.fecha);
            }

            const año = date.getFullYear();
            const mes = date.toLocaleDateString('es-ES', { month: 'long' });

            const mesNumero = date.getMonth() + 1;
            const temporada = mesNumero >= 8 ? `${año}/${año + 1}` : `${año - 1}/${año}`;

            return {
                id_premio: row.id_premio,
                id_jugadora: row.id_jugadora,
                nombre: row.nombre,
                slug: slugify(row.nombre),
                tipo: row.tipo,
                titulo: row.titulo,
                fecha: row.fecha,
                temporada: temporada,
                mes: mes,
                foto_url: row.foto_url,
                _timestamp: date.getTime()
            };
        });

        return parsedAwards.sort((a, b) => b._timestamp - a._timestamp);

    } catch (error) {
        console.error("Error fetching player awards:", error);
        return [];
    }
}


