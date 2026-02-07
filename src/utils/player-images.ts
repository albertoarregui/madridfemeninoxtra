
export const IMAGE_OVERRIDES: Record<string, string> = {
    "yasmim": "yasmim_ribeiro",
    "antonia": "antonia_silva",
    "antônia": "antonia_silva",
    "kathellen": "kathellen_sousa",
    "pau_comendador": "paula_comendador",
    "marisa": "marisa_garcia",
    "marisa_garcia": "marisa_garcia",
    "bea_velez": "bea_ortiz",
    "beatriz_v??lez": "bea_ortiz",
    "beatriz_v_lez": "bea_ortiz",
    "beatriz_v?lez": "bea_ortiz",
    "ari": "ariana_arias",
    "ariana": "ariana_arias",
    "ariana_jimenez": "ariana_arias",
    "dana": "dana_benitez",
    "dana_otero": "dana_benitez",
    "adriana": "adriana_folgado",
    "adriana_blanco": "adriana_folgado",
    "freja_olofsson": "freja_siri",
    "freja_siri": "freja_siri",
    "claudia": "claudia_florentino",
    "claudia_florentino": "claudia_florentino",
    "caroline_moller": "caroline_moller",
    "caroline_møller": "caroline_moller",
    "noe_bejarano": "noe_bejarano",
    "noem??_bejarano": "noe_bejarano",
    "noem_bejarano": "noe_bejarano",
    "shei": "sheila_garcia",
    "sheila": "sheila_garcia",
    "feller": "naomie_feller",
    "naomie": "naomie_feller",
    "carla_carrillo": "carla_camacho",
    "carla_camacho": "carla_camacho",
    "naiara": "naiara_sanmartin",
    "naiara_sanmartin": "naiara_sanmartin",
    "maria_portoles": "maria_portoles",
    "elsa_santos": "elsa_santos",
    "elsa": "elsa_santos",
    "andrea_alonso": "andrea_alonso",
    "andrea_alonso_tellez": "andrea_alonso",
    "andrea": "andrea_alonso",
    "belen_de_gracia": "belen_de_gracia",
    "belen_ruiz": "belen_de_gracia",
    "belen": "belen_de_gracia",
    "porto": "maria_portoles",
    "maria_antolin": "marisa_garcia"
};

export const NAME_OVERRIDES: Record<string, string> = {
    "yasmim": "Yasmim Ribeiro",
    "antonia": "Antonia Silva",
    "antônia": "Antonia Silva",
    "kathellen": "Kathellen Sousa",
    "pau comendador": "Pau Comendador",
    "marisa": "Marisa García",
    "marisa garcia": "Marisa García",
    "marisa garcía": "Marisa García",
    "bea velez": "Bea Vélez",
    "beatriz v??lez": "Bea Vélez",
    "beatriz v?lez": "Bea Vélez",
    "beatriz vélez": "Bea Vélez",
    "ariana": "Ariana Arias",
    "ari": "Ariana Arias",
    "ariana jimenez": "Ariana Arias",
    "dana": "Dana Benítez",
    "dana otero": "Dana Benítez",
    "adriana": "Adriana Folgado",
    "adriana blanco": "Adriana Folgado",
    "freja olofsson": "Freja Siri",
    "freja siri": "Freja Siri",
    "claudia": "Claudia Florentino",
    "claudia florentino": "Claudia Florentino",
    "noe bejarano": "Noe Bejarano",
    "noem?? bejarano": "Noe Bejarano",
    "carla carrillo": "Carla Camacho",
    "carla camacho": "Carla Camacho",
    "naiara": "Naiara Sanmartín",
    "maria portoles": "María Portoles",
    "elsa santos": "Elsa Santos",
    "elsa": "Elsa Santos",
    "andrea alonso": "Andrea Alonso",
    "andrea alonso tellez": "Andrea Alonso",
    "belen de gracia": "Belén de Gracia",
    "belen ruiz": "Belén de Gracia",
    "porto": "María Portoles",
    "maria antolin": "Marisa García",
    "maría antolín": "Marisa García"
};

export const getDisplayName = (originalName: string) => {
    const lower = originalName.toLowerCase();
    for (const [key, val] of Object.entries(NAME_OVERRIDES)) {
        if (key.toLowerCase() === lower) return val;
    }
    if (lower.includes("noem") && lower.includes("bejarano")) return "Noe Bejarano";
    if (lower.includes("beatriz") && lower.includes("lez")) return "Bea Vélez";
    return originalName;
};

import { getAssetUrl } from "./assets";

export const getPlayerImage = (imageSlug: string) => {
    let override = IMAGE_OVERRIDES[imageSlug];

    if (!override) {
        if (imageSlug.includes("noem") && imageSlug.includes("bejarano")) override = "noe_bejarano";
        if (imageSlug.includes("beatriz") && imageSlug.includes("lez")) override = "bea_ortiz";
    }

    const finalName = override || imageSlug;
    return getAssetUrl("jugadorasPerfil", finalName);
};

export const getUrlSlug = (displayName: string) => {
    return displayName.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-');
}

export const getImageSlug = (playerName: string) => {
    return playerName.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_');
}
