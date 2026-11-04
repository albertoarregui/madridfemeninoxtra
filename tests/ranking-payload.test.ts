import test from "node:test";
import assert from "node:assert/strict";
import { compactRankingRows, expandRankingRows } from "../src/lib/ranking-payload.ts";

test("ranking payload round-trips the fields used by the client", () => {
    const source = [{
        id_jugadora: 10,
        nombre: "Athenea del Castillo",
        slug: "athenea-del-castillo",
        posicion: "Extremo",
        temporada: "2026/27",
        competicion: "Liga F",
        goles: 7,
        asistencias: 3,
        partidos: 11,
        minutos: 720,
        tiros_totales: 24,
        valoracion: 7.4,
    }];

    const compact = compactRankingRows(source);
    const [expanded] = expandRankingRows(compact.rows, compact.players);

    assert.equal(expanded.nombre, source[0].nombre);
    assert.equal(expanded.temporada, source[0].temporada);
    assert.equal(expanded.goles, source[0].goles);
    assert.equal(expanded.asistencias, source[0].asistencias);
    assert.equal(expanded.valoracion, source[0].valoracion);
    assert.equal(expanded.penaltis, undefined);
    assert.ok(JSON.stringify(compact).length < JSON.stringify(source).length);
});
