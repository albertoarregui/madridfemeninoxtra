import { SQUAD } from "../../public/consts/squad";
import { SQUAD as ACADEMY_SQUAD } from "../../public/consts/academy_players";
import saraGoal from "../assets/awards/sara_goal.png";
import irisGoal from "../assets/awards/iris_goal.png";
import lindaGoal from "../assets/awards/linda_goal.png";
import matchEintracht from "../assets/awards/match_eintracht.png";
import matchWolfsburg from "../assets/awards/match_wolfsburg.png";
import eintrachtShield from "../assets/escudos/eintracht_de_frankfurt.png";
import wolfsburgShield from "../assets/escudos/wolfsburgo.png";

// Voting Window Configuration
export const VOTING_START = new Date("2026-05-25T10:00:00");
export const VOTING_END = new Date("2026-06-01T10:00:00");

// Data Helpers
const goalkeepers = SQUAD.filter((p) => p.position === "Portera");
const defenders = SQUAD.filter(
    (p) =>
        p.position.toLowerCase().includes("defensa") ||
        p.position.toLowerCase().includes("lateral") ||
        p.id === "eva_navarro",
);
const midfielders = SQUAD.filter((p) => p.position === "Centrocampista");
const forwards = SQUAD.filter(
    (p) =>
        (p.position.toLowerCase().includes("delantera") ||
            p.position.toLowerCase().includes("extremo")) &&
        p.id !== "eva_navarro",
);
const u23Players = SQUAD.filter(
    (p) => new Date(p.date_birth).getFullYear() >= 2002,
);

const signingsIDs = [
    "merle_frohms",
    "sara_holmgaard",
    "bella_andersson",
    "hanna_bennison",
    "sara_dabritz",
    "paula_comendador",
    "lotte_keukelaar",
];
const signings = SQUAD.filter((p) => signingsIDs.includes(p.id));
const revelacionCandidates = SQUAD.filter((p) => !signingsIDs.includes(p.id));

export const goals = [
    {
        name: "Sara Däbritz vs Atlético de Madrid",
        manualImage: saraGoal,
        videoUrl: "https://x.com/DAZN_ES/status/1964051942755156371?s=20",
        country: "de",
        id: "sara_goal_atleti", // Added explicit ID for mapping
    },
    {
        name: "Iris Ashley vs Athletic Club",
        manualImage: irisGoal,
        videoUrl: "https://x.com/realmadridfem/status/1978053176717959374?s=20",
        country: "es",
        imageScale: 1.6,
        yOffset: -65,
        id: "iris_goal_athletic",
    },
    {
        name: "Linda Caicedo vs Wolfsburgo",
        manualImage: lindaGoal,
        videoUrl:
            "https://www.youtube.com/watch?v=cnErspto5eE&pp=ygUcR29sIExpbmRhIENhaWNlZG8gV29sZnNidXJnbw%3D%3D",
        country: "co",
        id: "linda_goal_wolfsburg",
    },
];

export const matches = [
    {
        name: "Real Madrid 3-0 Eintracht de Frankfurt",
        manualImage: matchEintracht,
        icon: eintrachtShield,
        videoUrl: "https://www.youtube.com/watch?v=kLZ4Gv_IQ-A",
        poster: true,
        id: "match_eintracht",
    },
    {
        name: "Real Madrid 2-0 Wolfsburgo",
        manualImage: matchWolfsburg,
        icon: wolfsburgShield,
        videoUrl: "https://www.youtube.com/watch?v=UrLHY6KvPdo",
        poster: true,
        id: "match_wolfsburg",
    },
];

export const CATEGORIES = [
    { id: "mvp", title: "MEJOR JUGADORA (MVP)", candidates: SQUAD },
    {
        id: "revelacion",
        title: "JUGADORA QUE MÁS HA MEJORADO",
        candidates: revelacionCandidates,
    },
    { id: "u23", title: "MEJOR JOVEN (U23)", candidates: u23Players },
    { id: "cantera", title: "MEJOR CANTERANA", candidates: ACADEMY_SQUAD },
    { id: "fichaje", title: "MEJOR FICHAJE", candidates: signings },
    { id: "portera", title: "MEJOR PORTERA", candidates: goalkeepers },
    { id: "defensa", title: "MEJOR DEFENSA", candidates: defenders },
    {
        id: "centrocampista",
        title: "MEJOR CENTROCAMPISTA",
        candidates: midfielders,
    },
    { id: "delantera", title: "MEJOR DELANTERA", candidates: forwards },
    { id: "gol", title: "MEJOR GOL", candidates: goals },
    { id: "partido", title: "MEJOR PARTIDO", candidates: matches },
];
