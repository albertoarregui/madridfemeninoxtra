import { cacheTags } from './cache-tags';

/**
 * Etiqueta de seguridad para consultas sobre tablas que todavía no estén
 * registradas. Las lecturas conocidas también la incluyen, pero solo se
 * invalida cuando una escritura no puede clasificarse con precisión.
 */
export const DATABASE_CACHE_TAG = 'database';

export const TABLE_EFFECT_TAGS = {
    partidos: [
        cacheTags.matches, cacheTags.calendar, cacheTags.statistics,
        cacheTags.rankings, cacheTags.homepage,
    ],
    goles_y_asistencias: [cacheTags.goals, cacheTags.statistics, cacheTags.rankings],
    goles_propia: [cacheTags.goals, cacheTags.statistics, cacheTags.rankings],
    goles_rival: [cacheTags.goals, cacheTags.matches, cacheTags.statistics, cacheTags.rankings],
    alineaciones: [cacheTags.lineups, cacheTags.statistics, cacheTags.players, cacheTags.rankings],
    estadisticas_jugadoras: [cacheTags.statistics, cacheTags.players, cacheTags.rankings],
    estadisticas_partidos: [cacheTags.statistics, cacheTags.matches, cacheTags.rankings],
    jugadoras: [cacheTags.players, cacheTags.statistics, cacheTags.rankings],
    dorsales: [cacheTags.players, cacheTags.statistics],
    categorias: [cacheTags.players],
    lesiones: [cacheTags.players],
    contratos: [cacheTags.players],
    trayectoria_jugadoras: [cacheTags.players],
    redes_sociales: [cacheTags.players],
    estadios: [cacheTags.stadiums, cacheTags.matches, cacheTags.calendar, cacheTags.statistics],
    entrenadores: [cacheTags.coaches, cacheTags.matches, cacheTags.statistics],
    trayectoria_entrenadores: [cacheTags.coaches],
    clubes: [cacheTags.rivals, cacheTags.matches, cacheTags.calendar, cacheTags.statistics],
    arbitras: [cacheTags.referees, cacheTags.matches, cacheTags.statistics],
    tarjetas: [cacheTags.statistics, cacheTags.matches, cacheTags.players],
    tarjetas_rival: [cacheTags.statistics, cacheTags.matches, cacheTags.rivals],
    cambios: [cacheTags.lineups, cacheTags.statistics, cacheTags.players],
    equipaciones: [cacheTags.matches],
    penaltis_fallados: [cacheTags.goals, cacheTags.matches, cacheTags.statistics, cacheTags.rankings],
    tanda_penaltis: [cacheTags.goals, cacheTags.matches, cacheTags.statistics],
    competiciones: [cacheTags.matches, cacheTags.calendar, cacheTags.statistics],
    temporadas: [cacheTags.matches, cacheTags.calendar, cacheTags.statistics],
    mvp: [cacheTags.awards, cacheTags.players, cacheTags.homepage, cacheTags.matches],
} as const satisfies Record<string, readonly string[]>;

export type CachedTable = keyof typeof TABLE_EFFECT_TAGS;

const SQL_COMMENTS = /--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\//g;
const WRITE_KEYWORDS = /\b(insert|update|delete|replace|create|alter|drop|truncate|vacuum|reindex)\b/i;

function withoutComments(sql: string): string {
    return sql.replace(SQL_COMMENTS, ' ').trim();
}

export function isReadOnlySql(sql: string): boolean {
    const normalized = withoutComments(sql);
    if (/^(select|values)\b/i.test(normalized)) return true;
    if (/^with\b/i.test(normalized)) return !WRITE_KEYWORDS.test(normalized);
    return false;
}

export function isCachedTable(value: string): value is CachedTable {
    return Object.prototype.hasOwnProperty.call(TABLE_EFFECT_TAGS, value);
}

export function tableCacheTag(table: CachedTable): string {
    return `db-table-${table}`;
}

function tablesForSql(sql: string): CachedTable[] {
    const normalized = withoutComments(sql).toLowerCase();
    const tables: CachedTable[] = [];

    for (const table of Object.keys(TABLE_EFFECT_TAGS) as CachedTable[]) {
        if (new RegExp(`\\b${table}\\b`, 'i').test(normalized)) {
            tables.push(table);
        }
    }

    return tables;
}

/**
 * Cada consulta se liga únicamente a las tablas que lee. Así, escribir una
 * alineación no expulsa de Runtime Cache consultas que solo leen partidos.
 */
export function tagsForReadSql(sql: string): string[] {
    return [...tablesForSql(sql).map(tableCacheTag), DATABASE_CACHE_TAG];
}

/**
 * Una escritura invalida las consultas de sus tablas y las páginas de los
 * dominios afectados. Las tablas desconocidas activan la purga de seguridad.
 */
export function tagsForWriteSql(sql: string): string[] {
    const tables = tablesForSql(sql);
    return tables.length > 0 ? tagsForTables(tables) : [DATABASE_CACHE_TAG];
}

export function tagsForTables(tables: readonly CachedTable[]): string[] {
    return [...new Set(tables.flatMap((table) => [
        tableCacheTag(table),
        ...TABLE_EFFECT_TAGS[table],
    ]))];
}
