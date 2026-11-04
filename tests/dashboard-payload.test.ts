import assert from "node:assert/strict";
import test from "node:test";
import { compactDashboardPayload, expandDashboardGoals, expandDashboardMatches } from "../src/lib/dashboard-payload.ts";

test("dashboard payload removes repeated keys and player image URLs without losing data", () => {
    const matches = Array.from({ length: 10 }, (_, index) => ({
        temporada_nombre: "2026/27", competicion_nombre: "Liga F", goles_rm: index,
        goles_rival: 0, resultado: "V", estadio: "Alfredo Di Stéfano", fecha: `2026-10-${index + 1}`,
    }));
    const goals = Array.from({ length: 20 }, (_, index) => ({
        id_gol: index, minuto: index + 1, temporada: "2026/27", competicion: "Liga F",
        nombre_goleadora: "Athenea del Castillo", foto_goleadora: "https://media.example/athenea.webp",
    }));
    const compact = compactDashboardPayload(matches, goals);
    const expandedMatches = expandDashboardMatches(compact.matchRows);
    const expandedGoals = expandDashboardGoals(compact.goalRows, compact.playerImages);

    assert.equal(expandedMatches[0].estadio, matches[0].estadio);
    assert.equal(expandedGoals[0].foto_goleadora, goals[0].foto_goleadora);
    assert.ok(JSON.stringify(compact).length < JSON.stringify({ matches, goals }).length * 0.65);
});
