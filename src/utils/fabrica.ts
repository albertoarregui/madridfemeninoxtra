export interface FabricaClubContribution {
    id_torneo: number;
    club: string;
    jugadoras: number;
}

export interface FabricaParticipation {
    id_torneo: number;
    id_jugadora: number | null;
    nombre: string;
    club_en_torneo: string;
    vinculo_rm: 'real_madrid_en_torneo' | 'antes_de_llegar' | 'despues_de_salir';
    es_aportacion_oficial_rm: boolean;
    jugo_final: boolean | null;
    titular_final: boolean | null;
    capitana_final: boolean;
    goles_torneo: number | null;
    resumen: string | null;
    fuente_url: string | null;
}

export interface FabricaAward {
    id_galardon: number;
    id_torneo: number;
    id_jugadora: number | null;
    nombre: string;
    galardon: string;
    organismo: string;
    detalle: string | null;
    orden: number;
    fuente_url: string;
}

export interface FabricaTournament {
    id_torneo: number;
    slug: string;
    anio: number;
    competicion: string;
    categoria: string;
    sede: string | null;
    resultado_espana: string;
    posicion: number;
    madridistas_oficiales: number;
    canteranas_vinculadas: number;
    total_convocadas: number;
    ranking_rm: number;
    ranking_compartido: boolean;
    resumen: string | null;
    fuente_convocatoria_url: string;
    fuente_resultado_url: string | null;
    clubs: FabricaClubContribution[];
    participations: FabricaParticipation[];
    awards: FabricaAward[];
}

export interface FabricaSpainSummary {
    total_torneos: number;
    plazas_rm: number;
    plazas_totales: number;
    torneos_lider: number;
    torneos_top2: number;
    titulos: number;
    subcampeonatos: number;
    galardones: number;
}

export interface FabricaSpainData {
    summary: FabricaSpainSummary;
    tournaments: FabricaTournament[];
}

export interface FabricaMilestone {
    id_hito: number;
    fecha: string | null;
    temporada: string | null;
    categoria: string;
    titulo: string;
    descripcion: string;
    orden: number;
    fuente_url: string;
}

function parsePayload(value: unknown): any {
    if (typeof value !== 'string') return value ?? {};
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

const SPAIN_QUERY = `
WITH resumen AS (
    SELECT
        COUNT(*) AS total_torneos,
        COALESCE(SUM(madridistas_oficiales), 0) AS plazas_rm,
        COALESCE(SUM(total_convocadas), 0) AS plazas_totales,
        SUM(CASE WHEN ranking_rm = 1 THEN 1 ELSE 0 END) AS torneos_lider,
        SUM(CASE WHEN ranking_rm <= 2 THEN 1 ELSE 0 END) AS torneos_top2,
        SUM(CASE WHEN posicion = 1 THEN 1 ELSE 0 END) AS titulos,
        SUM(CASE WHEN posicion = 2 THEN 1 ELSE 0 END) AS subcampeonatos,
        (SELECT COUNT(*) FROM fabrica_galardones) AS galardones
    FROM fabrica_torneos
)
SELECT
    'summary' AS kind,
    json_object(
        'total_torneos', total_torneos,
        'plazas_rm', plazas_rm,
        'plazas_totales', plazas_totales,
        'torneos_lider', torneos_lider,
        'torneos_top2', torneos_top2,
        'titulos', titulos,
        'subcampeonatos', subcampeonatos,
        'galardones', galardones
    ) AS payload
FROM resumen

UNION ALL

SELECT
    'tournament' AS kind,
    json_object(
        'id_torneo', id_torneo,
        'slug', slug,
        'anio', anio,
        'competicion', competicion,
        'categoria', categoria,
        'sede', sede,
        'resultado_espana', resultado_espana,
        'posicion', posicion,
        'madridistas_oficiales', madridistas_oficiales,
        'canteranas_vinculadas', canteranas_vinculadas,
        'total_convocadas', total_convocadas,
        'ranking_rm', ranking_rm,
        'ranking_compartido', ranking_compartido,
        'resumen', resumen,
        'fuente_convocatoria_url', fuente_convocatoria_url,
        'fuente_resultado_url', fuente_resultado_url
    ) AS payload
FROM fabrica_torneos

UNION ALL

SELECT
    'club' AS kind,
    json_object(
        'id_torneo', id_torneo,
        'club', club,
        'jugadoras', jugadoras
    ) AS payload
FROM fabrica_aportaciones_club

UNION ALL

SELECT
    'participation' AS kind,
    json_object(
        'id_torneo', id_torneo,
        'id_jugadora', id_jugadora,
        'nombre', nombre,
        'club_en_torneo', club_en_torneo,
        'vinculo_rm', vinculo_rm,
        'es_aportacion_oficial_rm', es_aportacion_oficial_rm,
        'jugo_final', jugo_final,
        'titular_final', titular_final,
        'capitana_final', capitana_final,
        'goles_torneo', goles_torneo,
        'resumen', resumen,
        'fuente_url', fuente_url
    ) AS payload
FROM fabrica_participaciones

UNION ALL

SELECT
    'award' AS kind,
    json_object(
        'id_galardon', id_galardon,
        'id_torneo', id_torneo,
        'id_jugadora', id_jugadora,
        'nombre', nombre,
        'galardon', galardon,
        'organismo', organismo,
        'detalle', detalle,
        'orden', orden,
        'fuente_url', fuente_url
    ) AS payload
FROM fabrica_galardones
`;

export async function fetchFabricaSpain(): Promise<FabricaSpainData> {
    const { getPlayersDbClient } = await import('../db/client');
    const client = await getPlayersDbClient();

    const empty: FabricaSpainData = {
        summary: {
            total_torneos: 0,
            plazas_rm: 0,
            plazas_totales: 0,
            torneos_lider: 0,
            torneos_top2: 0,
            titulos: 0,
            subcampeonatos: 0,
            galardones: 0,
        },
        tournaments: [],
    };

    if (!client) return empty;

    try {
        // Una sola sentencia para toda la página. El cliente de BD la conserva
        // 30 días en Vercel Runtime Cache porque estas tablas son históricas.
        const result = await client.execute(SPAIN_QUERY);
        const tournaments = new Map<number, FabricaTournament>();
        let summary = empty.summary;

        for (const row of result.rows as any[]) {
            const payload = parsePayload(row.payload);

            if (row.kind === 'summary') {
                summary = {
                    total_torneos: Number(payload.total_torneos || 0),
                    plazas_rm: Number(payload.plazas_rm || 0),
                    plazas_totales: Number(payload.plazas_totales || 0),
                    torneos_lider: Number(payload.torneos_lider || 0),
                    torneos_top2: Number(payload.torneos_top2 || 0),
                    titulos: Number(payload.titulos || 0),
                    subcampeonatos: Number(payload.subcampeonatos || 0),
                    galardones: Number(payload.galardones || 0),
                };
                continue;
            }

            if (row.kind === 'tournament') {
                const id = Number(payload.id_torneo);
                tournaments.set(id, {
                    ...payload,
                    id_torneo: id,
                    anio: Number(payload.anio),
                    posicion: Number(payload.posicion),
                    madridistas_oficiales: Number(payload.madridistas_oficiales),
                    canteranas_vinculadas: Number(payload.canteranas_vinculadas),
                    total_convocadas: Number(payload.total_convocadas),
                    ranking_rm: Number(payload.ranking_rm),
                    ranking_compartido: Boolean(payload.ranking_compartido),
                    clubs: [],
                    participations: [],
                    awards: [],
                });
            }
        }

        // Los UNION no garantizan que los hijos lleguen después de los torneos:
        // se hace una segunda pasada en memoria, no otra lectura a Turso.
        for (const row of result.rows as any[]) {
            const payload = parsePayload(row.payload);
            const id = Number(payload.id_torneo);
            const tournament = tournaments.get(id);
            if (!tournament) continue;

            if (row.kind === 'club') {
                tournament.clubs.push({
                    id_torneo: id,
                    club: String(payload.club),
                    jugadoras: Number(payload.jugadoras),
                });
            } else if (row.kind === 'participation') {
                tournament.participations.push({
                    ...payload,
                    id_torneo: id,
                    id_jugadora: payload.id_jugadora == null ? null : Number(payload.id_jugadora),
                    es_aportacion_oficial_rm: Boolean(payload.es_aportacion_oficial_rm),
                    jugo_final: payload.jugo_final == null ? null : Boolean(payload.jugo_final),
                    titular_final: payload.titular_final == null ? null : Boolean(payload.titular_final),
                    capitana_final: Boolean(payload.capitana_final),
                    goles_torneo: payload.goles_torneo == null ? null : Number(payload.goles_torneo),
                });
            } else if (row.kind === 'award') {
                tournament.awards.push({
                    ...payload,
                    id_galardon: Number(payload.id_galardon),
                    id_torneo: id,
                    id_jugadora: payload.id_jugadora == null ? null : Number(payload.id_jugadora),
                    orden: Number(payload.orden || 0),
                });
            }
        }

        const ordered = [...tournaments.values()]
            .sort((a, b) => a.anio - b.anio || a.id_torneo - b.id_torneo)
            .map((tournament) => ({
                ...tournament,
                clubs: tournament.clubs.sort((a, b) => b.jugadoras - a.jugadoras || a.club.localeCompare(b.club, 'es')),
                participations: tournament.participations.sort((a, b) => {
                    if (a.es_aportacion_oficial_rm !== b.es_aportacion_oficial_rm) {
                        return Number(b.es_aportacion_oficial_rm) - Number(a.es_aportacion_oficial_rm);
                    }
                    return a.nombre.localeCompare(b.nombre, 'es');
                }),
                awards: tournament.awards.sort((a, b) => a.orden - b.orden),
            }));

        return { summary, tournaments: ordered };
    } catch (error) {
        console.error('[LA FABRICA] Error cargando España:', error);
        return empty;
    }
}

export async function fetchFabricaHistory(): Promise<FabricaMilestone[]> {
    const { getPlayersDbClient } = await import('../db/client');
    const client = await getPlayersDbClient();
    if (!client) return [];

    try {
        // Una lectura, estática y cacheada durante 30 días.
        const result = await client.execute(`
            SELECT id_hito, fecha, temporada, categoria, titulo, descripcion, orden, fuente_url
            FROM fabrica_hitos
            ORDER BY orden ASC, fecha ASC, id_hito ASC
        `);

        return (result.rows as any[]).map((row) => ({
            id_hito: Number(row.id_hito),
            fecha: row.fecha ? String(row.fecha) : null,
            temporada: row.temporada ? String(row.temporada) : null,
            categoria: String(row.categoria),
            titulo: String(row.titulo),
            descripcion: String(row.descripcion),
            orden: Number(row.orden),
            fuente_url: String(row.fuente_url),
        }));
    } catch (error) {
        console.error('[LA FABRICA] Error cargando Historia:', error);
        return [];
    }
}
