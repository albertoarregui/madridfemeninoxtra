import React, { useState, useMemo, useEffect, useRef } from "react";
import { Target, Zap, Clock, Shield, Award, Crown, TrendingUp, Activity, Star as LucideStar, ChevronLeft, ChevronRight } from "lucide-react";
import CustomSelect from "./CustomSelect";
import MatchRecordsRanking from "./MatchRecordsRanking";
import ScrollPills from "./ScrollPills";
import {
    expandRankingRows,
    type CompactRankingRow,
    type RankingPlayerMeta,
} from "../lib/ranking-payload";

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
    initialMode?: string;
    rankingsData: CompactRankingRow[];
    rankingPlayers: RankingPlayerMeta;
    streaksData: StreakData[];
    awardsData: AwardData[];
    seasons: string[];
    competitions: string[];
    playerImageMap: Record<string, string>;
    playerFlagMap?: Record<string, string>;
    competitionLogos?: Record<string, string>;
    initialType?: string;
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
    { value: "award_monthly", label: "Más veces jugadora del mes" },
    { value: "award_season", label: "Más veces jugadora de la temporada" },
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

const ratingTone = (v: number) => (v >= 8 ? "is-top" : v >= 7 ? "is-good" : v >= 6 ? "is-ok" : "is-low");

const PER90_TYPES = new Set([
    "goles", "asistencias", "goles_generados", "tarjetas_amarillas", "tarjetas_rojas", "goles_victoria", "goles_empate", "goles_abrelatas",
    "tiros_totales", "tiros_puerta", "toques", "toques_area_rival", "pases_completados", "pases_clave", "pases_ultimo_tercio",
    "pases_largo_completados", "regates_completados", "centros_completados", "duelos_suelo_ganados", "duelos_aereos_ganados",
    "entradas", "intercepciones", "despejes", "bloqueos", "recuperaciones", "faltas_recibidas", "faltas_cometidas", "perdidas",
]);
const PER90_MIN_MINUTES = 450;
const shortLabel = (label: string) => {
    const s = label.replace(/^(Más veces|Más|Mayor|Mejor|Máximas)\s+/i, "");
    return s.charAt(0).toUpperCase() + s.slice(1);
};

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
    rankingPlayers,
    streaksData,
    awardsData,
    seasons,
    competitions,
    playerImageMap,
    playerFlagMap = {},
    competitionLogos = {},
    initialType = "goles",
    initialMode = "total",
}: StatsRankingsProps) {
    const [mode, setMode] = useState<"total" | "partido">(initialMode === "partido" ? "partido" : "total");
    const changeMode = (next: "total" | "partido") => {
        const url = new URL(window.location.href);
        url.searchParams.delete("estadistica");
        if (next === "partido") url.searchParams.set("modo", "partido"); else url.searchParams.delete("modo");
        window.history.replaceState(window.history.state, "", url);
        setMode(next);
    };
    const [selectedType, setSelectedType] = useState(
        TYPE_OPTIONS.some((o) => o.value === initialType) ? initialType : "goles",
    );
    useEffect(() => {
        if (mode === "partido") return;
        const url = new URL(window.location.href);
        if (selectedType === "goles") url.searchParams.delete("estadistica"); else url.searchParams.set("estadistica", selectedType);
        window.history.replaceState(window.history.state, "", url);
    }, [selectedType, mode]);
    const [selectedSeason, setSelectedSeason] = useState("todos");
    const [per90, setPer90] = useState(false);
    const [selectedCompetition, setSelectedCompetition] = useState("oficiales");
    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 25;
    const expandedRankingsData = useMemo(
        () => expandRankingRows(rankingsData, rankingPlayers) as RankingStat[],
        [rankingsData, rankingPlayers],
    );

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
            fueras_juego: { title: "Más fueras de juego", headers: ["Pos", "Jugadora", "F. Juego"], dataKeys: ["fueras_juego"], primaryKey: "fueras_juego", icon: <Activity style={{color: 'rgba(var(--l-muted, 150, 160, 175), 0.7)'}} /> },
            pases_completados: { title: "Más pases completados", headers: ["Pos", "Jugadora", "Pases"], dataKeys: ["pases_completados"], primaryKey: "pases_completados", icon: <TrendingUp className="text-blue-500" /> },
            porcentaje_pases: { title: "% Pases completados", headers: ["Pos", "Jugadora", "Comp./Tot.", "%"], dataKeys: ["display_ratio", "porcentaje_pases"], primaryKey: "porcentaje_pases", icon: <TrendingUp className="text-blue-300" /> },
            pases_ultimo_tercio: { title: "Pases al último tercio", headers: ["Pos", "Jugadora", "Pases"], dataKeys: ["pases_ultimo_tercio_completados"], primaryKey: "pases_ultimo_tercio_completados", icon: <Zap className="text-indigo-400" /> },
            pases_largo_completados: { title: "Pases en largo completados", headers: ["Pos", "Jugadora", "Pases"], dataKeys: ["pases_largo_completados"], primaryKey: "pases_largo_completados", icon: <TrendingUp className="text-purple-400" /> },
            porcentaje_pases_largo: { title: "% Pases en largo", headers: ["Pos", "Jugadora", "Comp./Tot.", "%"], dataKeys: ["display_ratio", "porcentaje_pases_largo"], primaryKey: "porcentaje_pases_largo", icon: <TrendingUp className="text-purple-300" /> },
            centros_completados: { title: "Centros completados", headers: ["Pos", "Jugadora", "Centros"], dataKeys: ["centros_completados"], primaryKey: "centros_completados", icon: <Zap className="text-rose-400" /> },
            porcentaje_centros: { title: "% Centros completados", headers: ["Pos", "Jugadora", "Comp./Tot.", "%"], dataKeys: ["display_ratio", "porcentaje_centros"], primaryKey: "porcentaje_centros", icon: <Zap className="text-rose-300" /> },
            bloqueos: { title: "Más bloqueos", headers: ["Pos", "Jugadora", "Bloqueos"], dataKeys: ["bloqueos"], primaryKey: "bloqueos", icon: <Shield style={{color: 'rgba(var(--l-muted, 150, 160, 175), 0.7)'}} /> },
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
            award_monthly: { title: "Más veces jugadora del mes", headers: ["Pos", "Jugadora", "Premios"], dataKeys: ["award_count"], primaryKey: "award_count", isAward: true, awardType: "mes", icon: <Award className="text-purple-500" /> },
            award_season: { title: "Más veces jugadora de la temporada", headers: ["Pos", "Jugadora", "Premios"], dataKeys: ["award_count"], primaryKey: "award_count", isAward: true, awardType: "temporada", icon: <Crown className="text-yellow-600" /> },
        };

        const typeOpt = TYPE_OPTIONS.find(o => o.value === selectedType);
        return configs[selectedType] || {
            title: typeOpt?.label || "Ranking",
            headers: ["Pos", "Jugadora", "Valor"],
            dataKeys: [selectedType.replace('cambios_', 'cambio_')],
            primaryKey: selectedType.replace('cambios_', 'cambio_'),
            icon: <Activity style={{color: 'rgba(var(--l-muted, 150, 160, 175), 0.7)'}} />
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
                if (selectedCompetition === "oficiales") {
                    matchComp = item.competicion === "all";
                } else if (selectedCompetition === "todos") {
                    matchComp = item.competicion === "todos";
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
                    if (tipo !== "MVP_MES") return;
                } else {
                    if (tipo !== "MVP_TEMPORADA") return;
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
            const explicitlyAccumulated = new Set([
                'pases_completados', 'pases_totales',
                'regates_completados', 'regates_totales',
                'pases_largo_completados', 'pases_largo_totales',
                'centros_completados', 'centros_totales',
                'duelos_suelo_ganados', 'duelos_suelo_totales',
                'duelos_aereos_ganados', 'duelos_aereos_totales',
            ]);
            expandedRankingsData.forEach(item => {
                const matchSeason = selectedSeason === "todos" || item.temporada === selectedSeason;
                if (!matchSeason) return;

                if (selectedCompetition === "oficiales") {
                    const officialComps = ["Liga F", "Primera Iberdrola", "UWCL", "Copa de la Reina", "Supercopa de España"];
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
                p.games = (p.games || 0) + (Number(item.partidos) || 0);
                p.mins = (p.mins || 0) + (Number((item as any).minutos) || 0);

                config.dataKeys.forEach((key: string) => {
                    if (key !== 'display_ratio' && !key.startsWith('porcentaje_') && !explicitlyAccumulated.has(key)) {
                        p[key] += (item as any)[key] || 0;
                    }
                });
            });

            players = Object.values(playerMap).map(p => {
                const calcPct = (num: number, den: number) => den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0;
                const calcRatio = (num: number, den: number) => {
                    if (den === 0) return `${num}/${den}`;
                    return `${num}/${den} (${Math.round((num/den)*100)}%)`;
                };

                if (selectedType === "porcentaje_pases") {
                    const t = Math.max(p.pases_totales || 0, p.pases_completados || 0);
                    p.porcentaje_pases = calcPct(p.pases_completados, t);
                    p.display_ratio = calcRatio(p.pases_completados, t);
                } else if (selectedType === "porcentaje_regates") {
                    const t = Math.max(p.regates_totales || 0, p.regates_completados || 0);
                    p.porcentaje_regates = calcPct(p.regates_completados, t);
                    p.display_ratio = calcRatio(p.regates_completados, t);
                } else if (selectedType === "porcentaje_centros") {
                    const t = Math.max(p.centros_totales || 0, p.centros_completados || 0);
                    p.porcentaje_centros = calcPct(p.centros_completados, t);
                    p.display_ratio = calcRatio(p.centros_completados, t);
                } else if (selectedType === "porcentaje_pases_largo") {
                    const t = Math.max(p.pases_largo_totales || 0, p.pases_largo_completados || 0);
                    p.porcentaje_pases_largo = calcPct(p.pases_largo_completados, t);
                    p.display_ratio = calcRatio(p.pases_largo_completados, t);
                } else if (selectedType === "porcentaje_duelos") {
                    const totalG = (p.duelos_suelo_ganados || 0) + (p.duelos_aereos_ganados || 0);
                    const totalT = Math.max((p.duelos_suelo_totales || 0) + (p.duelos_aereos_totales || 0), totalG);
                    p.porcentaje_duelos = calcPct(totalG, totalT);
                    p.display_ratio = calcRatio(totalG, totalT);
                } else if (selectedType === "porcentaje_duelos_aereos") {
                    const totalG = p.duelos_aereos_ganados || 0;
                    const totalT = Math.max(p.duelos_aereos_totales || 0, totalG);
                    p.porcentaje_duelos_aereos = calcPct(totalG, totalT);
                    p.display_ratio = calcRatio(totalG, totalT);
                } else if (selectedType === "valoracion") {
                    p.valoracion = p.valoracion_count > 0 ? parseFloat((p.valoracion_sum / p.valoracion_count).toFixed(2)) : 0;
                } else if (selectedType === "goles_generados") {
                    p.goles_generados = (p.goles || 0) + (p.asistencias || 0);
                }
                return p;
            });
        }

        const ranked = players.filter(p => Number(p[config.primaryKey]) > 0);
        if (per90 && PER90_TYPES.has(selectedType)) {
            return ranked
                .filter(p => Number(p.mins) >= PER90_MIN_MINUTES)
                .map(p => ({ ...p, per90: Number(p[config.primaryKey]) * 90 / Number(p.mins) }))
                .sort((a, b) => b.per90 - a.per90);
        }
        return ranked.sort((a, b) => Number(b[config.primaryKey]) - Number(a[config.primaryKey]));
    }, [expandedRankingsData, streaksData, awardsData, selectedType, selectedSeason, selectedCompetition, currentConfig, per90]);

    const [visible, setVisible] = useState(25);
    const [sharing, setSharing] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setVisible(25); }, [selectedType, selectedSeason, selectedCompetition]);

    const isCountStat = !currentConfig.isStreak && !currentConfig.isAward
        && !String(currentConfig.primaryKey).startsWith("porcentaje_") && currentConfig.primaryKey !== "valoracion";
    const primaryLabel = currentConfig.headers[currentConfig.headers.length - 1];
    const showPer90 = per90 && PER90_TYPES.has(selectedType);
    const formatValue = (player: any) => {
        if (showPer90 && player.per90 != null) return Number(player.per90).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const value = player[currentConfig.primaryKey];
        if (String(currentConfig.primaryKey).startsWith("porcentaje_")) return `${Number(value).toLocaleString("es-ES", { maximumFractionDigits: 1 })}%`;
        if (currentConfig.primaryKey === "valoracion") return Number(value).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return Number(value).toLocaleString("es-ES");
    };
    const perGame = (player: any) => {
        const games = Number(player.games) || 0;
        if (!games) return "—";
        return (Number(player[currentConfig.primaryKey]) / games).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const perGameLabel = currentConfig.primaryKey === "minutos" ? "Min/partido" : `${primaryLabel}/partido`;
    const seasonLabel = selectedSeason === "todos" ? "Todas las temporadas" : selectedSeason;
    const compLabel = selectedCompetition === "todos" ? "Todas las competiciones"
        : selectedCompetition === "oficiales" ? "Partidos oficiales" : selectedCompetition;

    const MAIN_STATS = [
        { value: "goles", label: "Goles" },
        { value: "asistencias", label: "Asistencias" },
        { value: "goles_generados", label: "Goles + Asist." },
        { value: "partidos", label: "Partidos" },
        { value: "minutos", label: "Minutos" },
        { value: "titularidades", label: "Titularidades" },
        { value: "porterias_cero", label: "Porterías a cero" },
        { value: "capitanias", label: "Capitanías" },
        { value: "tarjetas_amarillas", label: "Amarillas" },
        { value: "tarjetas_rojas", label: "Rojas" },
    ];
    const COMP_ORDER = ["Primera Iberdrola", "Liga F", "UWCL", "Copa de la Reina", "Supercopa de España", "Amistosos"];
    const compPills = [
        { value: "todos", label: "Todas" },
        { value: "oficiales", label: "Oficiales" },
        ...COMP_ORDER.filter((c) => competitions.includes(c)).map((c) => ({ value: c, label: c === "Amistosos" ? "Amistoso" : c })),
    ];

    const photo = (player: any) => playerImageMap[player.slug];
    const flag = (player: any) => playerFlagMap[player.slug];

    async function shareStat() {
        const node = exportRef.current;
        if (!node || sharing) return;
        setSharing(true);
        try {
            const sameOrigin = location.hostname === "www.madridfemeninoxtra.com";
            const resolve = (src: string) => {
                if (!src || !src.startsWith("https://media.madridfemeninoxtra.com/")) return src;
                if (!sameOrigin) return `/api/img-proxy?url=${encodeURIComponent(src)}`;
                return `${src}${src.includes("?") ? "&" : "?"}export=1`;
            };
            await Promise.all([...node.querySelectorAll<HTMLElement>("[data-bg]")].map((el) => new Promise<void>((done) => {
                const url = resolve(el.dataset.bg || "");
                if (!url) return done();
                const probe = new Image();
                probe.crossOrigin = "anonymous";
                probe.onload = probe.onerror = () => { el.style.backgroundImage = `url("${url}")`; done(); };
                probe.src = url;
            })));
            await document.fonts.ready;
            const { default: html2canvas } = await import("html2canvas");
            node.style.visibility = "visible";
            const canvas = await html2canvas(node, {
                backgroundColor: "#070d1c", scale: 2, useCORS: true, logging: false, imageTimeout: 5000,
                width: node.offsetWidth, height: node.scrollHeight, windowWidth: node.offsetWidth, windowHeight: node.scrollHeight,
                scrollX: 0, scrollY: 0,
                onclone: (doc) => { const clone = doc.querySelector<HTMLElement>("[data-rank-export]"); if (clone) clone.style.visibility = "visible"; },
            });
            node.style.visibility = "";
            const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/png"));
            if (!blob) throw new Error("No se pudo generar la imagen");
            const slug = `${primaryLabel}-${seasonLabel}-${compLabel}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const file = new File([blob], `ranking-${slug}.png`, { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
                try { await navigator.share({ files: [file], title: currentConfig.title }); return; }
                catch (error) { if ((error as DOMException)?.name === "AbortError") return; }
            }
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = file.name;
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        } catch (error) {
            console.error("[rankings] Error al generar la imagen:", error);
            alert("No se pudo generar la imagen. Inténtalo de nuevo.");
        } finally {
            node.style.visibility = "";
            setSharing(false);
        }
    }

    const shown = sortedPlayers.slice(0, visible);
    const podium = sortedPlayers.slice(0, 3);

    return (
        <div className="rk">
            <div className="pt-pills rk-mode" role="tablist" aria-label="Tipo de ranking">
                <button type="button" role="tab" className={`pt-pill${mode === "total" ? " is-active" : ""}`} aria-selected={mode === "total"} onClick={() => changeMode("total")}>Total acumulado</button>
                <button type="button" role="tab" className={`pt-pill${mode === "partido" ? " is-active" : ""}`} aria-selected={mode === "partido"} onClick={() => changeMode("partido")}>En un partido</button>
            </div>
            {mode === "partido" ? (
                <MatchRecordsRanking initialStat={initialType} playerImageMap={playerImageMap} playerFlagMap={playerFlagMap} competitionLogos={competitionLogos} />
            ) : (<>
            <div className="rk-actions">
                <button type="button" className="squad-download rk-share" onClick={shareStat} disabled={sharing || sortedPlayers.length === 0}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
                    {sharing ? "Generando…" : "Compartir estadística"}
                </button>
                <div className="rk-actions-right">
                    {PER90_TYPES.has(selectedType) && (
                        <label className="pt-toggle">
                            <span className={per90 ? "" : "is-on"}>Total</span>
                            <input type="checkbox" checked={per90} onChange={(e) => setPer90(e.target.checked)} aria-label="Ver por 90 minutos" />
                            <span className="pt-toggle-track" />
                            <span className={per90 ? "is-on" : ""}>x90'</span>
                        </label>
                    )}
                <div className="rk-season">
                        <span className="rk-label">Temporada</span>
                        <CustomSelect
                            id="rk-season"
                            options={[{ value: "todos", label: "Todas las temporadas" }, ...seasons.map((s) => ({ value: s, label: s }))]}
                            value={selectedSeason}
                            onChange={setSelectedSeason}
                        />
                </div>
            </div>
            </div>

            <div className="rk-filter">
                <span className="rk-label">Competición</span>
                <div className="pt-pills" role="group" aria-label="Competición">
                    {compPills.map((option) => (
                        <button key={option.value} type="button" className={`pt-pill${selectedCompetition === option.value ? " is-active" : ""}`}
                            aria-pressed={selectedCompetition === option.value} onClick={() => setSelectedCompetition(option.value)}>
                            {competitionLogos[option.value] && <img src={competitionLogos[option.value]} alt="" width={16} height={16} loading="lazy" />}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rk-filter">
                <span className="rk-label">Estadística</span>
                <ScrollPills
                    label="Estadística"
                    value={selectedType}
                    onChange={setSelectedType}
                    options={[...MAIN_STATS, ...TYPE_OPTIONS.filter((o) => !MAIN_STATS.some((m) => m.value === o.value)).map((o) => ({ value: o.value, label: shortLabel(o.label) }))]}
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
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
                .podium-img-wrapper { border-radius: 50%; border: 6px solid rgba(212,168,67,0.4); box-shadow: 0 10px 25px rgba(0,0,0,0.5); overflow: hidden; background: rgba(6,13,28,0.8); }
                .spot-1 .podium-img-wrapper { width: 190px; height: 190px; border-color: #FFD700; transform: scale(1.1); }
                .spot-2 .podium-img-wrapper { width: 160px; height: 160px; border-color: #C0C0C0; }
                .spot-3 .podium-img-wrapper { width: 140px; height: 140px; border-color: #CD7F32; }
                @media (max-width: 768px) {
                    .podium-container { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; min-height: auto; gap: 0.35rem; margin-bottom: 2rem; padding: 0; }
                    .podium-spot { width: 100%; max-width: 100%; min-width: 0; }
                    .spot-1 { order: 2; }
                    .spot-2 { order: 1; }
                    .spot-3 { order: 3; }
                    .podium-spot > div { margin-bottom: 0.35rem !important; }
                    .podium-base { padding: 0.45rem 0 !important; border-radius: 7px 7px 0 0; }
                    .spot-1 .podium-base { height: 88px !important; }
                    .spot-2 .podium-base { height: 68px !important; }
                    .spot-3 .podium-base { height: 56px !important; }
                    .podium-base svg { width: 17px; height: 17px; }
                    .podium-base span { margin-top: 0.2rem !important; font-size: 1.25rem !important; line-height: 1 !important; }
                    .ranking-title-header h2 { font-size: 1.3rem; }
                    .spot-1 .podium-img-wrapper { width: 88px; height: 88px; border-width: 3px; transform: none; }
                    .spot-2 .podium-img-wrapper { width: 72px; height: 72px; border-width: 3px; }
                    .spot-3 .podium-img-wrapper { width: 64px; height: 64px; border-width: 3px; }
                    .spot-1 .animate-bounce { width: 18px; height: 18px; }
                    .spot-1 .mb-2 { margin-bottom: 0.2rem !important; }
                    .podium-stat-value { width: 100%; margin-top: 0.45rem !important; margin-bottom: 0 !important; }
                    .podium-stat-value h3 { min-height: 2.35em; margin: 0 0 0.2rem !important; padding: 0 0.15rem !important; overflow: hidden; font-size: 0.62rem !important; line-height: 1.18 !important; white-space: normal !important; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
                    .podium-stat-value p { font-size: 1.18rem !important; line-height: 1 !important; }
                    .spot-1 .podium-stat-value p { font-size: 1.45rem !important; }
                }
                .podium-stat-value { margin-bottom: 2rem; }
            ` }} />
            {sortedPlayers.length > 0 && (
                    <div className="podium-container flex items-end justify-center px-4">
                        {podium[1] && (
                            <div className="podium-spot spot-2 flex flex-col justify-end">
                                <div className="flex flex-col items-center mb-4">
                                    <div className="podium-img-wrapper">
                                        <a href={`/jugadoras/${podium[1].slug}`}>
                                            <img src={playerImageMap[podium[1].slug] || "/assets/jugadoras/placeholder.png"} alt={podium[1].nombre} width={200} height={267} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                                        </a>
                                    </div>
                                    <div className="text-center mt-4 podium-stat-value">
                                        <p className="font-bold text-lg leading-tight truncate px-2 mb-1" style={{color: 'rgb(var(--l-ink, 240, 240, 240))'}}>
                                            <a href={`/jugadoras/${podium[1].slug}`} style={{color: 'rgb(var(--l-ink, 240, 240, 240))'}} className="hover:text-[rgb(var(--l-ink,192,192,192))] transition-colors">{podium[1].nombre}</a>
                                        </p>
                                        <p className="text-3xl font-black" style={{color: 'rgb(var(--l-ink, 192, 192, 192))'}}>{formatValue(podium[1])}</p>
                                    </div>
                                </div>
                                <div className="podium-base h-40" style={{background: 'rgba(var(--l-ink, 192, 192, 192), 0.1)', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.3)'}}>
                                    <SpotStarIcon color="#C0C0C0" />
                                    <span className="font-bold text-4xl mt-3" style={{color: 'rgba(var(--l-ink, 192, 192, 192), 0.5)'}}>2</span>
                                </div>
                            </div>
                        )}

                        {podium[0] && (
                            <div className="podium-spot spot-1 flex flex-col justify-end">
                                <div className="flex flex-col items-center mb-4 z-10">
                                    <div className="mb-2"><Crown className="text-yellow-400 animate-bounce" size={32} /></div>
                                    <div className="podium-img-wrapper ring-4 ring-yellow-400 ring-offset-4">
                                        <a href={`/jugadoras/${podium[0].slug}`}>
                                            <img src={playerImageMap[podium[0].slug] || "/assets/jugadoras/placeholder.png"} alt={podium[0].nombre} width={200} height={267} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                                        </a>
                                    </div>
                                    <div className="text-center mt-6 podium-stat-value">
                                        <h3 className="font-black text-2xl leading-tight truncate px-2 mb-1" style={{color: 'rgb(var(--l-ink, 240, 240, 240))'}}>
                                            <a href={`/jugadoras/${podium[0].slug}`} style={{color: 'rgb(var(--l-ink, 240, 240, 240))'}} className="hover:text-[rgb(var(--l-gold,255,215,0))] transition-colors">{podium[0].nombre}</a>
                                        </h3>
                                        <p className="text-5xl font-black" style={{color: 'rgb(var(--l-gold, 212, 168, 67))'}}>{formatValue(podium[0])}</p>
                                    </div>
                                </div>
                                <div className="podium-base h-64 shadow-lg" style={{background: 'rgba(212,168,67,0.18)', borderBottom: '4px solid rgba(212,168,67,0.5)'}}>
                                    <MainStarIcon color="#FFD700" className="drop-shadow-sm" />
                                    <span className="font-black text-6xl mt-4 drop-shadow-md" style={{color: 'rgb(var(--l-gold, 212, 168, 67))'}}>1</span>
                                </div>
                            </div>
                        )}

                        {podium[2] && (
                            <div className="podium-spot spot-3 flex flex-col justify-end">
                                <div className="flex flex-col items-center mb-4">
                                    <div className="podium-img-wrapper">
                                        <a href={`/jugadoras/${podium[2].slug}`}>
                                            <img src={playerImageMap[podium[2].slug] || "/assets/jugadoras/placeholder.png"} alt={podium[2].nombre} width={200} height={267} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                                        </a>
                                    </div>
                                    <div className="text-center mt-4 podium-stat-value">
                                        <h3 className="font-bold text-base leading-tight truncate px-2 mb-1" style={{color: 'rgb(var(--l-ink, 240, 240, 240))'}}>
                                            <a href={`/jugadoras/${podium[2].slug}`} style={{color: 'rgb(var(--l-ink, 240, 240, 240))'}} className="hover:text-[rgb(var(--l-red,205,127,50))] transition-colors">{podium[2].nombre}</a>
                                        </h3>
                                        <p className="text-2xl font-black" style={{color: 'rgb(var(--l-red, 205, 127, 50))'}}>{formatValue(podium[2])}</p>
                                    </div>
                                </div>
                                <div className="podium-base h-32" style={{background: 'rgba(205,127,50,0.1)', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.3)'}}>
                                    <SpotStarIcon color="#CD7F32" />
                                    <span className="font-bold text-3xl mt-2" style={{color: 'rgba(var(--l-red, 205, 127, 50), 0.5)'}}>3</span>
                                </div>
                            </div>
                        )}
                    </div>

            )}

            <div className="rk-card mfx-corners" id="ranking-table-top">
                <div className="rk-head">
                    <h2>{currentConfig.title}</h2>
                    <p>{seasonLabel} · {compLabel}{showPer90 ? " · por 90 minutos" : ""}</p>
                </div>
                {showPer90 && <p className="rk-note">Mínimo {PER90_MIN_MINUTES} minutos jugados.</p>}
                {sortedPlayers.length === 0 ? (
                    <p className="rk-empty">No hay datos para estos filtros.</p>
                ) : (
                    <table className="rk-table">
                        <thead>
                            <tr>
                                <th className="rk-pos">#</th>
                                <th className="rk-player">Jugadora</th>
                                {isCountStat && <th className="rk-num">Partidos</th>}
                                {isCountStat && currentConfig.primaryKey !== "partidos" && <th className="rk-num rk-hide-sm">{perGameLabel}</th>}
                                <th className="rk-value">{showPer90 ? `${primaryLabel} x90'` : primaryLabel} ↓</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((player, index) => (
                                <tr key={player.id_jugadora ?? player.slug} onClick={() => player.slug && (window.location.href = `/jugadoras/${player.slug}`)}>
                                    <td className="rk-pos"><span className={`rk-rank${index === 0 ? " is-first" : ""}`}>{index + 1}</span></td>
                                    <td className="rk-player">
                                        <a className="rk-person" href={player.slug ? `/jugadoras/${player.slug}` : undefined} onClick={(e) => e.stopPropagation()}>
                                            <span className="rk-photo">{photo(player) && <img src={photo(player)} alt="" width={52} height={52} loading="lazy" />}</span>
                                            <span className="rk-name">
                                                <strong>{player.nombre}{flag(player) && <img className="rk-flag" src={flag(player)} alt="" width={20} height={14} loading="lazy" />}</strong>
                                                {player.posicion && <small>{player.posicion}</small>}
                                            </span>
                                        </a>
                                    </td>
                                    {isCountStat && <td className="rk-num">{player.games || "—"}</td>}
                                    {isCountStat && currentConfig.primaryKey !== "partidos" && <td className="rk-num rk-hide-sm">{perGame(player)}</td>}
                                    <td className="rk-value"><b className={currentConfig.primaryKey === "valoracion" ? `rk-rating ${ratingTone(Number(player.valoracion) || 0)}` : undefined}>{formatValue(player)}</b>{currentConfig.primaryKey !== "display_ratio" && player.display_ratio && <small>{player.display_ratio}</small>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {visible < sortedPlayers.length && (
                    <button type="button" className="btn-more rk-more-btn" onClick={() => setVisible((v) => v + 25)}>
                        Cargar más ({sortedPlayers.length - visible} restantes)
                    </button>
                )}
            </div>

            <div className="rk-export" data-rank-export ref={exportRef} aria-hidden="true">
                <div className="rk-export-head">
                    <small>{seasonLabel} · {compLabel}</small>
                    <h3>{currentConfig.title}</h3>
                </div>
                {sortedPlayers.slice(0, 10).map((player, index) => (
                    <div className="rk-export-row" key={`x-${player.id_jugadora ?? player.slug}`}>
                        <span className={`rk-rank${index === 0 ? " is-first" : ""}`}><i style={{ position: "absolute", left: 0, right: 0, top: -9, lineHeight: "48px", textAlign: "center", fontStyle: "normal" }}>{index + 1}</i></span>
                        <span className="rk-export-photo" data-bg={photo(player) || ""} />
                        <span className="rk-export-name">{player.nombre}<small>{player.posicion}</small></span>
                        {isCountStat && <span className="rk-export-games">{player.games || "—"} PJ</span>}
                        <b>{formatValue(player)}</b>
                    </div>
                ))}
            </div>
            </>)}
        </div>
    );
}
