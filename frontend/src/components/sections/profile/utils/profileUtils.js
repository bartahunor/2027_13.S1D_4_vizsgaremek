// Közös segédfüggvények a profil oldal komponenseihez

// ----------------- XP SZÁMÍTÁS ---------------- //
// 0–10% → 10 XP, 11–20% → 20 XP, … 91–100% → 100 XP
const XP_BAND_SIZE = 10;
const XP_PER_BAND = 10;

export const calcTestXp = (test) => {
    if (!test.max_pont) return 0;

    const percent = Math.round((test.elert_pont / test.max_pont) * 100);
    const band = Math.max(1, Math.ceil(percent / XP_BAND_SIZE)); // a 0% is az 1. sáv
    return band * XP_PER_BAND;
};

// ----------------- TANTÁRGYAK ---------------- //
const SUBJECT_CONFIG = {
    Matematika: {
        subject: "Matematika",
        legendSubject: "Matematika",
        color: "#351F5B",
        icon: "functions",
        iconBg: "#351F5B",
    },
    Irodalom: {
        subject: "Magyar nyelv és irodalom",
        legendSubject: "Magyar irodalom",
        color: "#6D4DA3",
        icon: "menu_book",
        iconBg: "#8C69B5",
    },
    Történelem: {
        subject: "Történelem",
        legendSubject: "Történelem",
        color: "#916CBD",
        icon: "history_edu",
        iconBg: "#6D4DA3",
    },
    Angol: {
        subject: "Angol nyelv",
        legendSubject: "Angol nyelv",
        color: "#B892F7",
        icon: "translate",
        iconBg: "#B892F7",
        iconColor: "#351F5B",
    },
    Biológia: {
        subject: "Biológia",
        legendSubject: "Biológia",
        color: "#DECFF2",
        icon: "biotech",
        iconBg: "#DECFF2",
        iconColor: "#351F5B",
    },
};

const DEFAULT_COLOR = "#B8A9D9";

export const LEVEL_LABELS = {
    kozep: "Középszint",
    emelt: "Emelt szint",
};

export const getConfig = (tantargy) =>
    SUBJECT_CONFIG[tantargy] ?? {
        subject: tantargy,
        legendSubject: tantargy,
        color: DEFAULT_COLOR,
        icon: "school",
        iconBg: DEFAULT_COLOR,
        iconColor: "#351F5B",
    };

export const getTabLabel = (subject) => {
    if (subject === "Mind") return "Mind";
    return getConfig(subject).legendSubject;
};

// ----------------- IDŐ / SZÁM FORMÁZÁS ---------------- //
export const formatTime = (seconds) => {
    const hours = seconds / 3600;
    if (hours >= 1) return `${Math.round(hours)} óra`;
    return `${Math.round(seconds / 60)} perc`;
};

// A legutóbbi szeptember 1. óta eltelt napok száma.
// Szeptember 1. előtt az előző évi szeptember 1. a kezdet.
export const getDaysSinceSchoolYearStart = () => {
    const now = new Date();
    const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1; // 8 = szeptember
    const start = new Date(startYear, 8, 1);

    return Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
};

// 5140 → "5.14K", 820 → "820"
export const formatCount = (n) =>
    n >= 1000 ? `${(n / 1000).toFixed(2)}K` : String(n);

// másodperc → "1:21"
export const formatMinSec = (seconds) => {
    const total = Math.round(seconds);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
};