import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_Cpt8RX-b.mjs';
import { $ as $$Layout } from '../../chunks/Layout_CTgb0INN.mjs';
import { f as fetchRivalsDirectly } from '../../chunks/rivales_Cf9EjrAC.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

async function fetchRivalRecords(rivalId) {
  try {
    const { createClient } = await import('@libsql/client');
    const url = undefined                                  ;
    const authToken = undefined                                ;
    if (!url || !authToken) {
      console.error("Credenciales de Turso no configuradas");
      return null;
    }
    const db = createClient({
      url,
      authToken
    });
    console.log("Fetching rival records for rival ID:", rivalId);
    let topScorer = null;
    let rivalTopScorer = null;
    let mostAppearances = null;
    let biggestWin = null;
    let biggestLoss = null;
    let mostRepeated = null;
    try {
      const topScorerResult = await db.execute({
        sql: `
                    SELECT 
                        j.nombre,
                        COUNT(*) as goles
                    FROM goles_y_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.goleadora = j.id_jugadora
                    WHERE ga.goleadora IS NOT NULL
                    AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY j.id_jugadora, j.nombre
                    ORDER BY goles DESC
                    LIMIT 1
                `,
        args: [rivalId, rivalId]
      });
      topScorer = topScorerResult.rows[0] || null;
      console.log("Top scorer:", topScorer);
    } catch (error) {
      console.error("Error fetching top scorer:", error);
    }
    try {
      const biggestWinResult = await db.execute({
        sql: `
                    SELECT 
                        p.goles_rm, 
                        p.goles_rival,
                        (p.goles_rm - p.goles_rival) as diferencia,
                        p.goles_rm || '-' || p.goles_rival as resultado
                    FROM partidos p
                    WHERE (p.id_club_local = ? OR p.id_club_visitante = ?) 
                    AND p.goles_rm > p.goles_rival
                    ORDER BY diferencia DESC, p.goles_rm DESC
                    LIMIT 1
                `,
        args: [rivalId, rivalId]
      });
      biggestWin = biggestWinResult.rows[0] || null;
      console.log("Biggest win:", biggestWin);
    } catch (error) {
      console.error("Error fetching biggest win:", error);
    }
    try {
      const biggestLossResult = await db.execute({
        sql: `
                    SELECT 
                        p.goles_rm, 
                        p.goles_rival,
                        (p.goles_rival - p.goles_rm) as diferencia,
                        p.goles_rm || '-' || p.goles_rival as resultado
                    FROM partidos p
                    WHERE (p.id_club_local = ? OR p.id_club_visitante = ?) 
                    AND p.goles_rm < p.goles_rival
                    ORDER BY diferencia DESC, p.goles_rival DESC
                    LIMIT 1
                `,
        args: [rivalId, rivalId]
      });
      biggestLoss = biggestLossResult.rows[0] || null;
      console.log("Biggest loss:", biggestLoss);
    } catch (error) {
      console.error("Error fetching biggest loss:", error);
    }
    try {
      const mostRepeatedResult = await db.execute({
        sql: `
                    SELECT 
                        p.goles_rm || '-' || p.goles_rival as resultado, 
                        COUNT(*) as veces
                    FROM partidos p
                    WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY resultado
                    ORDER BY veces DESC
                    LIMIT 1
                `,
        args: [rivalId, rivalId]
      });
      mostRepeated = mostRepeatedResult.rows[0] || null;
      console.log("Most repeated:", mostRepeated);
    } catch (error) {
      console.error("Error fetching most repeated:", error);
    }
    try {
      const mostAppearancesResult = await db.execute({
        sql: `
                    SELECT 
                        j.nombre,
                        COUNT(DISTINCT ga.id_partido) as partidos
                    FROM goles_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.id_jugadora = j.id_jugadora
                    WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY j.id_jugadora, j.nombre
                    ORDER BY partidos DESC
                    LIMIT 1
                `,
        args: [rivalId, rivalId]
      });
      mostAppearances = mostAppearancesResult.rows[0] || null;
      console.log("Most appearances:", mostAppearances);
    } catch (error) {
      console.error("Error fetching most appearances:", error);
    }
    const records = {
      maximo_goleador: topScorer,
      goleador_rival: null,
      // No disponible por ahora
      mas_partidos: mostAppearances,
      mayor_victoria: biggestWin,
      mayor_derrota: biggestLoss,
      mas_repetido: mostRepeated
    };
    console.log("Final rival records object:", records);
    return records;
  } catch (error) {
    console.error("Error fetching rival records:", error);
    return null;
  }
}
async function fetchRivalTopPlayers(rivalId) {
  try {
    const { createClient } = await import('@libsql/client');
    const url = undefined                                  ;
    const authToken = undefined                                ;
    if (!url || !authToken) {
      console.error("Credenciales de Turso no configuradas");
      return { topScorers: [], topAssisters: [], topContributors: [] };
    }
    const db = createClient({
      url,
      authToken
    });
    console.log("Fetching rival top players for rival ID:", rivalId);
    const topScorersResult = await db.execute({
      sql: `
                SELECT 
                    j.nombre,
                    COUNT(*) as goles
                FROM goles_y_asistencias ga
                INNER JOIN partidos p ON ga.id_partido = p.id_partido
                INNER JOIN jugadoras j ON ga.goleadora = j.id_jugadora
                WHERE ga.goleadora IS NOT NULL
                AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                GROUP BY j.id_jugadora, j.nombre
                ORDER BY goles DESC
                LIMIT 10
            `,
      args: [rivalId, rivalId]
    });
    const topAssistersResult = await db.execute({
      sql: `
                SELECT 
                    j.nombre,
                    COUNT(*) as asistencias
                FROM goles_y_asistencias ga
                INNER JOIN partidos p ON ga.id_partido = p.id_partido
                INNER JOIN jugadoras j ON ga.asistente = j.id_jugadora
                WHERE ga.asistente IS NOT NULL
                AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                GROUP BY j.id_jugadora, j.nombre
                ORDER BY asistencias DESC
                LIMIT 10
            `,
      args: [rivalId, rivalId]
    });
    const topContributorsResult = await db.execute({
      sql: `
                SELECT 
                    nombre,
                    SUM(goles) as goles,
                    SUM(asistencias) as asistencias,
                    SUM(goles) + SUM(asistencias) as total
                FROM (
                    SELECT j.id_jugadora, j.nombre, COUNT(*) as goles, 0 as asistencias
                    FROM goles_y_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.goleadora = j.id_jugadora
                    WHERE ga.goleadora IS NOT NULL
                    AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY j.id_jugadora, j.nombre
                    
                    UNION ALL
                    
                    SELECT j.id_jugadora, j.nombre, 0 as goles, COUNT(*) as asistencias
                    FROM goles_y_asistencias ga
                    INNER JOIN partidos p ON ga.id_partido = p.id_partido
                    INNER JOIN jugadoras j ON ga.asistente = j.id_jugadora
                    WHERE ga.asistente IS NOT NULL
                    AND (p.id_club_local = ? OR p.id_club_visitante = ?)
                    GROUP BY j.id_jugadora, j.nombre
                )
                GROUP BY nombre
                ORDER BY total DESC
                LIMIT 10
            `,
      args: [rivalId, rivalId, rivalId, rivalId]
    });
    return {
      topScorers: topScorersResult.rows || [],
      topAssisters: topAssistersResult.rows || [],
      topContributors: topContributorsResult.rows || []
    };
  } catch (error) {
    console.error("Error fetching rival top players:", error);
    return { topScorers: [], topAssisters: [], topContributors: [] };
  }
}
async function fetchRivalMatches(rivalId) {
  try {
    const { createClient } = await import('@libsql/client');
    const url = undefined                                  ;
    const authToken = undefined                                ;
    if (!url || !authToken) {
      console.error("Credenciales de Turso no configuradas");
      return [];
    }
    const db = createClient({
      url,
      authToken
    });
    console.log("========== DEBUG: Fetching matches ==========");
    console.log("Rival ID:", rivalId, "Type:", typeof rivalId);
    const countResult = await db.execute({
      sql: "SELECT COUNT(*) as total FROM partidos",
      args: []
    });
    console.log("Total matches in database:", countResult.rows[0]);
    const matchesResult = await db.execute({
      sql: `
                SELECT 
                    p.id_partido,
                    p.fecha,
                    p.id_competicion,
                    c.competicion,
                    p.id_club_local,
                    p.id_club_visitante,
                    p.goles_rm,
                    p.goles_rival,
                    p.id_arbitra,
                    a.nombre as arbitra,
                    p.id_estadio,
                    e.nombre as estadio,
                    p.penaltis as asistencia
                FROM partidos p
                LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
                LEFT JOIN arbitras a ON p.id_arbitra = a.id_arbitra
                LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
                WHERE (p.id_club_local = ? OR p.id_club_visitante = ?)
                ORDER BY p.fecha DESC
            `,
      args: [rivalId, rivalId]
    });
    console.log("Matches found for rival:", matchesResult.rows.length);
    if (matchesResult.rows.length > 0) {
      console.log("Sample match:", JSON.stringify(matchesResult.rows[0], null, 2));
    }
    console.log("========== END DEBUG ==========");
    return matchesResult.rows.map((match) => {
      const esLocal = match.id_club_visitante === Number(rivalId);
      return {
        id: match.id_partido,
        fecha: match.fecha,
        competicion: match.competicion || "-",
        esLocal,
        ubicacion: esLocal ? "Local" : "Visitante",
        resultado: `${match.goles_rm}-${match.goles_rival}`,
        golesRM: match.goles_rm,
        golesRival: match.goles_rival,
        arbitra: match.arbitra || "-",
        estadio: match.estadio || "-",
        asistencia: match.asistencia || null
      };
    });
  } catch (error) {
    console.error("Error fetching rival matches:", error);
    return [];
  }
}
function calculateRivalStats(matches) {
  const stats = {
    home: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 },
    away: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 },
    total: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 }
  };
  matches.forEach((match) => {
    const golesRM = parseInt(match.golesRM) || 0;
    const golesRival = parseInt(match.golesRival) || 0;
    const isHome = match.esLocal;
    const location = isHome ? stats.home : stats.away;
    location.pj++;
    location.gf += golesRM;
    location.gc += golesRival;
    if (golesRM > golesRival) {
      location.pg++;
    } else if (golesRM === golesRival) {
      location.pe++;
    } else {
      location.pp++;
    }
  });
  stats.total.pj = stats.home.pj + stats.away.pj;
  stats.total.pg = stats.home.pg + stats.away.pg;
  stats.total.pe = stats.home.pe + stats.away.pe;
  stats.total.pp = stats.home.pp + stats.away.pp;
  stats.total.gf = stats.home.gf + stats.away.gf;
  stats.total.gc = stats.home.gc + stats.away.gc;
  const addCalculatedFields = (obj) => ({
    ...obj,
    percPG: obj.pj > 0 ? (obj.pg / obj.pj * 100).toFixed(1) : "0.0",
    percPE: obj.pj > 0 ? (obj.pe / obj.pj * 100).toFixed(1) : "0.0",
    percPP: obj.pj > 0 ? (obj.pp / obj.pj * 100).toFixed(1) : "0.0",
    avg: obj.pj > 0 ? (obj.gf / obj.pj).toFixed(2) : "0.00",
    dif: obj.gf - obj.gc
  });
  return {
    home: addCalculatedFields(stats.home),
    away: addCalculatedFields(stats.away),
    total: addCalculatedFields(stats.total)
  };
}

const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const allRivals = await fetchRivalsDirectly();
  const rival = allRivals.find((r) => r.slug === slug);
  if (!rival) {
    return Astro2.redirect("/404");
  }
  let shieldImage;
  try {
    const images = /* #__PURE__ */ Object.assign({"/src/assets/escudos/alaves.png": () => import('../../chunks/alaves_Q5bKzlak.mjs').then(n => n._),"/src/assets/escudos/alhama.png": () => import('../../chunks/alhama_B8QQGeb0.mjs').then(n => n._),"/src/assets/escudos/america.png": () => import('../../chunks/america_Bx265hCX.mjs').then(n => n._),"/src/assets/escudos/arsenal.png": () => import('../../chunks/arsenal_C615rLnw.mjs').then(n => n._),"/src/assets/escudos/as_roma.png": () => import('../../chunks/as_roma_I2aPh9lt.mjs').then(n => n._),"/src/assets/escudos/athletic_club.png": () => import('../../chunks/athletic_club_BF29MU-R.mjs').then(n => n._),"/src/assets/escudos/atletico_de_madrid.png": () => import('../../chunks/atletico_de_madrid_B7nZtP1W.mjs').then(n => n._),"/src/assets/escudos/bayern_munich.png": () => import('../../chunks/bayern_munich_QzWszd8m.mjs').then(n => n._),"/src/assets/escudos/breidablik.png": () => import('../../chunks/breidablik_DbCjfPUJ.mjs').then(n => n._),"/src/assets/escudos/cacereno.png": () => import('../../chunks/cacereno_EH-X7z75.mjs').then(n => n._),"/src/assets/escudos/celtic_fc.png": () => import('../../chunks/celtic_fc_BxXSdDlV.mjs').then(n => n._),"/src/assets/escudos/chelsea.png": () => import('../../chunks/chelsea_DxBSBfNj.mjs').then(n => n._),"/src/assets/escudos/costa_adeje_tenerife.png": () => import('../../chunks/costa_adeje_tenerife_B_YlJztk.mjs').then(n => n._),"/src/assets/escudos/deportivo_abanca.png": () => import('../../chunks/deportivo_abanca_BNIs3Rtl.mjs').then(n => n._),"/src/assets/escudos/dux_logrono.png": () => import('../../chunks/dux_logrono_Bw9KHJFD.mjs').then(n => n._),"/src/assets/escudos/eintracht_de_frankfurt.png": () => import('../../chunks/eintracht_de_frankfurt_BFogDbDZ.mjs').then(n => n._),"/src/assets/escudos/espanyol.png": () => import('../../chunks/espanyol_CfvPlOcZ.mjs').then(n => n._),"/src/assets/escudos/fc_barcelona.png": () => import('../../chunks/fc_barcelona_DssMeZMZ.mjs').then(n => n._),"/src/assets/escudos/fc_union_berlin.png": () => import('../../chunks/fc_union_berlin_Xi8XlDBG.mjs').then(n => n._),"/src/assets/escudos/ffc_turbine_potsdam.png": () => import('../../chunks/ffc_turbine_potsdam_eP6EMkrS.mjs').then(n => n._),"/src/assets/escudos/fundacion_albacete.png": () => import('../../chunks/fundacion_albacete_BvNuEbXP.mjs').then(n => n._),"/src/assets/escudos/fundacion_osasuna.png": () => import('../../chunks/fundacion_osasuna_BdLj6JGq.mjs').then(n => n._),"/src/assets/escudos/granada_cf.png": () => import('../../chunks/granada_cf_DDMZK2NS.mjs').then(n => n._),"/src/assets/escudos/hacken.png": () => import('../../chunks/hacken_CT-vR_dO.mjs').then(n => n._),"/src/assets/escudos/kharkiv.png": () => import('../../chunks/kharkiv_DZFE5b_4.mjs').then(n => n._),"/src/assets/escudos/levante_badalona.png": () => import('../../chunks/levante_badalona_Cfb--hhl.mjs').then(n => n._),"/src/assets/escudos/levante_ud.png": () => import('../../chunks/levante_ud_CTXVkX9s.mjs').then(n => n._),"/src/assets/escudos/madrid_cff.png": () => import('../../chunks/madrid_cff_DJHGEtz-.mjs').then(n => n._),"/src/assets/escudos/manchester_city.png": () => import('../../chunks/manchester_city_BChHSUEv.mjs').then(n => n._),"/src/assets/escudos/paris_fc.png": () => import('../../chunks/paris_fc_C6I-U6zr.mjs').then(n => n._),"/src/assets/escudos/psg.png": () => import('../../chunks/psg_CePy9A2h.mjs').then(n => n._),"/src/assets/escudos/rayo_vallecano.png": () => import('../../chunks/rayo_vallecano_C7RWZ0He.mjs').then(n => n._),"/src/assets/escudos/real_betis.png": () => import('../../chunks/real_betis_BJ-xFxTy.mjs').then(n => n._),"/src/assets/escudos/real_madrid.png": () => import('../../chunks/real_madrid_DUnI9Gkp.mjs').then(n => n._),"/src/assets/escudos/real_sociedad.png": () => import('../../chunks/real_sociedad_B5J8doFi.mjs').then(n => n._),"/src/assets/escudos/rosenborg.png": () => import('../../chunks/rosenborg_DMtmFGyj.mjs').then(n => n._),"/src/assets/escudos/santa_teresa.png": () => import('../../chunks/santa_teresa_YiXANc6p.mjs').then(n => n._),"/src/assets/escudos/sd_eibar.png": () => import('../../chunks/sd_eibar_CQMP6f2o.mjs').then(n => n._),"/src/assets/escudos/sevilla_fc.png": () => import('../../chunks/sevilla_fc_BziGCddf.mjs').then(n => n._),"/src/assets/escudos/slavia_de_praga.png": () => import('../../chunks/slavia_de_praga_BTL9qurH.mjs').then(n => n._),"/src/assets/escudos/sparta_de_praga.png": () => import('../../chunks/sparta_de_praga_qJy8RejX.mjs').then(n => n._),"/src/assets/escudos/sporting_de_huelva.png": () => import('../../chunks/sporting_de_huelva_BtV1UTAN.mjs').then(n => n._),"/src/assets/escudos/sporting_de_portugal.png": () => import('../../chunks/sporting_de_portugal_DU3zDQV6.mjs').then(n => n._),"/src/assets/escudos/sturm_graz.png": () => import('../../chunks/sturm_graz_BV7ZVpKe.mjs').then(n => n._),"/src/assets/escudos/tigres_uanl.png": () => import('../../chunks/tigres_uanl_BfAAEV7W.mjs').then(n => n._),"/src/assets/escudos/twente.png": () => import('../../chunks/twente_CrfmLuq6.mjs').then(n => n._),"/src/assets/escudos/valencia_cf.png": () => import('../../chunks/valencia_cf_Ck6_p5_d.mjs').then(n => n._),"/src/assets/escudos/valerenga.png": () => import('../../chunks/valerenga_BRITrkxV.mjs').then(n => n._),"/src/assets/escudos/villarreal_cf.png": () => import('../../chunks/villarreal_cf_CJhFmI8f.mjs').then(n => n._),"/src/assets/escudos/vllaznia.png": () => import('../../chunks/vllaznia_DlKJ3sbr.mjs').then(n => n._),"/src/assets/escudos/wacker_innsbruck.png": () => import('../../chunks/wacker_innsbruck_CqMOxpVh.mjs').then(n => n._),"/src/assets/escudos/wolfsburgo.png": () => import('../../chunks/wolfsburgo_B5nuPHdh.mjs').then(n => n._)

});
    const fileSlug = rival.slug.replace(/-/g, "_");
    const imagePath = `/src/assets/escudos/${fileSlug}.png`;
    console.log("Trying to load shield:", imagePath);
    console.log("Available images:", Object.keys(images));
    if (images[imagePath]) {
      shieldImage = (await images[imagePath]()).default;
      console.log("Shield loaded successfully for", rival.nombre);
    } else {
      console.log(
        "Shield not found for",
        rival.nombre,
        "at path:",
        imagePath
      );
    }
  } catch (error) {
    console.error(`Error loading shield for ${rival.nombre}:`, error);
  }
  let flagImage;
  try {
    const flags = /* #__PURE__ */ Object.assign({"/src/assets/banderas/alemania.svg": () => import('../../chunks/alemania_BwexC0ei.mjs'),"/src/assets/banderas/australia.svg": () => import('../../chunks/australia_VpSuLwKi.mjs'),"/src/assets/banderas/austria.svg": () => import('../../chunks/austria_avJTJful.mjs'),"/src/assets/banderas/azerbaiyan.svg": () => import('../../chunks/azerbaiyan_BYvs3h3G.mjs'),"/src/assets/banderas/brasil.svg": () => import('../../chunks/brasil_UYRooQvg.mjs'),"/src/assets/banderas/colombia.svg": () => import('../../chunks/colombia_CMI8uVu4.mjs'),"/src/assets/banderas/dinamarca.svg": () => import('../../chunks/dinamarca_CwHXtM4S.mjs'),"/src/assets/banderas/escocia.svg": () => import('../../chunks/escocia_DZ6FTHuy.mjs'),"/src/assets/banderas/espana.svg": () => import('../../chunks/espana_CXM6K5Gb.mjs'),"/src/assets/banderas/francia.svg": () => import('../../chunks/francia_5Z-sSpSJ.mjs'),"/src/assets/banderas/inglaterra.svg": () => import('../../chunks/inglaterra_1RQbzEWT.mjs'),"/src/assets/banderas/islandia.svg": () => import('../../chunks/islandia_AJk3E9In.mjs'),"/src/assets/banderas/italia.svg": () => import('../../chunks/italia_B3bvGEt0.mjs'),"/src/assets/banderas/mexico.svg": () => import('../../chunks/mexico_C4bw5jAu.mjs'),"/src/assets/banderas/noruega.svg": () => import('../../chunks/noruega_B-lKfTt4.mjs'),"/src/assets/banderas/paises_bajos.svg": () => import('../../chunks/paises_bajos_CZgfOHr1.mjs'),"/src/assets/banderas/paraguay.svg": () => import('../../chunks/paraguay_D0lQxrjp.mjs'),"/src/assets/banderas/portugal.svg": () => import('../../chunks/portugal_BUF0W8UN.mjs'),"/src/assets/banderas/republica_checa.svg": () => import('../../chunks/republica_checa_DUnSRyKl.mjs'),"/src/assets/banderas/suecia.svg": () => import('../../chunks/suecia_D4Ppb6wZ.mjs'),"/src/assets/banderas/ucrania.svg": () => import('../../chunks/ucrania_JNemUslr.mjs')

});
    const flagSlug = rival.pais?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    const flagPath = `/src/assets/banderas/${flagSlug}.svg`;
    console.log("Trying to load flag:", flagPath);
    if (flags[flagPath]) {
      flagImage = (await flags[flagPath]()).default;
      console.log("Flag loaded successfully for", rival.pais);
    } else {
      console.log("Flag not found for", rival.pais, "at path:", flagPath);
    }
  } catch (error) {
    console.error(`Error loading flag for ${rival.pais}:`, error);
  }
  const rivalRecords = await fetchRivalRecords(rival.id_club);
  const topPlayersData = await fetchRivalTopPlayers(rival.id_club);
  const rivalMatches = await fetchRivalMatches(rival.id_club);
  const rivalStats = calculateRivalStats(rivalMatches);
  const competitionOrder = [
    "Liga F",
    "UWCL",
    "Copa de la Reina",
    "Supercopa de Espa\xF1a",
    "Amistosos"
  ];
  const uniqueCompetitions = [
    ...new Set(rivalMatches.map((m) => m.competicion))
  ].filter((c) => c && c !== "-");
  const competitions = uniqueCompetitions.sort((a, b) => {
    const indexA = competitionOrder.indexOf(a);
    const indexB = competitionOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  const circumference = 220;
  const totalMatches = rivalStats.total.pj;
  const winsArc = totalMatches > 0 ? Math.round(rivalStats.total.pg / totalMatches * circumference) : 0;
  const drawsArc = totalMatches > 0 ? Math.round(rivalStats.total.pe / totalMatches * circumference) : 0;
  const lossesArc = totalMatches > 0 ? Math.round(rivalStats.total.pp / totalMatches * circumference) : 0;
  const totalGoals = rivalStats.total.gf + rivalStats.total.gc;
  const goalsForArc = totalGoals > 0 ? Math.round(rivalStats.total.gf / totalGoals * circumference) : 0;
  const goalsAgainstArc = totalGoals > 0 ? Math.round(rivalStats.total.gc / totalGoals * circumference) : 0;
  const mockPlayers = [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${rival.nombre} - Rival | Madrid Femenino Xtra`, "description": `Historial completo del Real Madrid Femenino contra ${rival.nombre}. Estad\xEDsticas, goleadoras, asistentes y todos los partidos disputados.`, "data-astro-cid-ziuvzcy3": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="rival-details-page" data-astro-cid-ziuvzcy3> <a href="/rivales" class="back-link" data-astro-cid-ziuvzcy3> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" data-astro-cid-ziuvzcy3> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-astro-cid-ziuvzcy3></path> </svg>
Volver al resto de rivales
</a> <div class="rival-grid" data-astro-cid-ziuvzcy3> <div class="left-column" data-astro-cid-ziuvzcy3> <section class="rival-card" data-astro-cid-ziuvzcy3> <h2 class="section-header" data-astro-cid-ziuvzcy3>
FICHA DE RIVAL: ${rival.nombre} </h2> <div class="rival-info" data-astro-cid-ziuvzcy3> <div class="rival-shield" data-astro-cid-ziuvzcy3> ${shieldImage ? renderTemplate`<img${addAttribute(shieldImage.src, "src")}${addAttribute(`Escudo de ${rival.nombre}`, "alt")} data-astro-cid-ziuvzcy3>` : renderTemplate`<img${addAttribute(rival.shieldUrl, "src")}${addAttribute(`Escudo de ${rival.nombre}`, "alt")} onerror="this.onerror=null; this.src='/assets/escudos/placeholder.png';" data-astro-cid-ziuvzcy3>`} </div> <div class="rival-details" data-astro-cid-ziuvzcy3> <div class="info-row" data-astro-cid-ziuvzcy3> <span class="label" data-astro-cid-ziuvzcy3>Nombre:</span> <span class="value" data-astro-cid-ziuvzcy3>${rival.nombre}</span> </div> <div class="info-row" data-astro-cid-ziuvzcy3> <span class="label" data-astro-cid-ziuvzcy3>Ciudad:</span> <span class="value" data-astro-cid-ziuvzcy3>${rival.ciudad}</span> </div> <div class="info-row" data-astro-cid-ziuvzcy3> <span class="label" data-astro-cid-ziuvzcy3>País:</span> <span class="value" data-astro-cid-ziuvzcy3> ${rival.pais} ${flagImage && renderTemplate`<img${addAttribute(flagImage.src, "src")}${addAttribute(`Bandera de ${rival.pais}`, "alt")} class="country-flag" data-astro-cid-ziuvzcy3>`} </span> </div> <div class="info-row" data-astro-cid-ziuvzcy3> <span class="label" data-astro-cid-ziuvzcy3>Estadio:</span> <span class="value" data-astro-cid-ziuvzcy3>${rival.estadio}</span> </div> </div> </div> </section> <section class="players-card" data-astro-cid-ziuvzcy3> <h2 class="section-header" data-astro-cid-ziuvzcy3>
JUGADORAS DEL REAL MADRID QUE JUGARON EN EL ${rival.nombre} </h2> <div class="players-list" data-astro-cid-ziuvzcy3> <p data-astro-cid-ziuvzcy3>${mockPlayers.join(", ")}</p> </div> </section> <section class="charts-card" data-astro-cid-ziuvzcy3> <h2 class="section-header" data-astro-cid-ziuvzcy3>GRÁFICAS</h2> <div class="charts-content" data-astro-cid-ziuvzcy3> <div class="chart-controls" style="justify-content: center;" data-astro-cid-ziuvzcy3> <div class="control" data-astro-cid-ziuvzcy3> <label data-astro-cid-ziuvzcy3>COMPETICIÓN:</label> <select id="competition-filter" data-astro-cid-ziuvzcy3> <option value="all" data-astro-cid-ziuvzcy3>Todas</option> ${competitions.map((comp) => renderTemplate`<option${addAttribute(comp, "value")} data-astro-cid-ziuvzcy3>${comp}</option>`)} </select> </div> </div> <div class="charts-row" data-astro-cid-ziuvzcy3> <div class="chart-item" data-astro-cid-ziuvzcy3> <svg viewBox="0 0 100 100" class="pie-chart" id="results-chart" data-astro-cid-ziuvzcy3> <circle cx="50" cy="50" r="35" fill="none" stroke="#c8e6c9" stroke-width="20"${addAttribute(`${winsArc} ${circumference - winsArc}`, "stroke-dasharray")} transform="rotate(-90 50 50)" data-astro-cid-ziuvzcy3></circle> <circle cx="50" cy="50" r="35" fill="none" stroke="#fff9c4" stroke-width="20"${addAttribute(`${drawsArc} ${circumference - drawsArc}`, "stroke-dasharray")}${addAttribute(-winsArc, "stroke-dashoffset")} transform="rotate(-90 50 50)" data-astro-cid-ziuvzcy3></circle> <circle cx="50" cy="50" r="35" fill="none" stroke="#ffcdd2" stroke-width="20"${addAttribute(`${lossesArc} ${circumference - lossesArc}`, "stroke-dasharray")}${addAttribute(-(winsArc + drawsArc), "stroke-dashoffset")} transform="rotate(-90 50 50)" data-astro-cid-ziuvzcy3></circle> </svg> <div class="chart-legend" id="results-legend" data-astro-cid-ziuvzcy3> <div data-astro-cid-ziuvzcy3> <span class="dot green" data-astro-cid-ziuvzcy3></span> Ganados (${rivalStats.total.pg})
</div> <div data-astro-cid-ziuvzcy3> <span class="dot orange" data-astro-cid-ziuvzcy3></span> Empatados
                                        (${rivalStats.total.pe})
</div> <div data-astro-cid-ziuvzcy3> <span class="dot red" data-astro-cid-ziuvzcy3></span> Perdidos (${rivalStats.total.pp})
</div> </div> </div> <div class="chart-item" data-astro-cid-ziuvzcy3> <svg viewBox="0 0 100 100" class="pie-chart" id="goals-chart" data-astro-cid-ziuvzcy3> <circle cx="50" cy="50" r="35" fill="none" stroke="#c8e6c9" stroke-width="20"${addAttribute(`${goalsForArc} ${circumference - goalsForArc}`, "stroke-dasharray")} transform="rotate(-90 50 50)" data-astro-cid-ziuvzcy3></circle> <circle cx="50" cy="50" r="35" fill="none" stroke="#ffcdd2" stroke-width="20"${addAttribute(`${goalsAgainstArc} ${circumference - goalsAgainstArc}`, "stroke-dasharray")}${addAttribute(-goalsForArc, "stroke-dashoffset")} transform="rotate(-90 50 50)" data-astro-cid-ziuvzcy3></circle> </svg> <div class="chart-legend" id="goals-legend" data-astro-cid-ziuvzcy3> <div data-astro-cid-ziuvzcy3> <span class="dot green" data-astro-cid-ziuvzcy3></span> A favor (${rivalStats.total.gf})
</div> <div data-astro-cid-ziuvzcy3> <span class="dot red" data-astro-cid-ziuvzcy3></span> En contra (${rivalStats.total.gc})
</div> </div> </div> </div> </div> </section> <section class="stats-table-card" data-astro-cid-ziuvzcy3> <h3 class="section-subheader" data-astro-cid-ziuvzcy3>
ESTADÍSTICAS CONTRA EL ${rival.nombre} </h3> <div class="table-wrapper" data-astro-cid-ziuvzcy3> <table class="stats-table" data-astro-cid-ziuvzcy3> <thead data-astro-cid-ziuvzcy3> <tr data-astro-cid-ziuvzcy3> <th data-astro-cid-ziuvzcy3>JUGADOS COMO</th> <th data-astro-cid-ziuvzcy3>PJ</th> <th data-astro-cid-ziuvzcy3>PG</th> <th data-astro-cid-ziuvzcy3>%PG</th> <th data-astro-cid-ziuvzcy3>PE</th> <th data-astro-cid-ziuvzcy3>%PE</th> <th data-astro-cid-ziuvzcy3>PP</th> <th data-astro-cid-ziuvzcy3>%PP</th> <th class="highlight-yellow" data-astro-cid-ziuvzcy3>⚽</th> <th class="highlight-red" data-astro-cid-ziuvzcy3>⚽</th> <th class="highlight-blue" data-astro-cid-ziuvzcy3>📊</th> <th data-astro-cid-ziuvzcy3>Avg.</th> <th data-astro-cid-ziuvzcy3>Dif.</th> </tr> </thead> <tbody data-astro-cid-ziuvzcy3> <tr data-astro-cid-ziuvzcy3> <td data-astro-cid-ziuvzcy3>LOCAL</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.pj}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.pg}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.percPG}%</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.pe}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.percPE}%</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.pp}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.percPP}%</td> <td class="highlight-yellow" data-astro-cid-ziuvzcy3>${rivalStats.home.gf}</td> <td class="highlight-red" data-astro-cid-ziuvzcy3>${rivalStats.home.gc}</td> <td class="highlight-blue" data-astro-cid-ziuvzcy3>${rivalStats.home.dif > 0 ? "+" : ""}${rivalStats.home.dif}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.avg}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.home.dif}</td> </tr> <tr data-astro-cid-ziuvzcy3> <td data-astro-cid-ziuvzcy3>VISITANTE</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.pj}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.pg}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.percPG}%</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.pe}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.percPE}%</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.pp}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.percPP}%</td> <td class="highlight-yellow" data-astro-cid-ziuvzcy3>${rivalStats.away.gf}</td> <td class="highlight-red" data-astro-cid-ziuvzcy3>${rivalStats.away.gc}</td> <td class="highlight-blue" data-astro-cid-ziuvzcy3>${rivalStats.away.dif > 0 ? "+" : ""}${rivalStats.away.dif}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.avg}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.away.dif}</td> </tr> <tr class="total-row" data-astro-cid-ziuvzcy3> <td data-astro-cid-ziuvzcy3><strong data-astro-cid-ziuvzcy3>TOTAL</strong></td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.pj}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.pg}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.percPG}%</td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.pe}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.percPE}%</td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.pp}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.percPP}%</td> <td class="highlight-yellow" data-astro-cid-ziuvzcy3>${rivalStats.total.gf}</td> <td class="highlight-red" data-astro-cid-ziuvzcy3>${rivalStats.total.gc}</td> <td class="highlight-blue" data-astro-cid-ziuvzcy3>${rivalStats.total.dif > 0 ? "+" : ""}${rivalStats.total.dif}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.avg}</td> <td data-astro-cid-ziuvzcy3>${rivalStats.total.dif}</td> </tr> </tbody> </table> </div> </section> <section class="matches-card" data-astro-cid-ziuvzcy3> <h3 class="section-subheader" data-astro-cid-ziuvzcy3>
TODOS LOS PARTIDOS DISPUTADOS CONTRA EL ${rival.nombre} </h3> <div class="table-wrapper" data-astro-cid-ziuvzcy3> <table class="matches-table" data-astro-cid-ziuvzcy3> <thead data-astro-cid-ziuvzcy3> <tr data-astro-cid-ziuvzcy3> <th data-astro-cid-ziuvzcy3>Fecha</th> <th data-astro-cid-ziuvzcy3>Competición</th> <th data-astro-cid-ziuvzcy3>En</th> <th data-astro-cid-ziuvzcy3>Res.</th> <th data-astro-cid-ziuvzcy3>Árbitra</th> <th data-astro-cid-ziuvzcy3>Estadio</th> <th data-astro-cid-ziuvzcy3>Asist.</th> </tr> </thead> <tbody data-astro-cid-ziuvzcy3> ${rivalMatches.length > 0 ? rivalMatches.map((match) => {
    const golesRM = parseInt(match.golesRM) || 0;
    const golesRival = parseInt(match.golesRival) || 0;
    let resultClass = "";
    if (golesRM > golesRival) {
      resultClass = "resultado-victoria";
    } else if (golesRM === golesRival) {
      resultClass = "resultado-empate";
    } else {
      resultClass = "resultado-derrota";
    }
    return renderTemplate`<tr data-astro-cid-ziuvzcy3> <td data-astro-cid-ziuvzcy3> ${new Date(
      match.fecha
    ).toLocaleDateString(
      "es-ES"
    )} </td> <td data-astro-cid-ziuvzcy3>${match.competicion}</td> <td data-astro-cid-ziuvzcy3>${match.ubicacion}</td> <td${addAttribute(resultClass, "class")} data-astro-cid-ziuvzcy3> ${match.resultado} </td> <td data-astro-cid-ziuvzcy3>${match.arbitra}</td> <td data-astro-cid-ziuvzcy3>${match.estadio}</td> <td data-astro-cid-ziuvzcy3> ${match.asistencia || "-"} </td> </tr>`;
  }) : renderTemplate`<tr data-astro-cid-ziuvzcy3> <td colspan="7" style="text-align: center; padding: 2rem;" data-astro-cid-ziuvzcy3>
No hay partidos registrados
</td> </tr>`} </tbody> </table> </div> </section> </div> <div class="right-column" data-astro-cid-ziuvzcy3> <section class="stadium-card" data-astro-cid-ziuvzcy3> <h2 class="section-header" data-astro-cid-ziuvzcy3>ESTADIO</h2> <div class="stadium-content" data-astro-cid-ziuvzcy3> <div class="stadium-photo" data-astro-cid-ziuvzcy3> <div class="photo-placeholder" data-astro-cid-ziuvzcy3></div> </div> </div> </section> <section class="records-card" data-astro-cid-ziuvzcy3> <h2 class="section-header" data-astro-cid-ziuvzcy3>RÉCORDS</h2> <div class="records-list" data-astro-cid-ziuvzcy3> ${rivalRecords?.maximo_goleador && renderTemplate`<div class="record-row" data-astro-cid-ziuvzcy3> <span class="record-label" data-astro-cid-ziuvzcy3>
Máxima goleadora:
</span> <span class="record-value" data-astro-cid-ziuvzcy3> ${rivalRecords.maximo_goleador.nombre} -${" "} ${rivalRecords.maximo_goleador.goles} </span> </div>`} ${rivalRecords?.goleador_rival && renderTemplate`<div class="record-row" data-astro-cid-ziuvzcy3> <span class="record-label" data-astro-cid-ziuvzcy3>
Goleador rival:
</span> <span class="record-value" data-astro-cid-ziuvzcy3> ${rivalRecords.goleador_rival.nombre} -${" "} ${rivalRecords.goleador_rival.goles} </span> </div>`} ${rivalRecords?.mas_partidos && renderTemplate`<div class="record-row" data-astro-cid-ziuvzcy3> <span class="record-label" data-astro-cid-ziuvzcy3>
Jugadora con más partidos:
</span> <span class="record-value" data-astro-cid-ziuvzcy3> ${rivalRecords.mas_partidos.nombre} -${" "} ${rivalRecords.mas_partidos.partidos} </span> </div>`} ${rivalRecords?.mayor_victoria && renderTemplate`<div class="record-row" data-astro-cid-ziuvzcy3> <span class="record-label" data-astro-cid-ziuvzcy3>
Mayor victoria:
</span> <span class="record-value" data-astro-cid-ziuvzcy3> ${rivalRecords.mayor_victoria.resultado} </span> </div>`} ${rivalRecords?.mayor_derrota && renderTemplate`<div class="record-row" data-astro-cid-ziuvzcy3> <span class="record-label" data-astro-cid-ziuvzcy3>
Mayor derrota:
</span> <span class="record-value" data-astro-cid-ziuvzcy3> ${rivalRecords.mayor_derrota.resultado} </span> </div>`} ${rivalRecords?.mas_repetido && renderTemplate`<div class="record-row" data-astro-cid-ziuvzcy3> <span class="record-label" data-astro-cid-ziuvzcy3>
Más repetido:
</span> <span class="record-value" data-astro-cid-ziuvzcy3> ${rivalRecords.mas_repetido.resultado} -${" "} ${rivalRecords.mas_repetido.veces} veces
</span> </div>`} </div> </section> <section class="top-scorers-card" data-astro-cid-ziuvzcy3> <h2 class="section-header" data-astro-cid-ziuvzcy3>MÁXIMAS GOLEADORAS</h2> <div class="top-list" data-astro-cid-ziuvzcy3> ${topPlayersData.topScorers.length > 0 ? topPlayersData.topScorers.map(
    (player, index) => renderTemplate`<div class="top-item" data-astro-cid-ziuvzcy3> <span class="position" data-astro-cid-ziuvzcy3> ${index + 1}.
</span> <span class="player-name" data-astro-cid-ziuvzcy3> ${player.nombre} </span> <span class="stat-value" data-astro-cid-ziuvzcy3> ${player.goles}${" "} ${player.goles === 1 ? "gol" : "goles"} </span> </div>`
  ) : renderTemplate`<p class="no-data" data-astro-cid-ziuvzcy3>Sin datos disponibles</p>`} </div> </section> <section class="top-assisters-card" data-astro-cid-ziuvzcy3> <h2 class="section-header" data-astro-cid-ziuvzcy3>MÁS ASISTENTES</h2> <div class="top-list" data-astro-cid-ziuvzcy3> ${topPlayersData.topAssisters.length > 0 ? topPlayersData.topAssisters.map(
    (player, index) => renderTemplate`<div class="top-item" data-astro-cid-ziuvzcy3> <span class="position" data-astro-cid-ziuvzcy3> ${index + 1}.
</span> <span class="player-name" data-astro-cid-ziuvzcy3> ${player.nombre} </span> <span class="stat-value" data-astro-cid-ziuvzcy3> ${player.asistencias}${" "} ${player.asistencias === 1 ? "asistencia" : "asistencias"} </span> </div>`
  ) : renderTemplate`<p class="no-data" data-astro-cid-ziuvzcy3>Sin datos disponibles</p>`} </div> </section> <section class="top-contributors-card" data-astro-cid-ziuvzcy3> <h2 class="section-header" data-astro-cid-ziuvzcy3>MÁS GOLES GENERADOS (G+A)</h2> <div class="top-list" data-astro-cid-ziuvzcy3> ${topPlayersData.topContributors.length > 0 ? topPlayersData.topContributors.map(
    (player, index) => renderTemplate`<div class="top-item" data-astro-cid-ziuvzcy3> <span class="position" data-astro-cid-ziuvzcy3> ${index + 1}.
</span> <span class="player-name" data-astro-cid-ziuvzcy3> ${player.nombre} </span> <span class="stat-value" data-astro-cid-ziuvzcy3> ${player.total} (${player.goles}G
                                                + ${player.asistencias}A)
</span> </div>`
  ) : renderTemplate`<p class="no-data" data-astro-cid-ziuvzcy3>Sin datos disponibles</p>`} </div> </section> </div> </div> </main>  ` })}`;
}, "C:/Users/PC/madridfemeninoxtra/src/pages/rivales/[slug].astro", void 0);

const $$file = "C:/Users/PC/madridfemeninoxtra/src/pages/rivales/[slug].astro";
const $$url = "/rivales/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$slug,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
