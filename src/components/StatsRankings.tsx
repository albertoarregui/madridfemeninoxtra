import React, { useState, useMemo, useEffect } from "react";
import { Target, Zap, Clock, Shield, Award, Crown, TrendingUp, Activity, Star as LucideStar, ChevronLeft, ChevronRight } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface RankingStat {
    id_jugadora: number;
    nombre: string;
    slug: string;
    posicion: string;
    temporada: string;
    competicion: string;
    goles?: number;
    asistencias?: number;
    goles_generados?: number;
    goles_victoria?: number;
    goles_empate?: number;
    goles_abrelatas?: number;
    penaltis?: number;
    partidos?: number;
    minutos?: number;
    titularidades?: number;
    convocatorias?: number;
    cambio_entrada?: number;
    cambio_salida?: number;
    victorias?: number;
    porterias_cero?: number;
    tarjetas_amarillas?: number;
    tarjetas_rojas?: number;
    capitanias?: number;
    pases_clave?: number;
    tiros_totales?: number;
    tiros_puerta?: number;
    toques?: number;
    toques_area_rival?: number;
    pases_completados?: number;
    pases_totales?: number;
    pases_ultimo_tercio_completados?: number;
    pases_largo_completados?: number;
    centros_completados?: number;
    regates_completados?: number;
    regates_totales?: number;
    duelos_suelo_ganados?: number;
    duelos_aereos_ganados?: number;
    recuperaciones?: number;
    intercepciones?: number;
    despejes?: number;
    bloqueos?: number;
    entradas?: number;
    valoracion?: number;
    valoracion_count?: number;
    perdidas?: number;
    fueras_juego?: number;
    regateada?: number;
    faltas_recibidas?: number;
    faltas_cometidas?: number;
    pases_largo_totales?: number;
    centros_totales?: number;
    duelos_suelo_totales?: number;
    duelos_aereos_totales?: number;
    pases_ultimo_tercio_totales?: number;
    img_url?: string;
    [key: string]: any;
}

interface StreakData {
    id_jugadora: number;
    nombre: string;
    slug: string;
    temporada: string;
    competicion: string;
    streak_scoring?: number;
    streak_assisting?: number;
    streak_ga?: number;
    streak_clean_sheet?: number;
}

interface AwardData {
    id_jugadora: number;
    nombre: string;
    slug: string;
    tipo: string;
    temporada: string;
    mes?: string;
}

interface StatsRankingsProps {
    rankingsData: RankingStat[];
    streaksData: StreakData[];
    awardsData: AwardData[];
    seasons: string[];
    competitions: string[];
    playerImageMap: Record<string, string>;
}

const TYPE_OPTIONS = [
    { value: "convocatorias", label: "Más convocatorias" },
    { value: "partidos", label: "Más partidos jugados" },
    { value: "minutos", label: "Más minutos jugados" },
    { value: "titularidades", label: "Más titularidades" },
    { value: "cambios_entrada", label: "Más cambios (Entrada)" },
    { value: "cambios_salida", label: "Más cambios (Salida)" },
    { value: "victorias", label: "Más victorias" },
    { value: "capitanias", label: "Más capitanías" },
    { value: "tarjetas_amarillas", label: "Más amarillas" },
    { value: "tarjetas_rojas", label: "Más rojas" },
    { value: "goles", label: "Máximas goleadoras" },
    { value: "asistencias", label: "Máximas asistentes" },
    { value: "goles_generados", label: "Más goles generados" },
    { value: "porterias_cero", label: "Más porterías a cero" },
    { value: "goles_victoria", label: "Más match winners" },
    { value: "goles_empate", label: "Más goles para empatar" },
    { value: "goles_abrelatas", label: "Más goles para abrir el marcador" },
    { value: "streak_scoring", label: "Mayor racha marcando" },
    { value: "streak_assisting", label: "Mayor racha asistiendo" },
    { value: "streak_ga", label: "Mayor racha con gol o asistencia" },
    { value: "streak_clean_sheet", label: "Mayor racha de portería a cero" },
    { value: "award_monthly", label: "Más veces Jugadora del Mes" },
    { value: "award_season", label: "Mejor Jugadora de la Temporada" },
    { value: "valoracion", label: "Mejor valoración media" },
    { value: "tiros_totales", label: "Más tiros totales" },
    { value: "tiros_puerta", label: "Más tiros a puerta" },
    { value: "toques", label: "Más toques de balón" },
    { value: "toques_area_rival", label: "Más toques en área rival" },
    { value: "pases_completados", label: "Más pases completados" },
    { value: "porcentaje_pases", label: "% Pases completados" },
    { value: "pases_clave", label: "Más pases clave" },
    { value: "pases_ultimo_tercio", label: "Más pases al último tercio" },
    { value: "pases_largo_completados", label: "Más pases en largo completados" },
    { value: "porcentaje_pases_largo", label: "% Pases en largo" },
    { value: "regates_completados", label: "Más regates completados" },
    { value: "centros_completados", label: "Más centros completados" },
    { value: "porcentaje_centros", label: "% Centros completados" },
    { value: "porcentaje_regates", label: "% Regates con éxito" },
    { value: "duelos_suelo_ganados", label: "Más duelos en el suelo ganados" },
    { value: "duelos_aereos_ganados", label: "Más duelos aéreos ganados" },
    { value: "porcentaje_duelos", label: "% Duelos ganados" },
    { value: "porcentaje_duelos_aereos", label: "% Duelos aéreos ganados" },
    { value: "entradas", label: "Más entradas" },
    { value: "intercepciones", label: "Más intercepciones" },
    { value: "despejes", label: "Más despejes" },
    { value: "bloqueos", label: "Más bloqueos" },
    { value: "recuperaciones", label: "Más recuperaciones" },
    { value: "faltas_recibidas", label: "Más faltas recibidas" },
    { value: "faltas_cometidas", label: "Más faltas cometidas" },
    { value: "perdidas", label: "Más pérdidas de balón" },
    { value: "fueras_juego", label: "Más fueras de juego" },
    { value: "regateada", label: "Más veces regateada" },
];

const MainStarIcon = ({ className, color }: { className?: string, color: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M17.8 19.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138" />
        <path d="M6.2 19.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138" />
        <path d="M12 9.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138" />
    </svg>
);

const SpotStarIcon = ({ className, color }: { className?: string, color: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" />
    </svg>
);

export default function StatsRankings({
    rankingsData,
    streaksData,
    awardsData,
    seasons,
    competitions,
    playerImageMap
}: StatsRankingsProps) {
    const [selectedType, setSelectedType] = useState("goles");
    const [selectedSeason, setSelectedSeason] = useState("todos");
    const [selectedCompetition, setSelectedCompetition] = useState("oficiales");
    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 25;

    const currentConfig = useMemo(() => {
        const configs: Record<string, any> = {
            valoracion: { title: "Mejor valoración media", headers: ["Pos", "Jugadora", "Nota Media"], dataKeys: ["valoracion"], primaryKey: "valoracion", icon: <LucideStar className="text-yellow-500" /> },
            goles: { title: "Máximas goleadoras", headers: ["Pos", "Jugadora", "Goles"], dataKeys: ["goles"], primaryKey: "goles", icon: <Target className="text-red-500" /> },
            asistencias: { title: "Máximas asistentes", headers: ["Pos", "Jugadora", "Asistencias"], dataKeys: ["asistencias"], primaryKey: "asistencias", icon: <Zap className="text-yellow-500" /> },
            goles_generados: { title: "Participación en Goles", headers: ["Pos", "Jugadora", "Goles", "Asist.", "G+A"], dataKeys: ["goles", "asistencias", "goles_generados"], primaryKey: "goles_generados", icon: <TrendingUp className="text-green-500" /> },
            pases_clave: { title: "Más pases clave", headers: ["Pos", "Jugadora", "P. Clave"], dataKeys: ["pases_clave"], primaryKey: "pases_clave", icon: <Zap className="text-blue-400" /> },
            tiros_totales: { title: "Máximos remates", headers: ["Pos", "Jugadora", "Remates"], dataKeys: ["tiros_totales"], primaryKey: "tiros_totales", icon: <Target className="text-red-400" /> },
            tiros_puerta: { title: "Remates a puerta", headers: ["Pos", "Jugadora", "A Puerta"], dataKeys: ["tiros_puerta"], primaryKey: "tiros_puerta", icon: <Target className="text-red-600" /> },
            regates_completados: { title: "Más regates completados", headers: ["Pos", "Jugadora", "Regates"], dataKeys: ["regates_completados"], primaryKey: "regates_completados", icon: <Zap className="text-yellow-400" /> },
            porcentaje_regates: { title: "% Éxito en Regates", headers: ["Pos", "Jugadora", "Comp./Tot.", "%"], dataKeys: ["display_ratio", "porcentaje_regates"], primaryKey: "porcentaje_regates", icon: <Zap className="text-yellow-600" /> },
            toques: { title: "Más toques de balón", headers: ["Pos", "Jugadora", "Toques"], dataKeys: ["toques"], primaryKey: "toques", icon: <Activity className="text-blue-400" /> },
            toques_area_rival: { title: "Toques en área rival", headers: ["Pos", "Jugadora", "Toques"], dataKeys: ["toques_area_rival"], primaryKey: "toques_area_rival", icon: <TrendingUp className="text-emerald-500" /> },
            perdidas: { title: "Más pérdidas de posesión", headers: ["Pos", "Jugadora", "Pérdidas"], dataKeys: ["perdidas"], primaryKey: "perdidas", icon: <Activity className="text-red-500" /> },
            fueras_juego: { title: "Más fueras de juego", headers: ["Pos", "Jugadora", "F. Juego"], dataKeys: ["fueras_juego"], primaryKey: "fueras_juego", icon: <Activity className="text-gray-400" /> },
            pases_completados: { title: "Más pases completados", headers: ["Pos", "Jugadora", "Pases"], dataKeys: ["pases_completados"], primaryKey: "pases_completados", icon: <TrendingUp className="text-blue-500" /> },
            porcentaje_pases: { title: "% Pases completados", headers: ["Pos", "Jugadora", "Comp./Tot.", "%"], dataKeys: ["display_ratio", "porcentaje_pases"], primaryKey: "porcentaje_pases", icon: <TrendingUp className="text-blue-300" /> },
            pases_ultimo_tercio: { title: "Pases al último tercio", headers: ["Pos", "Jugadora", "Pases"], dataKeys: ["pases_ultimo_tercio_completados"], primaryKey: "pases_ultimo_tercio_completados", icon: <Zap className="text-indigo-400" /> },
            pases_largo_completados: { title: "Pases en largo completados", headers: ["Pos", "Jugadora", "Pases"], dataKeys: ["pases_largo_completados"], primaryKey: "pases_largo_completados", icon: <TrendingUp className="text-purple-400" /> },
            porcentaje_pases_largo: { title: "% Pases en largo", headers: ["Pos", "Jugadora", "Comp./Tot.", "%"], dataKeys: ["display_ratio", "porcentaje_pases_largo"], primaryKey: "porcentaje_pases_largo", icon: <TrendingUp className="text-purple-300" /> },
            centros_completados: { title: "Centros completados", headers: ["Pos", "Jugadora", "Centros"], dataKeys: ["centros_completados"], primaryKey: "centros_completados", icon: <Zap className="text-rose-400" /> },
            porcentaje_centros: { title: "% Centros completados", headers: ["Pos", "Jugadora", "Comp./Tot.", "%"], dataKeys: ["display_ratio", "porcentaje_centros"], primaryKey: "porcentaje_centros", icon: <Zap className="text-rose-300" /> },
            bloqueos: { title: "Más bloqueos", headers: ["Pos", "Jugadora", "Bloqueos"], dataKeys: ["bloqueos"], primaryKey: "bloqueos", icon: <Shield className="text-gray-600" /> },
            recuperaciones: { title: "Más recuperaciones", headers: ["Pos", "Jugadora", "Recuperac."], dataKeys: ["recuperaciones"], primaryKey: "recuperaciones", icon: <Shield className="text-blue-600" /> },
            intercepciones: { title: "Más intercepciones", headers: ["Pos", "Jugadora", "Intercep."], dataKeys: ["intercepciones"], primaryKey: "intercepciones", icon: <Shield className="text-indigo-600" /> },
            regateada: { title: "Más veces regateada", headers: ["Pos", "Jugadora", "Regateada"], dataKeys: ["regateada"], primaryKey: "regateada", icon: <Activity className="text-orange-500" /> },
            porcentaje_duelos: { title: "% Duelos ganados", headers: ["Pos", "Jugadora", "G/T", "%"], dataKeys: ["display_ratio", "porcentaje_duelos"], primaryKey: "porcentaje_duelos", icon: <Shield className="text-indigo-400" /> },
            porcentaje_duelos_aereos: { title: "% Duelos aéreos ganados", headers: ["Pos", "Jugadora", "G/T", "%"], dataKeys: ["display_ratio", "porcentaje_duelos_aereos"], primaryKey: "porcentaje_duelos_aereos", icon: <LucideStar className="text-sky-300" /> },
            faltas_recibidas: { title: "Más faltas recibidas", headers: ["Pos", "Jugadora", "Faltas"], dataKeys: ["faltas_recibidas"], primaryKey: "faltas_recibidas", icon: <LucideStar className="text-yellow-400" /> },
            faltas_cometidas: { title: "Más faltas cometidas", headers: ["Pos", "Jugadora", "Faltas"], dataKeys: ["faltas_cometidas"], primaryKey: "faltas_cometidas", icon: <Activity className="text-red-400" /> },
            entradas: { title: "Más entradas realizadas", headers: ["Pos", "Jugadora", "Entradas"], dataKeys: ["entradas"], primaryKey: "entradas", icon: <Activity className="text-blue-500" /> },
            despejes: { title: "Más despejes", headers: ["Pos", "Jugadora", "Despejes"], dataKeys: ["despejes"], primaryKey: "despejes", icon: <Shield className="text-emerald-600" /> },
            duelos_suelo_ganados: { title: "Duelos en suelo ganados", headers: ["Pos", "Jugadora", "Duelos S."], dataKeys: ["duelos_suelo_ganados"], primaryKey: "duelos_suelo_ganados", icon: <Activity className="text-orange-600" /> },
            duelos_aereos_ganados: { title: "Duelos aéreos ganados", headers: ["Pos", "Jugadora", "Duelos A."], dataKeys: ["duelos_aereos_ganados"], primaryKey: "duelos_aereos_ganados", icon: <LucideStar className="text-sky-500" /> },
            partidos: { title: "Más partidos jugados", headers: ["Pos", "Jugadora", "Partidos"], dataKeys: ["partidos"], primaryKey: "partidos", icon: <LucideStar className="text-blue-500" /> },
            minutos: { title: "Más minutos jugados", headers: ["Pos", "Jugadora", "Minutos"], dataKeys: ["minutos"], primaryKey: "minutos", icon: <Clock className="text-indigo-500" /> },
            porterias_cero: { title: "Más porterías a cero", headers: ["Pos", "Jugadora", "P. Cero"], dataKeys: ["porterias_cero"], primaryKey: "porterias_cero", icon: <Shield className="text-green-600" /> },
            goles_victoria: { title: "Match winners", headers: ["Pos", "Jugadora", "G. Victoria"], dataKeys: ["goles_victoria"], primaryKey: "goles_victoria", icon: <Award className="text-yellow-600" /> },
            streak_scoring: { title: "Racha de partidos marcando", headers: ["Pos", "Jugadora", "Partidos"], dataKeys: ["streak_scoring"], primaryKey: "streak_scoring", isStreak: true, icon: <Zap className="text-orange-500" /> },
            streak_assisting: { title: "Mayor racha asistiendo", headers: ["Pos", "Jugadora", "Partidos"], dataKeys: ["streak_assisting"], primaryKey: "streak_assisting", isStreak: true, icon: <Zap className="text-yellow-500" /> },
            streak_ga: { title: "Mayor racha con gol o asistencia", headers: ["Pos", "Jugadora", "Partidos"], dataKeys: ["streak_ga"], primaryKey: "streak_ga", isStreak: true, icon: <Zap className="text-green-500" /> },
            streak_clean_sheet: { title: "Mayor racha de portería a cero", headers: ["Pos", "Jugadora", "Partidos"], dataKeys: ["streak_clean_sheet"], primaryKey: "streak_clean_sheet", isStreak: true, icon: <Shield className="text-blue-500" /> },
            award_monthly: { title: "MVP del Mes", headers: ["Pos", "Jugadora", "Premios"], dataKeys: ["award_count"], primaryKey: "award_count", isAward: true, awardType: "mes", icon: <Award className="text-purple-500" /> },
            award_season: { title: "MVP de la Temporada", headers: ["Pos", "Jugadora", "Premios"], dataKeys: ["award_count"], primaryKey: "award_count", isAward: true, awardType: "temporada", icon: <Crown className="text-yellow-600" /> },
        };

        const typeOpt = TYPE_OPTIONS.find(o => o.value === selectedType);
        return configs[selectedType] || {
            title: typeOpt?.label || "Ranking",
            headers: ["Pos", "Jugadora", "Valor"],
            dataKeys: [selectedType.replace('cambios_', 'cambio_')],
            primaryKey: selectedType.replace('cambios_', 'cambio_'),
            icon: <Activity className="text-gray-500" />
        };
    }, [selectedType]);

    const isDefenderOrGK = (pos: string) => {
        if (!pos) return false;
        const p = pos.toLowerCase();
        return p.includes("portera") || p.includes("defensa") || p.includes("central") || p.includes("lateral");
    };

    const sortedPlayers = useMemo(() => {
        const config = currentConfig;
        let players: any[] = [];

        if (config.isStreak) {
            players = streaksData.filter(item => {
                const matchSeason = selectedSeason === "todos" ? (item.temporada === "all" || item.temporada === "todos") : item.temporada === selectedSeason;
                let matchComp = false;
                if (selectedCompetition === "todos" || selectedCompetition === "oficiales") {
                    matchComp = item.competicion === "all" || item.competicion === "todos";
                } else {
                    matchComp = item.competicion === selectedCompetition;
                }
                return matchSeason && matchComp;
            }).map(p => ({ ...p, [config.primaryKey]: p[config.primaryKey as keyof StreakData] }));
        } else if (config.isAward) {
            const playerMap: Record<number, any> = {};
            awardsData.forEach(award => {
                const tipo = (award.tipo || "").toUpperCase();
                if (selectedType === "award_monthly") {
                    if (!tipo.includes("MES") && !tipo.includes("MENSUAL")) return;
                } else {
                    if (!tipo.includes("TEMPORADA") && !tipo.includes("SEASON") && !tipo.includes("AÑO")) return;
                }

                const matchSeason = selectedSeason === "todos" || award.temporada === selectedSeason;
                if (!matchSeason) return;

                if (!playerMap[award.id_jugadora]) {
                    playerMap[award.id_jugadora] = { id_jugadora: award.id_jugadora, nombre: award.nombre, slug: award.slug, award_count: 0 };
                }
                playerMap[award.id_jugadora].award_count++;
            });
            players = Object.values(playerMap);
        } else {
            const playerMap: Record<number, any> = {};
            rankingsData.forEach(item => {
                const matchSeason = selectedSeason === "todos" || item.temporada === selectedSeason;
                if (!matchSeason) return;

                if (selectedCompetition === "oficiales") {
                    const officialComps = ["Liga F", "UWCL", "Copa de la Reina", "Supercopa de España"];
                    if (!officialComps.includes(item.competicion)) return;
                } else if (selectedCompetition !== "todos" && item.competicion !== selectedCompetition) {
                    return;
                }

                if (selectedType === "porterias_cero" && !isDefenderOrGK(item.posicion)) return;

                if (!playerMap[item.id_jugadora]) {
                    playerMap[item.id_jugadora] = {
                        id_jugadora: item.id_jugadora,
                        nombre: item.nombre,
                        slug: item.slug,
                        posicion: item.posicion,
                        pases_completados: 0, pases_totales: 0,
                        regates_completados: 0, regates_totales: 0,
                        pases_largo_completados: 0, pases_largo_totales: 0,
                        centros_completados: 0, centros_totales: 0,
                        duelos_suelo_ganados: 0, duelos_suelo_totales: 0,
                        duelos_aereos_ganados: 0, duelos_aereos_totales: 0,
                        valoracion_sum: 0, valoracion_count: 0,
                        ...Object.fromEntries(config.dataKeys.filter((k: string) => k !== 'display_ratio' && !k.startsWith('porcentaje_')).map((k: string) => [k, 0]))
                    };
                }

                const p = playerMap[item.id_jugadora];
                p.pases_completados += item.pases_completados || 0;
                p.pases_totales += item.pases_totales || 0;
                p.regates_completados += item.regates_completados || 0;
                p.regates_totales += item.regates_totales || 0;
                p.pases_largo_completados += item.pases_largo_completados || 0;
                p.pases_largo_totales += item.pases_largo_totales || 0;
                p.centros_completados += item.centros_completados || 0;
                p.centros_totales += item.centros_totales || 0;
                p.duelos_suelo_ganados += item.duelos_suelo_ganados || 0;
                p.duelos_suelo_totales += item.duelos_suelo_totales || 0;
                p.duelos_aereos_ganados += item.duelos_aereos_ganados || 0;
                p.duelos_aereos_totales += item.duelos_aereos_totales || 0;
                p.valoracion_sum += item.valoracion || 0;
                p.valoracion_count += (item as any).valoracion_count || 0;

                config.dataKeys.forEach((key: string) => {
                    if (key !== 'display_ratio' && !key.startsWith('porcentaje_')) {
                        p[key] += (item as any)[key] || 0;
                    }
                });
            });

            players = Object.values(playerMap).map(p => {
                const calcPct = (num: number, den: number) => den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0;
                const calcRatio = (num: number, den: number) => `${num}/${den}`;

                if (selectedType === "porcentaje_pases") {
                    p.porcentaje_pases = calcPct(p.pases_completados, p.pases_totales);
                    p.display_ratio = calcRatio(p.pases_completados, p.pases_totales);
                } else if (selectedType === "porcentaje_regates") {
                    p.porcentaje_regates = calcPct(p.regates_completados, p.regates_totales);
                    p.display_ratio = calcRatio(p.regates_completados, p.regates_totales);
                } else if (selectedType === "porcentaje_centros") {
                    p.porcentaje_centros = calcPct(p.centros_completados, p.centros_totales);
                    p.display_ratio = calcRatio(p.centros_completados, p.centros_totales);
                } else if (selectedType === "porcentaje_pases_largo") {
                    p.porcentaje_pases_largo = calcPct(p.pases_largo_completados, p.pases_largo_totales);
                    p.display_ratio = calcRatio(p.pases_largo_completados, p.pases_largo_totales);
                } else if (selectedType === "porcentaje_duelos") {
                    const totalG = (p.duelos_suelo_ganados || 0) + (p.duelos_aereos_ganados || 0);
                    const totalT = (p.duelos_suelo_totales || 0) + (p.duelos_aereos_totales || 0);
                    p.porcentaje_duelos = calcPct(totalG, totalT);
                    p.display_ratio = calcRatio(totalG, totalT);
                } else if (selectedType === "porcentaje_duelos_aereos") {
                    p.porcentaje_duelos_aereos = calcPct(p.duelos_aereos_ganados, p.duelos_aereos_totales);
                    p.display_ratio = calcRatio(p.duelos_aereos_ganados, p.duelos_aereos_totales);
                } else if (selectedType === "valoracion") {
                    p.valoracion = p.valoracion_count > 0 ? parseFloat((p.valoracion_sum / p.valoracion_count).toFixed(2)) : 0;
                } else if (selectedType === "goles_generados") {
                    p.goles_generados = (p.goles || 0) + (p.asistencias || 0);
                }
                return p;
            });
        }

        return players
            .filter(p => Number(p[config.primaryKey]) > 0)
            .sort((a, b) => Number(b[config.primaryKey]) - Number(a[config.primaryKey]));
    }, [rankingsData, streaksData, awardsData, selectedType, selectedSeason, selectedCompetition, currentConfig]);

    const itemsForTable = useMemo(() => sortedPlayers.slice(3), [sortedPlayers]);
    const totalPages = Math.ceil(itemsForTable.length / playersPerPage);
    const paginatedPlayers = itemsForTable.slice((currentPage - 1) * playersPerPage, currentPage * playersPerPage);

    const podium = useMemo(() => sortedPlayers.slice(0, 3), [sortedPlayers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedType, selectedSeason, selectedCompetition]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const tableElement = document.getElementById("ranking-table-top");
        if (tableElement) tableElement.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="stats-rankings-react py-8">
            <style dangerouslySetInnerHTML={{
                __html: `
                .stats-rankings-react { width: 100%; max-width: 1280px; margin: 0 auto; }
                .podium-container { min-height: 520px; gap: 15px; margin-bottom: 2rem; }
                .podium-spot { flex: 1; max-width: 340px; transition: all 0.4s ease; }
                .spot-1:hover .podium-img-wrapper { 
                    border-color: #FFD700 !important; 
                    box-shadow: 0 15px 40px rgba(255, 215, 0, 0.4);
                }
                .spot-2:hover .podium-img-wrapper { 
                    border-color: #C0C0C0 !important; 
                    box-shadow: 0 15px 40px rgba(192, 192, 192, 0.4);
                }
                .spot-3:hover .podium-img-wrapper { 
                    border-color: #CD7F32 !important; 
                    box-shadow: 0 15px 40px rgba(205, 127, 50, 0.4);
                }
                .podium-base { width: 100%; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding-top: 2rem; }
                .spot-1 { order: 2; height: 100%; }
                .spot-2 { order: 1; height: 85%; }
                .spot-3 { order: 3; height: 75%; }
                .podium-img-wrapper { border-radius: 50%; border: 6px solid white; box-shadow: 0 10px 25px rgba(0,0,0,0.15); overflow: hidden; background: #f3f4f6; }
                .spot-1 .podium-img-wrapper { width: 190px; height: 190px; border-color: #FFD700; transform: scale(1.1); }
                .spot-2 .podium-img-wrapper { width: 160px; height: 160px; border-color: #C0C0C0; }
                .spot-3 .podium-img-wrapper { width: 140px; height: 140px; border-color: #CD7F32; }
                .ranking-table-row:hover { background-color: rgba(255, 222, 89, 0.15) !important; cursor: pointer; }
                .ranking-title-header { 
                    padding: 2.5rem 1.5rem;
                    text-align: left;
                }
                .ranking-title-header h2 {
                    font-size: 2.2rem;
                    font-family: 'Bebas Neue', sans-serif;
                    text-transform: uppercase;
                    line-height: 1;
                    color: #2b2b2b;
                    margin: 0;
                    padding-left: 1.5rem;
                    font-weight: 800;
                    border-left: 6.5px solid #ffde59;
                    display: inline-block;
                }
                
                @media (max-width: 768px) {
                    .podium-container { flex-direction: column; align-items: center; min-height: auto; gap: 40px; margin-bottom: 60px; padding: 0 20px; }
                    .podium-spot { width: 100%; max-width: 100%; }
                    .spot-1 { order: 1; }
                    .spot-2 { order: 2; }
                    .spot-3 { order: 3; }
                    .podium-base { height: auto !important; padding: 25px 0; border-radius: 12px; }
                    .ranking-title-header h2 { font-size: 1.6rem; }
                    .spot-1 .podium-img-wrapper { width: 170px; height: 170px; }
                    .spot-2 .podium-img-wrapper { width: 140px; height: 140px; }
                    .spot-3 .podium-img-wrapper { width: 120px; height: 120px; }
                }
                .podium-stat-value { margin-bottom: 2rem; }
                ` }} />

            <div className="flex flex-wrap justify-center gap-4 mb-16 items-center relative z-[1001] filters-container">
                <CustomSelect options={TYPE_OPTIONS} value={selectedType} onChange={setSelectedType} id="filtro-tipo" />
                <CustomSelect options={[{ value: "todos", label: "Todas las Temporadas" }, ...seasons.map(s => ({ value: s, label: s }))]} value={selectedSeason} onChange={setSelectedSeason} id="filtro-temporada" />
                {!currentConfig.isAward && (
                    <CustomSelect options={[{ value: "todos", label: "Todas las Competiciones" }, { value: "oficiales", label: "Partidos Oficiales" }, ...competitions.map(c => ({ value: c, label: c }))]} value={selectedCompetition} onChange={setSelectedCompetition} id="filtro-competicion" />
                )}
            </div>

            {sortedPlayers.length > 0 ? (
                <>
                    <div className="podium-container flex items-end justify-center px-4">
                        {podium[1] && (
                            <div className="podium-spot spot-2 flex flex-col justify-end">
                                <div className="flex flex-col items-center mb-4">
                                    <div className="podium-img-wrapper">
                                        <a href={`/jugadoras/${podium[1].slug}`}>
                                            <img src={playerImageMap[podium[1].slug] || "/assets/jugadoras/placeholder.png"} alt={podium[1].nombre} className="w-full h-full object-cover object-top" />
                                        </a>
                                    </div>
                                    <div className="text-center mt-4 podium-stat-value">
                                        <h3 className="font-bold text-[#151e42] text-lg leading-tight truncate px-2 mb-1">
                                            <a href={`/jugadoras/${podium[1].slug}`} className="hover:text-[#C0C0C0] transition-colors">{podium[1].nombre}</a>
                                        </h3>
                                        <p className="text-3xl font-black text-gray-500">{podium[1][currentConfig.primaryKey]}</p>
                                    </div>
                                </div>
                                <div className="podium-base bg-gray-100 h-40 shadow-inner">
                                    <SpotStarIcon color="#C0C0C0" />
                                    <span className="text-gray-400 font-bold text-4xl mt-3">2</span>
                                </div>
                            </div>
                        )}

                        {podium[0] && (
                            <div className="podium-spot spot-1 flex flex-col justify-end">
                                <div className="flex flex-col items-center mb-4 z-10">
                                    <div className="mb-2"><Crown className="text-yellow-400 animate-bounce" size={32} /></div>
                                    <div className="podium-img-wrapper ring-4 ring-yellow-400 ring-offset-4 ring-offset-white">
                                        <a href={`/jugadoras/${podium[0].slug}`}>
                                            <img src={playerImageMap[podium[0].slug] || "/assets/jugadoras/placeholder.png"} alt={podium[0].nombre} className="w-full h-full object-cover object-top" />
                                        </a>
                                    </div>
                                    <div className="text-center mt-6 podium-stat-value">
                                        <h3 className="font-black text-[#151e42] text-2xl leading-tight truncate px-2 mb-1">
                                            <a href={`/jugadoras/${podium[0].slug}`} className="hover:text-[#FFD700] transition-colors">{podium[0].nombre}</a>
                                        </h3>
                                        <p className="text-5xl font-black text-yellow-500">{podium[0][currentConfig.primaryKey]}</p>
                                    </div>
                                </div>
                                <div className="podium-base bg-yellow-400 h-64 shadow-lg border-b-4 border-yellow-500">
                                    <MainStarIcon color="#FFD700" className="drop-shadow-sm" />
                                    <span className="text-white font-black text-6xl mt-4 drop-shadow-md">1</span>
                                </div>
                            </div>
                        )}

                        {podium[2] && (
                            <div className="podium-spot spot-3 flex flex-col justify-end">
                                <div className="flex flex-col items-center mb-4">
                                    <div className="podium-img-wrapper">
                                        <a href={`/jugadoras/${podium[2].slug}`}>
                                            <img src={playerImageMap[podium[2].slug] || "/assets/jugadoras/placeholder.png"} alt={podium[2].nombre} className="w-full h-full object-cover object-top" />
                                        </a>
                                    </div>
                                    <div className="text-center mt-4 podium-stat-value">
                                        <h3 className="font-bold text-[#151e42] text-base leading-tight truncate px-2 mb-1">
                                            <a href={`/jugadoras/${podium[2].slug}`} className="hover:text-[#CD7F32] transition-colors">{podium[2].nombre}</a>
                                        </h3>
                                        <p className="text-2xl font-black text-amber-700">{podium[2][currentConfig.primaryKey]}</p>
                                    </div>
                                </div>
                                <div className="podium-base bg-[#F8E8D5] h-32 shadow-inner">
                                    <SpotStarIcon color="#CD7F32" />
                                    <span className="text-amber-800/40 font-bold text-3xl mt-2">3</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div id="ranking-table-top" className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mb-12">
                        <div className="ranking-title-header"><h2>{currentConfig.title}</h2></div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {currentConfig.headers.map((h: string, i: number) => (
                                            <th key={i} className={`px-6 py-5 ${i === 1 ? 'text-left' : 'text-center'} text-xs font-black uppercase tracking-widest text-gray-400`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedPlayers.map((player, idx) => {
                                        const globalIndex = (currentPage - 1) * playersPerPage + idx + 4;
                                        return (
                                            <tr key={player.id_jugadora} className="ranking-table-row group transition-colors cursor-pointer" onClick={() => window.location.href = `/jugadoras/${player.slug}`}>
                                                <td className="px-6 py-5 text-center border-l-[6px] border-l-transparent transition-all group-hover:border-l-[#ffde59]">
                                                    <span className="text-sm font-bold text-gray-300">{globalIndex}</span>
                                                </td>
                                                <td className="px-6 py-5 text-left">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                                            <img src={playerImageMap[player.slug] || "/assets/jugadoras/placeholder.png"} alt={player.nombre} className="w-full h-full object-cover object-top" />
                                                        </div>
                                                        <span className="text-base font-bold text-gray-700">{player.nombre}</span>
                                                    </div>
                                                </td>
                                                {currentConfig.dataKeys.map((key: string) => {
                                                    let val = player[key];
                                                    if (key.startsWith('porcentaje_')) val = `${val}%`;
                                                    return <td key={key} className="px-6 py-5 text-center"><span className="text-lg font-black text-[#151e42]">{val}</span></td>;
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 p-8 bg-gray-50/50 border-t border-gray-100">
                                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border-2 border-gray-200 disabled:opacity-30 hover:border-yellow-400 transition-colors"><ChevronLeft size={20} /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => handlePageChange(page)} className={`w-10 h-10 rounded-lg font-bold transition-all ${currentPage === page ? 'bg-[#ffde59] text-[#151e42]' : 'hover:bg-gray-100 text-gray-500'}`}>{page}</button>
                                ))}
                                <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border-2 border-gray-200 disabled:opacity-30 hover:border-yellow-400 transition-colors"><ChevronRight size={20} /></button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-40 bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
                    <Activity className="mx-auto text-gray-300 mb-6" size={80} />
                    <h2 className="text-2xl font-bold text-gray-400">Sin datos registrados</h2>
                    <p className="text-gray-500 mt-2">No se encontraron estadísticas para los filtros seleccionados.</p>
                </div>
            )}
        </div>
    );
}
