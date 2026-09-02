export function resolveMatchId(row: { partido_id?: unknown; id_partido?: unknown }): unknown {
    return row.partido_id ?? row.id_partido;
}
