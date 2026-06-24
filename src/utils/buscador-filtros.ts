import { getDbClient } from '../db/client';

export interface RivalOption { id: number; nombre: string; }
export interface FilterOptions {
    seasons: string[];
    competitions: string[];
    rivals: RivalOption[];
}

const RM_ID = 1;

const COMPETITION_ORDER = ['Liga F', 'UWCL', 'Copa de la Reina', 'Supercopa de España', 'Amistosos'];

function orderCompetitions(list: string[]): string[] {
    return [...list].sort((a, b) => {
        const ia = COMPETITION_ORDER.indexOf(a);
        const ib = COMPETITION_ORDER.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
    });
}

export async function getMatchFilterOptions(): Promise<FilterOptions> {
        const client = await getDbClient();
        if (!client) return { seasons: [], competitions: [], rivals: [] };

        const [seasonsRes, compsRes, rivalsRes] = await Promise.all([
            client.execute(
                `SELECT DISTINCT t.temporada
                 FROM partidos p JOIN temporadas t ON p.id_temporada = t.id_temporada
                 WHERE t.temporada IS NOT NULL
                 ORDER BY t.temporada DESC`,
            ),
            client.execute(
                `SELECT DISTINCT c.competicion
                 FROM partidos p JOIN competiciones c ON p.id_competicion = c.id_competicion
                 WHERE c.competicion IS NOT NULL`,
            ),
            client.execute({
                sql: `SELECT DISTINCT cl.id_club, cl.nombre
                      FROM partidos p
                      JOIN clubes cl ON cl.id_club IN (p.id_club_local, p.id_club_visitante)
                      WHERE cl.id_club != ? AND cl.nombre IS NOT NULL
                      ORDER BY cl.nombre`,
                args: [RM_ID],
            }),
        ]);

        return {
            seasons: seasonsRes.rows.map((r: any) => String(r.temporada)),
            competitions: orderCompetitions(compsRes.rows.map((r: any) => String(r.competicion))),
            rivals: rivalsRes.rows.map((r: any) => ({ id: Number(r.id_club), nombre: String(r.nombre) })),
        };
}
