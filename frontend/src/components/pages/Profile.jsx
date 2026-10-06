import { useEffect, useState, useRef, useMemo } from "react";
import { apiFetch } from '../../lib/apiClient';
import ActivityCard from "../sections/ActivityCard";


// ----------------- XP SZÁMÍTÁS ---------------- //
// 0–10% → 10 XP, 11–20% → 20 XP, … 91–100% → 100 XP
const XP_BAND_SIZE = 10;
const XP_PER_BAND = 10;

const calcTestXp = (test) => {
    if (!test.max_pont) return 0;

    const percent = Math.round((test.elert_pont / test.max_pont) * 100);
    const band = Math.max(1, Math.ceil(percent / XP_BAND_SIZE)); // a 0% is az 1. sáv
    return band * XP_PER_BAND;
};

// ----------------- KÖR DIAGRAM ADATAINAK RENDEZÉSE ---------------- //
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
const DEFAULT_ACTIVITY_META = { icon: "school", iconBg: "#B8A9D9", iconColor: "#351F5B" };

const LEVEL_LABELS = {
    kozep: "Középszint",
    emelt: "Emelt szint",
};

const getConfig = (tantargy) =>
    SUBJECT_CONFIG[tantargy] ?? {
        subject: tantargy,
        legendSubject: tantargy,
        color: DEFAULT_COLOR,
        icon: "school",
        iconBg: DEFAULT_COLOR,
        iconColor: "#351F5B",
    };

const getTabLabel = (subject) => {
    if (subject === "Mind") return "Mind";
    return getConfig(subject).legendSubject;
};

const formatTime = (seconds) => {
    const hours = seconds / 3600;
    if (hours >= 1) return `${Math.round(hours)} óra`;
    return `${Math.round(seconds / 60)} perc`;
};

const groupBySubject = (items) =>
    items.reduce((acc, item) => {
        const config = getConfig(item.tantargy);
        const key = config.subject;

        if (!acc[key]) {
            acc[key] = { ...config, seconds: 0, tasks: 0 };
        }
        acc[key].seconds += item.kitoltesi_ido;
        acc[key].tasks += item.feladatok_szama;
        return acc;
    }, {});

const buildPieData = (data, prevData = []) => {
    const current = groupBySubject(data);
    const previous = groupBySubject(prevData);
    const totalSeconds = Object.values(current).reduce((sum, s) => sum + s.seconds, 0);

    return Object.values(current)
        .map(({ subject, legendSubject, color, seconds, tasks }) => {
            const prevSeconds = previous[subject]?.seconds;
            let change = null;
            if (prevSeconds) {
                const diff = ((seconds - prevSeconds) / prevSeconds) * 100;
                change = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
            }

            return {
                subject,
                legendSubject,
                hours: formatTime(seconds),
                percent: totalSeconds ? Math.round((seconds / totalSeconds) * 100) : 0,
                tasks: `${tasks} feladat`,
                color,
                change,
            };
        })
        .sort((a, b) => b.percent - a.percent);
};

// ----------------- VONAL DIAGRAM ADATAINAK RENDEZÉSE ---------------- //
// A legutóbbi szeptember 1. óta eltelt napok száma.
// Szeptember 1. előtt az előző évi szeptember 1. a kezdet.
const getDaysSinceSchoolYearStart = () => {
    const now = new Date();
    const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1; // 8 = szeptember
    const start = new Date(startYear, 8, 1);

    return Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
};

// ----------------- VONALDIAGRAM TENGELYEI ---------------- //
const CHART = { xMin: 65, xMax: 870, yTop: 30, yBottom: 240, yIntervals: 5 };
const X_TICK_STEP = { "7d": 1, "30d": 5, term: 14 }; // napokban

const getRangeDays = (timeRange) =>
    timeRange === "term" ? getDaysSinceSchoolYearStart() : parseInt(timeRange, 10);

// A "datum" (UTC ISO) → helyi "YYYY-MM-DD" kulcs
const toLocalDateKey = (isoString) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const getBucketStep = (timeRange) => X_TICK_STEP[timeRange] ?? 1;

// Bucket sorszám (0 = legrégebbi) → x pozíció: az első a bal, az utolsó a jobb szélen áll
const bucketX = (index, count) =>
    count > 1
        ? CHART.xMin + (index / (count - 1)) * (CHART.xMax - CHART.xMin)
        : (CHART.xMin + CHART.xMax) / 2;

// Bucketek: [0] = a legutóbbi (a mai napot tartalmazó), [count-1] = a legrégebbi
const aggregateByBucket = (tests, timeRange) => {
    const totalDays = getRangeDays(timeRange);
    const step = getBucketStep(timeRange);
    const today = startOfDay(new Date());

    const buckets = Array.from({ length: Math.ceil(totalDays / step) }, () => ({
        xp: 0, tasks: 0, earned: 0, max: 0,
    }));

    tests.forEach((t) => {
        const daysAgo = Math.round((today - startOfDay(new Date(t.datum))) / 86400000);
        if (daysAgo < 0 || daysAgo >= totalDays) return; // időszakon kívül

        const b = buckets[Math.floor(daysAgo / step)];
        b.xp += calcTestXp(t);
        b.tasks += t.feladatok_szama;
        b.earned += t.elert_pont;
        b.max += t.max_pont;
    });

    return buckets;
};

const buildChartPoints = (buckets, timeRange, yAxis) => {
    const totalDays = getRangeDays(timeRange);
    const step = getBucketStep(timeRange);
    const today = startOfDay(new Date());
    const fmt = (d) => d.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
    const daysBack = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

    const points = [];
    for (let k = buckets.length - 1; k >= 0; k--) { // legrégebbi → legújabb
        const b = buckets[k];
        const end = daysBack(k * step);
        const start = daysBack(Math.min((k + 1) * step - 1, totalDays - 1));

        points.push({
            x: bucketX(buckets.length - 1 - k, buckets.length),
            y: CHART.yBottom - (b.xp / yAxis.top) * (CHART.yBottom - CHART.yTop),
            date: step === 1 ? fmt(end) : `${fmt(start)} – ${fmt(end)}`,
            score: `${b.xp} XP`,
            tasks: `${b.tasks} feladat`,
            accuracy: b.max ? `${Math.round((b.earned / b.max) * 100)}%` : "–",
        });
    }
    return points;
};

// Alsó tengely: bucketenként egy címke (a bucket utolsó napja), ugyanott, ahol a pont áll
const buildXAxis = (timeRange) => {
    const totalDays = getRangeDays(timeRange);
    const step = getBucketStep(timeRange);
    const count = Math.ceil(totalDays / step);
    const today = startOfDay(new Date());

    const ticks = Array.from({ length: count }, (_, i) => {
        const k = count - 1 - i; // hány bucketnyire van a mai naptól
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - k * step);

        return {
            x: bucketX(i, count),
            dayIndex: i,
            label: date.toLocaleDateString("hu-HU", { month: "short", day: "numeric" }),
        };
    });

    return { totalDays, ticks };
};

// Bal tengely: "szép" lépésköz (1, 2, 2.5, 5, 10 × 10^n), 5 egyenlő sáv
const getNiceStep = (maxValue, intervals) => {
    if (maxValue <= 0) return 1;
    const raw = maxValue / intervals;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const normalized = raw / magnitude;
    const nice = [1, 2, 3, 4, 5, 10].find((n) => normalized <= n);
    return nice * magnitude;
};

const formatAxisValue = (v) =>
    v >= 1000 ? `${Number((v / 1000).toFixed(1))}k` : String(Number(v.toFixed(1)));

const buildYAxis = (maxValue) => {
    const step = getNiceStep(maxValue, CHART.yIntervals);
    const top = step * CHART.yIntervals;

    const ticks = Array.from({ length: CHART.yIntervals + 1 }, (_, i) => ({
        value: step * i,
        label: formatAxisValue(step * i),
        y: CHART.yBottom - (i / CHART.yIntervals) * (CHART.yBottom - CHART.yTop),
    }));

    return { top, ticks };
};


// Lineáris interpoláció: a régi vonal y értéke egy adott x-nél (animációhoz)
const sampleY = (points, x) => {
    if (!points.length) return null;
    if (x <= points[0].x) return points[0].y;
    for (let i = 1; i < points.length; i++) {
        if (x <= points[i].x) {
            const a = points[i - 1];
            const b = points[i];
            return a.y + (b.y - a.y) * ((x - a.x) / ((b.x - a.x) || 1));
        }
    }
    return points[points.length - 1].y;
};

//------------------ KPI ADATOK SEGÉDFÜGGVÉNYEI ------------------ //
// 5140 → "5.14K", 820 → "820"
const formatCount = (n) =>
    n >= 1000 ? `${(n / 1000).toFixed(2)}K` : String(n);

// másodperc → "1:21"
const formatMinSec = (seconds) => {
    const total = Math.round(seconds);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
};

// ----------------- TEVÉKENYSÉGI NAPLÓ SEGÉDFÜGGVÉNYEI ---------------- //
const ACTIVITY_PAGE_SIZE = 5;

// A szűrőgombok értéke → a tantargyak.nev értéke az adatbázisban.
// A kulcsok a jelenlegi gombok, az értékeket ellenőrizd az adatbázisban!
/*
const ACTIVITY_FILTER_SUBJECT = {
    all: null,
    matek: "Matematika",
    tori: "Történelem",
    magyar: "Irodalom",
    angol: "Angol",
    bio: "Biológia",
};*/

const fetchActivities = (tantargy, offset) => {
    const params = new URLSearchParams({ limit: ACTIVITY_PAGE_SIZE, offset });
    if (tantargy) params.append("tantargy", tantargy);

    return apiFetch(`/profilroutes/me/activities?${params}`);
};

// ----------------- AKTIVITÁS NAPLÓ ADATOK RENDEZÉSE ---------------- //

// "Ma · 11:20", "Tegnap · 16:30", "Szep 29. · 10:35"
const formatActivityDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();

    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

    const time = date.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });

    if (diffDays === 0) return `Ma · ${time}`;
    if (diffDays === 1) return `Tegnap · ${time}`;

    const day = date.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
    return `${day} · ${time}`;
};

const mapActivity = (item) => {
    const config = getConfig(item.tantargy);

    return {
        id: item.id,
        subject: config.subject,
        topic: item.nev,
        level: LEVEL_LABELS[item.szint] ?? item.szint,
        icon: config.icon,
        iconBg: config.iconBg,
        iconColor: config.iconColor,
        description: `${item.feladatok_szama} feladat megoldva · ${formatTime(item.kitoltesi_ido)} időráfordítás`,
        date: formatActivityDate(item.datum),
        accuracy: item.feladatok_szama
            ? Math.round((item.helyes_szama / item.feladatok_szama) * 100)
            : 0,
        correct: item.helyes_szama,
        total: item.feladatok_szama,
    };
};

function ProfilePage() {

    const [profildata, setProfildata] = useState([]);
    const [profiltests, setProfiltests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testsLoading, setTestsLoading] = useState(true);
    const [error, setError] = useState(null);

    //Fruzsi
    const [tabSubjects, setTabSubjects] = useState(["Mind"]);
    const subjectsInitialized = useRef(false);
    const [selectedSubject, setSelectedSubject] = useState("Mind");
    const [timeRange, setTimeRange] = useState("7d");
    const [loadedRange, setLoadedRange] = useState("7d");
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const [pieStats, setPieStats] = useState([]);
    const [hoveredPieSubject, setHoveredPieSubject] = useState(null);

    const [calendarStats, setCalendarStats] = useState([]);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date().getDate());


    const [activityFilter, setActivityFilter] = useState("Mind");
    const [activityItems, setActivityItems] = useState([]);
    const [activityHasMore, setActivityHasMore] = useState(false);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityLoadingMore, setActivityLoadingMore] = useState(false);
    const [activityError, setActivityError] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showFullActivityArchive, setShowFullActivityArchive] = useState(false);


    useEffect(() => {
        let cancelled = false;

        const loadStaticData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [profil, pie, calendar] = await Promise.all([
                    apiFetch('/profilroutes/me'),
                    apiFetch('/profilroutes/me/piechart'),
                    apiFetch('/profilroutes/me/calendar'),
                ]);

                if (cancelled) return;
                setProfildata(profil);
                setPieStats(pie);
                setCalendarStats(calendar);
                setTabSubjects(["Mind", ...new Set(pie.map((p) => p.tantargy))]);
            } catch (err) {
                if (cancelled) return;
                setError("Nem sikerült betölteni az adatokat.");
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadStaticData();
        return () => { cancelled = true; };
    }, []);

    // 2) Mountkor ÉS szűrő változásakor: tesztek

    useEffect(() => {
        let cancelled = false;

        const loadProfilTests = async () => {
            try {
                setTestsLoading(true);

                const params = new URLSearchParams();
                if (selectedSubject && selectedSubject !== 'Mind') {
                    params.append('tantargy', selectedSubject);
                }

                if (timeRange === 'term') {
                    params.append('napok', getDaysSinceSchoolYearStart());
                } else if (timeRange) {
                    params.append('napok', parseInt(timeRange, 10)); // "7d" → 7, "30d" → 30
                }

                const query = params.toString();
                const data = await apiFetch(
                    `/profilroutes/me/tests${query ? `?${query}` : ''}`
                );

                if (cancelled) return;
                setProfiltests(data);
                setLoadedRange(timeRange);
                console.log(data)

                
            } catch (err) {
                if (cancelled) return;
                setError("Nem sikerült betölteni a teszteket.");
                console.error(err);
            } finally {
                if (!cancelled) setTestsLoading(false);
            }
        };

        loadProfilTests();
        return () => { cancelled = true; };
    }, [selectedSubject, timeRange]);

    useEffect(() => {
        let cancelled = false;

        const loadActivities = async () => {
            try {
                setActivityLoading(true);
                setActivityError(null);

                const data = await fetchActivities(
                    activityFilter === "Mind" ? null : activityFilter,
                    0
                );

                if (cancelled) return;
                setActivityItems(data.items);
                setActivityHasMore(data.hasMore);
                console.log("activities", data);
            } catch (err) {
                if (cancelled) return;
                setActivityError("Nem sikerült betölteni a tevékenységeket.");
                console.error(err);
            } finally {
                if (!cancelled) setActivityLoading(false);
            }
        };

        loadActivities();
        return () => { cancelled = true; };
    }, [activityFilter]);

    const loadMoreActivities = async () => {
        try {
            setActivityLoadingMore(true);

            const data = await fetchActivities(
                activityFilter === "Mind" ? null : activityFilter,
                activityItems.length
            );

            setActivityItems((prev) => [...prev, ...data.items]);
            setActivityHasMore(data.hasMore);
        } catch (err) {
            setActivityError("Nem sikerült betölteni a további tevékenységeket.");
            console.error(err);
        } finally {
            setActivityLoadingMore(false);
        }
    };


    //--------- FEJLÉC ADATOK RENDEZÉSE ----------- //
    const szerepNevek = {
        tanar: 'Tanár',
        diak: 'Diák',
        admin: 'Admin',
    }

    const szerepFelirat = szerepNevek[profildata.szerep] ?? profildata.szerep

    const kezdobetu = profildata.felhasznalonev?.charAt(0).toUpperCase() ?? '?'

    const csatlakozasDatuma = profildata.created_at
        ? new Date(profildata.created_at).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: 'numeric',
        })
        : ''

    


    const activityLogs = activityItems.map(mapActivity);


    //------------------- NAPTÁR ADATAINAK BETÖLTÉSE ------------- //
    const calendarActivity = Object.fromEntries(
        calendarStats.map((d) => [
            d.nap,
            {
                tasks: d.feladatok_szama,
                minutes: Math.round(d.kitoltesi_ido / 60),
            },
        ])
    );

    const filteredActivityLogs =
        activityFilter === "all"
            ? activityLogs
            : activityLogs.filter(
                (activity) => activity.type === activityFilter
            );

    const visibleActivityLogs = showFullActivityArchive
        ? filteredActivityLogs
        : filteredActivityLogs.slice(0, 5);


    const getDateKey = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const getActivityLevel = (tasks = 0) => {
        if (tasks === 0) return 0;
        if (tasks < 20) return 1;
        if (tasks < 40) return 2;
        return 3;
    };
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const monthName = calendarDate.toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
    });
    const goToPreviousMonth = () => {
        setCalendarDate(
            new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
        );
        setSelectedCalendarDay(null);
    };

    const goToNextMonth = () => {
        setCalendarDate(
            new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
        );
        setSelectedCalendarDay(null);
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // JavaScript: vasárnap = 0, hétfő = 1
    // Nekünk hétfővel kell kezdeni.
    const firstDay = new Date(year, month, 1).getDay();
    const startingOffset = firstDay === 0 ? 6 : firstDay - 1;

    const calendarDays = [
        ...Array.from({ length: startingOffset }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    const getActivityClass = (tasks = 0) => {
        const level = getActivityLevel(tasks);

        switch (level) {
            case 3:
                return "bg-[#351F5B] text-white";
            case 2:
                return "bg-[#8C69B5] text-white";
            case 1:
                return "bg-[#D3C2E8] text-primary";
            default:
                return "bg-[#F2EFF7] text-on-surface-variant";
        }
    };

    // ----------------- KÖR DIAGRAM ADATAINAK BETÖLTÉSE -------------- //
    const pieData = buildPieData(pieStats);
    const totalHoursText = Math.round(
        pieStats.reduce((sum, s) => sum + s.kitoltesi_ido, 0) / 3600
    );

    const totalPercent = pieData.reduce(
        (sum, item) => sum + item.percent,
        0
    );

    let currentAngle = -90;

    const slices = pieData.map((item) => {
        const startAngle = currentAngle;

        const angle = totalPercent ? (item.percent / totalPercent) * 360 : 0;

        const endAngle = startAngle + angle;

        const middleAngle =
            startAngle + angle / 2;

        currentAngle = endAngle;

        return {
            ...item,
            startAngle,
            endAngle,
            middleAngle
        };
    });

    const getSliceTransform = (
        middleAngle,
        distance = 10
    ) => {
        const radians =
            (middleAngle * Math.PI) / 180;

        const x =
            Math.cos(radians) * distance;

        const y =
            Math.sin(radians) * distance;

        return `translate(${x}px, ${y}px)`;
    };

    const buckets = useMemo(
        () => aggregateByBucket(profiltests, loadedRange),
        [profiltests, loadedRange]
    );
    const maxBucketXp = Math.max(0, ...buckets.map((b) => b.xp));

    const yAxis = buildYAxis(maxBucketXp);
    const xAxis = useMemo(() => buildXAxis(loadedRange), [loadedRange]);
    const targetPoints = useMemo(
        () => buildChartPoints(buckets, loadedRange, yAxis),
        [buckets, loadedRange, yAxis.top]
    );

    const [animatedChartPoints, setAnimatedChartPoints] = useState([]);

    useEffect(() => {
        if (!targetPoints.length) return;

        const startPoints = animatedChartPoints;

        // Első betöltés: nincs honnan animálni
        if (!startPoints.length) {
            setAnimatedChartPoints(targetPoints);
            return;
        }

        // A régi vonal y értéke az új pontok x pozíciójánál
        const startYs = targetPoints.map((p) => sampleY(startPoints, p.x) ?? p.y);
        const duration = 650;
        const startTime = performance.now();
        let animationFrame;

        const easeInOutCubic = (t) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const animate = (currentTime) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = easeInOutCubic(progress);

            setAnimatedChartPoints(
                targetPoints.map((target, i) => ({
                    ...target,
                    y: startYs[i] + (target.y - startYs[i]) * eased,
                }))
            );

            if (progress < 1) animationFrame = requestAnimationFrame(animate);
        };

        setHoveredPoint(null);
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetPoints]);

    const chartPoints = animatedChartPoints;

    const chartLinePath = chartPoints
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");

    const chartAreaPath = chartPoints.length
        ? `M ${chartPoints[0].x} 240 ${chartPoints.map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${chartPoints[chartPoints.length - 1].x} 240 Z`
        : "";

    //----------------- KPI ADATOK RENDEZÉSE -----------------//
    const totalTasks = profiltests.reduce((sum, t) => sum + t.feladatok_szama, 0);
    const totalSeconds = profiltests.reduce((sum, t) => sum + t.kitoltesi_ido, 0);
    const totalEarned = profiltests.reduce((sum, t) => sum + t.elert_pont, 0);
    const totalMax = profiltests.reduce((sum, t) => sum + t.max_pont, 0);
    const totalXp = profiltests.reduce((sum, t) => sum + calcTestXp(t), 0);
    const kpiXpText = formatCount(totalXp);

    const kpiTasksText = formatCount(totalTasks);

    const kpiTimeText = totalTasks
        ? formatMinSec(totalSeconds / totalTasks)
        : "–";

    const kpiAccuracyText = totalMax
        ? `${((totalEarned / totalMax) * 100).toFixed(2)}%`
        : "–";


    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 bg-transparent flex-grow">
            <div className="flex flex-col w-full pb-10">

                {/* PROFIL FEJLÉC */}
                <section className="w-full bg-white rounded-2xl border border-[#E8E3EE] shadow-sm p-6 mb-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                        {/* BAL OLDAL */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">

                            {/* AVATAR */}
                            <div className="relative">

                                <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-[#351F5B] text-white flex items-center justify-center text-2xl font-bold tracking-tight shadow-md">
                                    {kezdobetu}
                                </div>

                                {/* AKTÍV JELZÉS */}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow ring-2 ring-white">
                                    <span className="material-symbols-outlined text-[13px] font-bold">
                                        check
                                    </span>
                                </div>

                            </div>

                            {/* NÉV + INFORMÁCIÓK */}
                            <div className="flex flex-col">

                                <div className="flex items-center gap-2 flex-wrap">

                                    <h1 className="text-[28px] leading-9 font-semibold text-[#351F5B] tracking-tight">
                                        {profildata.felhasznalonev}
                                    </h1>

                                    {/* TANULÓ */}
                                    <span className="px-2 py-0.5 rounded-full bg-[#EFEAF6] text-[#351F5B] text-[11px] leading-[14px] uppercase tracking-wider font-semibold">
                                        {szerepFelirat}
                                    </span>

                                    

                                </div>

                                {/* MÁSODLAGOS INFORMÁCIÓ */}
                                <p className="text-sm leading-[22px] text-[#49454F] mt-1 flex items-center gap-1.5 flex-wrap">

                                    <span className="material-symbols-outlined text-[16px] text-[#4B2A7F]">
                                        verified
                                    </span>

                                    <span>
                                        TudásTér tag:
                                    </span>

                                    <span className="font-medium text-[#27222E]">
                                        {csatlakozasDatuma}
                                    </span>

                                    <span>
                                        óta
                                    </span>


                                </p>

                            </div>

                        </div>

                        {/* JOBB OLDALI GOMBOK */}
                        <div className="flex w-full sm:w-auto items-center gap-2 self-stretch sm:self-start md:self-center">

                            {/* PROFIL SZERKESZTÉSE */}
                            <button
                                className="group flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#F7F6F8] hover:bg-[#EEEAF4] text-[#351F5B] text-sm leading-[22px] font-medium transition-all shadow-sm border border-[#E3DCED]"
                                id="editProfileBtn"
                                type="button"
                            >

                                <span className="material-symbols-outlined text-[18px] text-[#4B2A7F] group-hover:rotate-12 transition-transform">
                                    edit_note
                                </span>

                                <span>
                                    Profil szerkesztése
                                </span>

                            </button>

                            {/* MEGOSZTÁS */}
                            <button
                                aria-label="Megosztás"
                                className="w-10 h-10 rounded-xl bg-[#F7F6F8] border border-[#E3DCED] flex items-center justify-center text-[#49454F] hover:text-[#351F5B] hover:bg-[#EEEAF4] transition-colors"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    share
                                </span>
                            </button>

                        </div>

                    </div>

                </section>
                {/* FEJLŐDÉSI ANALITIKA */}
                <section className="w-full bg-white rounded-2xl border border-[#E8E3EE] shadow-sm overflow-hidden mb-6">

                    {/* FEJLÉC + SZŰRŐK */}
                    <div className="p-6 pb-4 border-b border-[#F0EBF5] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div>
                            <span className="text-[11px] leading-[14px] uppercase tracking-wider text-[#4B2A7F] font-semibold">
                                Fejlődési analitika
                            </span>

                            <h2
                                className="text-[22px] leading-[30px] font-semibold text-[#351F5B] mt-0.5"
                                id="mainChartHeading"
                            >
                                Tantárgyi haladás és eredményesség
                            </h2>

                            <p
                                className="text-xs leading-[18px] text-[#49454F]"
                                id="mainChartSubheading"
                            >
                                Összesített teljesítmény fejlődési görbéje
                            </p>
                        </div>


                        {/* SZŰRŐK */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

                            {/* TANTÁRGYVÁLASZTÓ */}
                            <div
                                className="flex w-full lg:w-auto items-center gap-1 p-1 bg-[#F1ECF7] rounded-xl overflow-x-auto shadow-inner"
                                id="subjectEvolutionTabs"
                                role="tablist"
                            >

                                {tabSubjects.map((subject) => (

                                    <button
                                        key={subject}
                                        type="button"
                                        onClick={() => setSelectedSubject(subject)}
                                        className={`
                                            px-3 py-1.5
                                            rounded-lg
                                            text-xs
                                            font-medium
                                            whitespace-nowrap
                                            transition-all
                                            duration-200
                                            ${selectedSubject === subject
                                                ? "bg-[#351F5B] text-white shadow-[0_4px_12px_rgba(53,31,91,0.22)]"
                                                : "text-[#49454F] hover:text-[#351F5B] hover:bg-white/70"
                                            }
    `}
                                    >
                                        {subject === "Mind" ? "Mind / Összesített" : getTabLabel(subject)}
                                    </button>

                                ))}

                            </div>


                            {/* IDŐSZAK */}
                            <div className="relative flex-shrink-0">

                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="w-full sm:w-auto pl-3 pr-8 py-2 rounded-xl bg-[#FAF8FD] border border-[#DDD4E8] text-[#351F5B] text-xs font-medium focus:ring-2 focus:ring-[#4B2A7F] focus:border-transparent outline-none cursor-pointer appearance-none transition-colors"
                                    id="timeRangeSelect"
                                >
                                    <option value="30d">
                                        Elmúlt 30 nap
                                    </option>

                                    <option value="7d">
                                        Utolsó 7 nap
                                    </option>

                                    <option value="term">
                                        Tanév eleje óta
                                    </option>
                                </select>

                                <span className="material-symbols-outlined text-[18px] text-[#49454F] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                                    expand_more
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* KPI KÁRTYÁK */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E8E3EE] border-b border-[#F0EBF5] bg-white">

                        {/* KPI 1 */}
                        <div className="p-6 flex flex-col justify-between hover:bg-[#FAF9FC] transition-colors">

                            <div className="flex items-center gap-1.5 text-[#7B7580] mb-2">

                                <span className="material-symbols-outlined text-[16px] text-[#49454F]">
                                    monetization_on
                                </span>

                                <span className="text-[11px] leading-[14px] uppercase tracking-wider font-semibold text-[#49454F]">
                                    Pontszám (XP)
                                </span>

                            </div>

                            <div className="flex items-center justify-between mt-1">

                                <span
                                    className="text-[36px] leading-10 text-[#351F5B] font-bold tracking-tight"
                                    id="kpiScore"
                                >
                                    {kpiXpText}
                                </span>

                                

                            </div>

                        </div>


                        {/* KPI 2 */}
                        <div className="p-6 flex flex-col justify-between hover:bg-[#FAF9FC] transition-colors">

                            <div className="flex items-center gap-1.5 text-[#7B7580] mb-2">

                                <span className="material-symbols-outlined text-[16px] text-[#49454F]">
                                    shopping_cart
                                </span>

                                <span className="text-[11px] leading-[14px] uppercase tracking-wider font-semibold text-[#49454F]">
                                    Megoldott feladat
                                </span>

                            </div>

                            <div className="flex items-center justify-between mt-1">

                                <span
                                    className="text-[36px] leading-10 text-[#351F5B] font-bold tracking-tight"
                                    id="kpiTasks"
                                >
                                    {kpiTasksText}
                                </span>

                                

                            </div>

                        </div>


                        {/* KPI 3 */}
                        <div className="p-6 flex flex-col justify-between hover:bg-[#FAF9FC] transition-colors">

                            <div className="flex items-center gap-1.5 text-[#7B7580] mb-2">

                                <span className="material-symbols-outlined text-[16px] text-[#49454F]">
                                    credit_card
                                </span>

                                <span className="text-[11px] leading-[14px] uppercase tracking-wider font-semibold text-[#49454F]">
                                    Átl. feladatidő
                                </span>

                            </div>

                            <div className="flex items-center justify-between mt-1">

                                <span
                                    className="text-[36px] leading-10 text-[#351F5B] font-bold tracking-tight"
                                    id="kpiTime"
                                >
                                    {kpiTimeText}
                                </span>

                                

                            </div>

                        </div>


                        {/* KPI 4 */}
                        <div className="p-6 flex flex-col justify-between hover:bg-[#FAF9FC] transition-colors">

                            <div className="flex items-center gap-1.5 text-[#7B7580] mb-2">

                                <span className="material-symbols-outlined text-[16px] text-[#49454F]">
                                    filter_alt
                                </span>

                                <span className="text-[11px] leading-[14px] uppercase tracking-wider font-semibold text-[#49454F]">
                                    Sikerességi ráta
                                </span>

                            </div>

                            <div className="flex items-center justify-between mt-1">

                                <span
                                    className="text-[36px] leading-10 text-[#351F5B] font-bold tracking-tight"
                                    id="kpiAccuracy"
                                >
                                    {kpiAccuracyText}
                                </span>

                                

                            </div>

                        </div>

                    </div>


                    {/* VONALDIAGRAM */}
                    <div className="p-4 sm:p-6 relative bg-white select-none">

                        <div
                            className="relative w-full h-[360px] sm:h-80 cursor-crosshair overflow-hidden"
                            id="chartContainer"
                        >

                            <svg
                                className="w-full h-full overflow-visible"
                                id="evolutionChart"
                                preserveAspectRatio="xMidYMid meet"
                                viewBox="0 0 920 280"

                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();

                                    const mouseX =
                                        ((e.clientX - rect.left) / rect.width) * 920;

                                    let closestIndex = 0;
                                    let closestDistance = Infinity;

                                    chartPoints.forEach((point, index) => {

                                        const distance = Math.abs(point.x - mouseX);

                                        if (distance < closestDistance) {
                                            closestDistance = distance;
                                            closestIndex = index;
                                        }

                                    });

                                    setHoveredPoint(closestIndex);
                                }}

                                onMouseLeave={() => setHoveredPoint(null)}
                            >

                                <defs>

                                    <linearGradient
                                        id="chartCleanGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="0%" stopColor="#6B46C1" stopOpacity="0.95" />
                                        <stop offset="30%" stopColor="#6B46C1" stopOpacity="0.50" />
                                        <stop offset="65%" stopColor="#6B46C1" stopOpacity="0.20" />
                                        <stop offset="100%" stopColor="#6B46C1" stopOpacity="0" />
                                    </linearGradient>

                                    <filter
                                        height="200%"
                                        id="dotGlow"
                                        width="200%"
                                        x="-50%"
                                        y="-50%"
                                    >
                                        <feDropShadow
                                            dx="0"
                                            dy="2"
                                            floodColor="#351F5B"
                                            floodOpacity="0.35"
                                            stdDeviation="3"
                                        />
                                    </filter>

                                </defs>


                                {/* RÁCSVONALAK */}
                                <g className="stroke-[#ECE7F2]" strokeDasharray="3 3" strokeWidth="1">
                                    {yAxis.ticks.map((t) => (
                                        <line key={t.value} x1="60" x2="900" y1={t.y} y2={t.y} />
                                    ))}
                                </g>

                                {/* Y TENGELY */}
                                <g className="fill-[#7B7580]" textAnchor="end">
                                    {yAxis.ticks.map((t) => (
                                        <text key={t.value} x="50" y={t.y + 4} fontSize="14">
                                            {t.label}
                                        </text>
                                    ))}
                                </g>


                                {/* GRADIENS TERÜLET */}
                                <path
                                    d={chartAreaPath}
                                    fill="url(#chartCleanGradient)"
                                    opacity="0.15"
                                    id="evoArea"
                                />


                                {/* DIAGRAM VONALA */}
                                <path
                                    d={chartLinePath}
                                    fill="none"
                                    stroke="#351F5B"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    id="evoLine"
                                />


                                {/* HOVER CROSSHAIR */}
                                {hoveredPoint !== null && chartPoints[hoveredPoint] && (
                                    <>
                                        {/* FÜGGŐLEGES HOVER VONAL */}
                                        <line
                                            x1={chartPoints[hoveredPoint].x}
                                            x2={chartPoints[hoveredPoint].x}
                                            y1="30"
                                            y2="240"
                                            stroke="#8C69B5"
                                            strokeDasharray="3 3"
                                            strokeWidth="1.5"
                                            className="pointer-events-none"
                                        />

                                        {/* HALO */}
                                        <circle
                                            cx={chartPoints[hoveredPoint].x}
                                            cy={chartPoints[hoveredPoint].y}
                                            r="14"
                                            fill="#6B46C1"
                                            fillOpacity="0.2"
                                            className="pointer-events-none"
                                        />

                                        {/* AKTÍV PONT */}
                                        <circle
                                            cx={chartPoints[hoveredPoint].x}
                                            cy={chartPoints[hoveredPoint].y}
                                            r="6"
                                            fill="#351F5B"
                                            stroke="#ffffff"
                                            strokeWidth="2.5"
                                            className="pointer-events-none"
                                        />
                                    </>
                                )}


                                {/* FÓKUSZ HALO */}
                                <circle
                                    className="transition-opacity duration-150 opacity-0 pointer-events-none"
                                    cx="0"
                                    cy="0"
                                    fill="#6B46C1"
                                    fillOpacity="0.25"
                                    id="chartFocusHalo"
                                    r="14"
                                />


                                {/* FÓKUSZPONT */}
                                <circle
                                    className="transition-opacity duration-150 opacity-0 pointer-events-none"
                                    cx="0"
                                    cy="0"
                                    fill="#351F5B"
                                    filter="url(#dotGlow)"
                                    id="chartFocusDot"
                                    r="6"
                                    stroke="#ffffff"
                                    strokeWidth="2.5"
                                />


                                {/* X TENGELY */}
                                <g className="fill-[#49454F]" id="evoXAxisLabels" textAnchor="middle">
                                    {xAxis.ticks.map((t) => (
                                        <text key={t.dayIndex} x={t.x} y="268" fontSize="12">
                                            {t.label}
                                        </text>
                                    ))}
                                </g>

                            </svg>


                            {/* TOOLTIP */}
                            {hoveredPoint !== null && chartPoints[hoveredPoint] && (
                                <div
                                    className="pointer-events-none absolute p-3 rounded-xl bg-[#24123D] text-white shadow-xl z-30 font-medium min-w-[170px] border border-[#6B46C1]/40 backdrop-blur-md"
                                    style={{
                                        left: `${(chartPoints[hoveredPoint].x / 920) * 100}%`,
                                        top: `${Math.max(
                                            5,
                                            (chartPoints[hoveredPoint].y / 280) * 100 - 28
                                        )}%`,
                                        transform: "translateX(-50%)"
                                    }}
                                >
                                    {/* FEJLÉC */}
                                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                                        <span className="text-[11px] text-[#DECFF2] uppercase tracking-wider">
                                            {chartPoints[hoveredPoint].date}
                                        </span>

                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    </div>

                                    {/* ADATOK */}
                                    <div className="space-y-1">

                                        {/* Pontszám */}
                                        <div className="flex items-center justify-between gap-5 text-xs">
                                            <span className="text-white/70">
                                                Pontszám:
                                            </span>

                                            <span className="font-bold text-[#EDDCFF]">
                                                {chartPoints[hoveredPoint].score}
                                            </span>
                                        </div>

                                        {/* Megoldott feladatok */}
                                        <div className="flex items-center justify-between gap-5 text-xs">
                                            <span className="text-white/70">
                                                Megoldva:
                                            </span>

                                            <span className="font-medium text-white">
                                                {chartPoints[hoveredPoint].tasks}
                                            </span>
                                        </div>

                                        {/* Pontosság */}
                                        <div className="flex items-center justify-between gap-5 text-xs">
                                            <span className="text-white/70">
                                                Pontosság:
                                            </span>

                                            <span className="font-semibold text-emerald-300">
                                                {chartPoints[hoveredPoint].accuracy}
                                            </span>
                                        </div>

                                    </div>
                                </div>
                            )}

                        </div>

                    </div>

                </section>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">

                    {/* 3.1 KÖRCIKK DIAGRAM */}
                    <section className="lg:col-span-7 bg-white rounded-2xl border border-[#ECE7F2] p-6 shadow-sm flex flex-col justify-between">

                        <div>

                            {/* Fejléc */}
                            <div className="flex items-center justify-between mb-5">

                                <div>
                                    <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                                        Tantárgyi megoszlás
                                    </span>

                                    <h3 className="text-lg font-bold text-primary mt-0.5">
                                        Gyakorlási arányok
                                    </h3>
                                </div>

                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8FC] border border-[#ECE6F3] text-[#6F6878] text-xs">

                                    <span className="material-symbols-outlined text-[15px] text-secondary">
                                        pie_chart
                                    </span>

                                    <span>
                                        Összesen: <strong>{ totalHoursText } óra</strong>
                                    </span>

                                </div>

                            </div>


                            {/* Diagram + legenda */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-2 pb-2">

                                {/* ===================== */}
                                {/* DONUT */}
                                {/* ===================== */}

                                <div className="relative w-64 h-64 shrink-0 flex items-center justify-center">

                                    <svg
                                        className="w-full h-full overflow-visible"
                                        viewBox="0 0 300 300"
                                    >
                                        {slices.map((slice) => {

                                            const isHovered =
                                                hoveredPieSubject === slice.subject;

                                            const isActive =
                                                isHovered;

                                            const outerRadius = 130;
                                            const innerRadius = 65;

                                            const startRadians =
                                                (slice.startAngle * Math.PI) / 180;

                                            const endRadians =
                                                (slice.endAngle * Math.PI) / 180;

                                            const startOuterX =
                                                150 + outerRadius * Math.cos(startRadians);

                                            const startOuterY =
                                                150 + outerRadius * Math.sin(startRadians);

                                            const endOuterX =
                                                150 + outerRadius * Math.cos(endRadians);

                                            const endOuterY =
                                                150 + outerRadius * Math.sin(endRadians);

                                            const startInnerX =
                                                150 + innerRadius * Math.cos(startRadians);

                                            const startInnerY =
                                                150 + innerRadius * Math.sin(startRadians);

                                            const endInnerX =
                                                150 + innerRadius * Math.cos(endRadians);

                                            const endInnerY =
                                                150 + innerRadius * Math.sin(endRadians);

                                            const largeArcFlag =
                                                slice.endAngle - slice.startAngle > 180
                                                    ? 1
                                                    : 0;

                                            const path = `
                                                    M ${startOuterX} ${startOuterY}
                                                    A ${outerRadius} ${outerRadius}
                                                    0 ${largeArcFlag} 1
                                                    ${endOuterX} ${endOuterY}

                                                    L ${endInnerX} ${endInnerY}

                                                    A ${innerRadius} ${innerRadius}
                                                    0 ${largeArcFlag} 0
                                                    ${startInnerX} ${startInnerY}

                                                    Z
                                                `;

                                            return (
                                                <g
                                                    key={slice.subject}
                                                    style={{
                                                        transform: isActive
                                                            ? getSliceTransform(
                                                                slice.middleAngle,
                                                                11
                                                            )
                                                            : "translate(0, 0)",
                                                        transformOrigin: "150px 150px",
                                                        transition:
                                                            "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
                                                    }}
                                                >
                                                    <path
                                                        d={path}
                                                        fill={slice.color}
                                                        className="cursor-pointer"
                                                        style={{
                                                            opacity:
                                                                hoveredPieSubject &&
                                                                    !isHovered
                                                                    ? 0.45
                                                                    : 1,
                                                            transition: "opacity 180ms ease"
                                                        }}
                                                        onMouseEnter={() =>
                                                            setHoveredPieSubject(slice.subject)
                                                        }
                                                        onMouseLeave={() =>
                                                            setHoveredPieSubject(null)
                                                        }
                                                    />
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    {/* Középső kijelzés */}
                                    {(() => {
                                        if (pieData.length === 0) {
                                            return (
                                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                                                    <span className="text-xs text-[#817989]">Nincs adat</span>
                                                </div>
                                            );
                                        }

                                        const activePieSubject = hoveredPieSubject ?? pieData[0].subject;

                                        const selected =
                                            pieData.find((item) => item.subject === activePieSubject) ?? pieData[0];

                                        return (
                                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                                                <span className="text-[10px] uppercase tracking-wider text-[#817989] font-semibold">
                                                    Kiválasztva
                                                </span>

                                                <span className="text-sm font-bold text-primary leading-tight max-w-[120px]">
                                                    {selected.legendSubject ?? selected.subject}
                                                </span>

                                                <span className="text-lg text-secondary font-bold">
                                                    {selected.percent}%
                                                </span>
                                            </div>
                                        );
                                    })()}


                                    {/* Tooltip */}
                                    {hoveredPieSubject && (() => {

                                        const hovered =
                                            pieData.find(
                                                (item) => item.subject === hoveredPieSubject
                                            );

                                        if (!hovered) return null;

                                        return (
                                            <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs shadow-lg whitespace-nowrap z-20">

                                                <span>
                                                    {hovered.subject} · {hovered.hours}
                                                </span>

                                            </div>
                                        );

                                    })()}

                                </div>


                                {/* ===================== */}
                                {/* JELMAGYARÁZAT */}
                                {/* ===================== */}

                                <div className="flex-grow w-full space-y-2">

                                    {pieData.map((item) => {

                                        const isActive =
                                            hoveredPieSubject === item.subject;

                                        const isHovered =
                                            hoveredPieSubject === item.subject;

                                        return (
                                            <div
                                                key={item.subject}
                                                className={`group p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isActive || isHovered
                                                    ? "border-[#E8DFEF] bg-[#FAF8FC]"
                                                    : "border-transparent"
                                                    }`}
                                                onMouseEnter={() =>
                                                    setHoveredPieSubject(item.subject)
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredPieSubject(null)
                                                }
                                            >

                                                <div className="flex items-center gap-3">

                                                    <span
                                                        className="w-3.5 h-3.5 rounded-md ring-2 ring-transparent transition-all"
                                                        style={{
                                                            backgroundColor: item.color,
                                                            boxShadow:
                                                                isHovered || isActive
                                                                    ? `0 0 0 3px ${item.color}30`
                                                                    : "none"
                                                        }}
                                                    />

                                                    <div className="flex flex-col">

                                                        <span className="text-sm font-semibold text-primary">
                                                            {item.legendSubject ?? item.subject}
                                                        </span>

                                                        <span className="text-[11px] text-[#756E7E]">
                                                            {item.hours} · {item.tasks}
                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="text-right">

                                                    <span className="text-sm font-bold text-primary">
                                                        {item.percent}%
                                                    </span>

                                                    {item.change && (
                                                        <span
                                                            className={`block text-[11px] font-semibold ${item.change.startsWith("+")
                                                                ? "text-emerald-600"
                                                                : "text-[#756E7E]"
                                                                }`}
                                                        >
                                                            {item.change}
                                                        </span>
                                                    )}

                                                </div>

                                            </div>
                                        );
                                    })}

                                </div>

                            </div>

                        </div>


                        {/* Alsó tipp */}
                        <div className="mt-3 pt-3 border-t border-[#F2EDF7] flex items-center justify-between text-[11px] text-[#817989]">

                            <span className="flex items-center gap-1">

                                <span className="material-symbols-outlined text-[15px] text-secondary">
                                    info
                                </span>

                                Vidd rá a kurzort egy körcikkre a részletekhez!

                            </span>

                            

                        </div>

                    </section>

                    <section className="lg:col-span-5 bg-white rounded-2xl border border-[#ECE7F2] p-6 shadow-sm flex flex-col justify-between">

                        <div>
                            {/* Fejléc */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                                        Rendszeresség
                                    </span>

                                    <h3 className="text-lg font-semibold text-primary mt-0.5">
                                        Aktivitás
                                    </h3>
                                </div>

                                {/* Hónapváltó */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label="Előző hónap"
                                        onClick={goToPreviousMonth}
                                        className="w-7 h-7 rounded-lg bg-[#F2EFF7] flex items-center justify-center text-gray-500 hover:text-primary hover:bg-[#E8DFF3] transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            chevron_left
                                        </span>
                                    </button>

                                    <span className="text-sm font-semibold text-primary px-2 capitalize min-w-[110px] text-center">
                                        {monthName}
                                    </span>

                                    <button
                                        type="button"
                                        aria-label="Következő hónap"
                                        onClick={goToNextMonth}
                                        className="w-7 h-7 rounded-lg bg-[#F2EFF7] flex items-center justify-center text-gray-500 hover:text-primary hover:bg-[#E8DFF3] transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            chevron_right
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Napok neve */}
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-1 font-medium">
                                <div>H</div>
                                <div>K</div>
                                <div>Sze</div>
                                <div>Cs</div>
                                <div>P</div>
                                <div>Szo</div>
                                <div>V</div>
                            </div>

                            {/* Naptár */}
                            <div className="grid grid-cols-7 gap-1.5">
                                {calendarDays.map((day, index) => {
                                    if (!day) {
                                        return (
                                            <div
                                                key={`empty-${index}`}
                                                className="aspect-square rounded-lg bg-[#FAF9FB]"
                                            />
                                        );
                                    }

                                    const dateKey = getDateKey(year, month, day);
                                    const activity = calendarActivity[dateKey];

                                    const isSelected = selectedCalendarDay === day;

                                    const today = new Date();
                                    const isToday =
                                        year === today.getFullYear() &&
                                        month === today.getMonth() &&
                                        day === today.getDate();

                                    const activityClass = getActivityClass(activity?.tasks || 0);

                                    return (
                                        <button
                                            key={dateKey}
                                            type="button"
                                            onClick={() => setSelectedCalendarDay(day)}
                                            className={`
                                            relative aspect-square rounded-lg
                                            flex flex-col items-center justify-center
                                            text-xs font-medium
                                            transition-all duration-150
                                            hover:scale-105
                                            ${!activity
                                                    ? "bg-[#FAF8FC] border border-dashed border-[#DDD4E8] text-gray-400"
                                                    : activityClass
                                                }
                                                ${isSelected ? "ring-2 ring-secondary ring-offset-1" : ""}
                                                ${isToday ? "ring-2 ring-secondary" : ""}
                                                `}
                                        >
                                            <span>{day}</span>

                                            {activity && (
                                                <span
                                                    className={`
                                                            w-1 h-1 rounded-full mt-0.5
                                                            ${activity.tasks >= 40
                                                            ? "bg-[#C3A0FD]"
                                                            : activity.tasks >= 20
                                                                ? "bg-white/80"
                                                                : "bg-[#351F5B]"
                                                        }
                                                    `}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Napi részletező */}
                            {(() => {
                                const selectedDate =
                                    selectedCalendarDay
                                        ? getDateKey(year, month, selectedCalendarDay)
                                        : null;

                                const activity = selectedDate
                                    ? calendarActivity[selectedDate]
                                    : null;

                                

                                return (
                                    <div className="mt-6 p-3 rounded-xl bg-[#F7F4FA] border border-[#EBE3F2] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-[18px]">
                                                calendar_today
                                            </span>
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold text-primary truncate">
                                                {selectedCalendarDay
                                                    ? `${monthName.split(" ")[1]} ${String(
                                                        selectedCalendarDay
                                                    ).padStart(2, "0")}.`
                                                    : "Válassz egy napot"}
                                            </span>

                                            <span className="text-[11px] text-gray-500 truncate">
                                                {activity
                                                    ? `${activity.tasks} feladat · ${activity.minutes} perc`
                                                    : "Nincs aktivitási adat erre a napra"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Heatmap jelmagyarázat */}
                        <div className="mt-4 pt-4 border-t border-[#F2EDF7] flex items-center justify-between text-[11px] text-gray-400">
                            <span>Kevesebb</span>

                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-sm bg-[#F2EFF7]" />
                                <span className="w-3 h-3 rounded-sm bg-[#D3C2E8]" />
                                <span className="w-3 h-3 rounded-sm bg-[#8C69B5]" />
                                <span className="w-3 h-3 rounded-sm bg-[#351F5B]" />
                            </div>

                            <span>Több feladat (40+)</span>
                        </div>

                    </section>
                    <section className="lg:col-span-12 w-full min-w-0 bg-white rounded-2xl border border-[#ECE7F2] p-6 shadow-sm">

                        {/* FEJLÉC */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                            <div>
                                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                                    Tevékenységi napló
                                </span>

                                <h3 className="text-lg font-semibold text-primary mt-0.5">
                                    Részletes gyakorlási előzmények
                                </h3>
                            </div>


                            {/* TANTÁRGY SZŰRŐ */}
                            <div className="flex w-full sm:w-auto p-1 rounded-xl bg-[#F2EDF7] overflow-x-auto">

                                {tabSubjects.map((subject) => {
                                    const isActive = activityFilter === subject;

                                    return (
                                        <button
                                            key={subject}
                                            type="button"
                                            onClick={() => setActivityFilter(subject)}
                                            className={`
                    px-3 py-1
                    rounded-lg
                    text-xs
                    whitespace-nowrap
                    transition-all
                    duration-200
                    ${isActive
                                                    ? "bg-[#351F5B] text-white font-semibold shadow-sm"
                                                    : "text-[#756E7E] hover:text-[#351F5B]"
                                                }
                `}
                                        >
                                            {getTabLabel(subject)}
                                        </button>
                                    );
                                })}

                            </div>

                        </div>


                        {/* TEVÉKENYSÉGI LISTA */}
                        <div className="space-y-4">

                            {activityLoading && (
                                <div className="py-10 text-center text-sm text-[#817989]">Betöltés...</div>
                            )}

                            {activityError && (
                                <div className="py-4 text-center text-sm text-[#BA1A1A]">{activityError}</div>
                            )}

                            {!activityLoading && activityLogs.map((activity) => (
                                <ActivityCard
                                    key={activity.id}
                                    activity={activity}
                                    onClick={setSelectedActivity}
                                />
                            ))}

                            {!activityLoading && !activityError && activityLogs.length === 0 && (
                                <div className="py-10 text-center text-sm text-[#817989]">
                                    Ehhez a tantárgyhoz még nincs rögzített tevékenység.
                                </div>
                            )}

                        </div>


                        {/* TELJES ARCHÍVUM */}
                        {activityHasMore && (
                            <div className="mt-4 pt-3 border-t border-[#F0EBF5] text-center">
                                <button
                                    type="button"
                                    onClick={loadMoreActivities}
                                    disabled={activityLoadingMore}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-primary text-sm font-semibold hover:bg-[#F2EDF7] transition-colors disabled:opacity-50"
                                >
                                    <span>
                                        {activityLoadingMore ? "Betöltés..." : "További tevékenységek betöltése"}
                                    </span>
                                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                </button>
                            </div>
                        )}

                    </section>
                    {selectedActivity && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                            {/* háttér */}
                            <button
                                type="button"
                                aria-label="Bezárás"
                                onClick={() => setSelectedActivity(null)}
                                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                            />

                            {/* modal */}
                            <div className="
                                    relative z-10
                                    w-full max-w-lg
                                    bg-white
                                    rounded-2xl
                                    border border-[#ECE7F2]
                                    shadow-2xl
                                    p-6
                                ">

                                {/* Fejléc */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">

                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{
                                                backgroundColor: selectedActivity.iconBg,
                                                color:
                                                    selectedActivity.iconColor ||
                                                    "#FFFFFF",
                                            }}
                                        >
                                            <span className="material-symbols-outlined">
                                                {selectedActivity.icon}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                                                Tevékenység részletei
                                            </p>

                                            <h3 className="text-lg font-bold text-primary">
                                                {selectedActivity.subject}
                                            </h3>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedActivity(null)}
                                        className="
                                        w-9 h-9 rounded-lg
                                        flex items-center justify-center
                                        text-[#817989]
                                        hover:bg-[#F2EDF7]
                                        hover:text-primary
                                        transition-colors
                                    "
                                    >
                                        <span className="material-symbols-outlined">
                                            close
                                        </span>
                                    </button>
                                </div>

                                {/* Téma */}
                                <div className="mt-6">
                                    <p className="text-xs text-[#817989]">
                                        Téma
                                    </p>

                                    <p className="text-sm font-semibold text-primary mt-1">
                                        {selectedActivity.topic}
                                    </p>
                                </div>

                                {/* Szint */}
                                <div className="mt-4">
                                    <span className="
                                            inline-flex
                                            px-3 py-1
                                            rounded-lg
                                            bg-[#EFEAF6]
                                            text-[#351F5B]
                                            text-xs
                                            font-semibold
                                        ">
                                        {selectedActivity.level}
                                    </span>
                                </div>

                                {/* Statisztikák */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6">

                                    <div className="rounded-xl bg-[#FAF9FB] p-4 text-center">
                                        <p className="text-xl font-bold text-primary">
                                            {selectedActivity.accuracy}%
                                        </p>
                                        <p className="text-[11px] text-[#817989] mt-1">
                                            Pontosság
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-[#FAF9FB] p-4 text-center">
                                        <p className="text-xl font-bold text-primary">
                                            {selectedActivity.correct}
                                        </p>
                                        <p className="text-[11px] text-[#817989] mt-1">
                                            Helyes
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-[#FAF9FB] p-4 text-center">
                                        <p className="text-xl font-bold text-primary">
                                            {selectedActivity.total}
                                        </p>
                                        <p className="text-[11px] text-[#817989] mt-1">
                                            Összes
                                        </p>
                                    </div>

                                </div>

                                {/* Leírás */}
                                <div className="
                                            mt-5
                                            p-4
                                            rounded-xl
                                            bg-[#F7F4FA]
                                        ">
                                    <p className="text-sm text-[#756E7E]">
                                        {selectedActivity.description}
                                    </p>
                                </div>

                                {/* Dátum */}
                                <div className="flex items-center gap-2 mt-5 text-sm text-[#817989]">
                                    <span className="material-symbols-outlined text-[18px]">
                                        schedule
                                    </span>

                                    {selectedActivity.date}
                                </div>

                            </div>
                        </div>
                    )}



                </div>

            </div>
        </main>
    )
}

export default ProfilePage;