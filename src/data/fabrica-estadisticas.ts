export interface FabricaTournamentStats {
    partidos: number | null;
    titularidades: number | null;
    minutos: number | null;
    goles: number | null;
    asistencias: number | null;
    portera?: boolean;
    porterias_cero?: number | null;
}

const normalize = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const stats = (
    partidos: number | null,
    titularidades: number | null,
    minutos: number | null,
    goles: number | null,
    asistencias: number | null,
    porterias_cero?: number | null,
): FabricaTournamentStats => ({
    partidos,
    titularidades,
    minutos,
    goles,
    asistencias,
    ...(porterias_cero === undefined ? {} : { portera: true, porterias_cero }),
});

const records: Record<string, FabricaTournamentStats> = {
    // Europeo sub-17 2022
    "europeo-sub17-2022::carlacamacho": stats(5, 3, 283, 3, null),
    "europeo-sub17-2022::paulapartido": stats(5, 5, 348, 1, null),
    "europeo-sub17-2022::raquelinigo": stats(4, 0, 123, 0, null),
    "europeo-sub17-2022::sofiafuente": stats(5, 5, 450, 0, null, 4),
    "europeo-sub17-2022::olayaenrique": stats(4, 3, 279, 1, null),

    // Mundial sub-17 2022
    "mundial-sub17-2022::carlacamacho": stats(6, 5, 433, 0, 0),
    "mundial-sub17-2022::noeliacorrero": stats(6, 3, null, 0, 0),
    "mundial-sub17-2022::noecorrero": stats(6, 3, null, 0, 0),
    "mundial-sub17-2022::olayaenrique": stats(5, 2, 267, 0, 0),
    "mundial-sub17-2022::paulapartido": stats(6, 3, 247, 0, 0),
    "mundial-sub17-2022::sofiafuente": stats(6, 6, 540, 0, 0, 4),

    // Europeo sub-17 2023
    "europeo-sub17-2023::amayagarcia": stats(2, 1, 111, 0, null),
    "europeo-sub17-2023::laialopez": stats(1, 1, 90, 0, null, 1),
    "europeo-sub17-2023::marisagarcia": stats(4, 1, 142, 3, null),
    "europeo-sub17-2023::paucomendador": stats(5, 5, 301, 1, null),
    "europeo-sub17-2023::noebeltran": stats(0, 0, 0, 0, null),

    // Europeo sub-19 2023
    "europeo-sub19-2023::carlacamacho": stats(5, 3, 254, 3, null),
    "europeo-sub19-2023::olayaenrique": stats(4, 1, 187, 0, null),
    "europeo-sub19-2023::sofiafuente": stats(0, 0, 0, 0, null, 0),

    // Europeo sub-17 2024
    "europeo-sub17-2024::adrianafolgado": stats(5, 2, 147, 0, null),
    "europeo-sub17-2024::amayagarcia": stats(4, 4, 360, 0, null),
    "europeo-sub17-2024::claudiadelacuerda": stats(4, 4, 360, 0, null),
    "europeo-sub17-2024::irunedorado": stats(5, 2, 201, 0, null),
    "europeo-sub17-2024::laialopez": stats(4, 4, 360, 0, null, 3),
    "europeo-sub17-2024::silviacristobal": stats(3, 1, 115, 0, null),

    // Europeo sub-19 2024
    "europeo-sub19-2024::andreaalonso": stats(0, 0, 0, 0, null),
    "europeo-sub19-2024::marisagarcia": stats(5, 3, 325, 1, null),
    "europeo-sub19-2024::noebeltran": stats(0, 0, 0, 0, null),
    "europeo-sub19-2024::paucomendador": stats(5, 4, 382, 2, null),
    "europeo-sub19-2024::paularubio": stats(0, 0, 0, 0, null),

    // Mundial sub-17 2024
    "mundial-sub17-2024::amayagarcia": stats(4, 4, 360, 1, 0),
    "mundial-sub17-2024::claudiadelacuerda": stats(6, 4, 365, 0, 0),
    "mundial-sub17-2024::irisashley": stats(6, 3, 233, 2, 0),
    "mundial-sub17-2024::irunedorado": stats(5, 5, 401, 0, 0),
    "mundial-sub17-2024::laialopez": stats(5, 5, 450, 0, 0, 3),
    "mundial-sub17-2024::paucomendador": stats(6, 5, 411, 5, 1),

    // Europeo sub-19 2025
    "europeo-sub19-2025::amayagarcia": stats(5, 4, 419, 0, null),
    "europeo-sub19-2025::irunedorado": stats(5, 3, 377, 1, null),
    "europeo-sub19-2025::laialopez": stats(4, 4, 390, 0, null, 4),
    "europeo-sub19-2025::marisagarcia": stats(5, 4, 295, 0, null),
    "europeo-sub19-2025::noebeltran": stats(0, 0, 0, 0, null),
    "europeo-sub19-2025::paucomendador": stats(5, 4, 409, 0, null),

    // Europeo sub-19 2026
    "europeo-sub19-2026::adrianafolgado": stats(5, 3, 275, 0, null),
    "europeo-sub19-2026::amayagarcia": stats(4, 4, 360, 0, null),
    "europeo-sub19-2026::irisashley": stats(3, 1, 112, 0, null),
    "europeo-sub19-2026::irunedorado": stats(5, 4, 367, 1, null),
    "europeo-sub19-2026::laialopez": stats(5, 5, 450, 0, null, 3),
    "europeo-sub19-2026::silviacristobal": stats(5, 5, 450, 0, null),

    // Mundial sub-20 2026
    "mundial-sub20-2026::irunedorado": stats(6, 5, 439, 0, 0),
    "mundial-sub20-2026::laialopez": stats(6, 6, 540, 0, 0, 5),
    "mundial-sub20-2026::paucomendador": stats(7, 5, 424, 6, 1),
    "mundial-sub20-2026::noebeltran": stats(5, 5, 406, 0, 1),
    "mundial-sub20-2026::silviacristobal": stats(6, 6, 540, 0, 0),
    "mundial-sub20-2026::amayagarcia": stats(2, 2, 180, 0, 0),
    "mundial-sub20-2026::marisagarcia": stats(7, 3, 237, 4, 0),
};

export const getFabricaTournamentStats = (tournamentSlug: string, playerName: string) =>
    records[`${tournamentSlug}::${normalize(playerName)}`] ?? null;
