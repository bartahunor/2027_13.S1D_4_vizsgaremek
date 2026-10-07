import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../../lib/apiClient";
import {
    calcTestXp,
    getTabLabel,
    getDaysSinceSchoolYearStart,
    formatCount,
    formatMinSec,
} from "./utils/profileUtils";
import {
    aggregateByBucket,
    buildChartPoints,
    buildXAxis,
    buildYAxis,
    sampleY,
    getSvgScale,
    TOOLTIP_W,
} from "./utils/progressChartUtils";

// Fejlődési analitika: szűrők + KPI kártyák + vonaldiagram
function ProgressAnalytics({ tabSubjects }) {
    const [profiltests, setProfiltests] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("Mind");
    const [timeRange, setTimeRange] = useState("30d");
    const [loadedRange, setLoadedRange] = useState("30d");
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
    const [animatedChartPoints, setAnimatedChartPoints] = useState([]);

    // Mountkor ÉS szűrő változásakor: tesztek
    useEffect(() => {
        let cancelled = false;

        const loadProfilTests = async () => {
            try {
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
            } catch (err) {
                if (cancelled) return;
                console.error("Nem sikerült betölteni a teszteket.", err);
            }
        };

        loadProfilTests();
        return () => { cancelled = true; };
    }, [selectedSubject, timeRange]);

    const buckets = useMemo(
        () => aggregateByBucket(profiltests, loadedRange),
        [profiltests, loadedRange]
    );
    const maxBucketXp = Math.max(0, ...buckets.map((b) => b.xp));

    const yAxis = buildYAxis(maxBucketXp);
    const xAxis = useMemo(() => buildXAxis(loadedRange), [loadedRange]);
    const targetPoints = useMemo(
        () => buildChartPoints(buckets, loadedRange, yAxis),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [buckets, loadedRange, yAxis.top]
    );

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

                            setChartSize((prev) =>
                                prev.width === rect.width && prev.height === rect.height
                                    ? prev
                                    : { width: rect.width, height: rect.height }
                            );

                            const { scale, offsetX } = getSvgScale(rect);
                            const mouseX = (e.clientX - rect.left - offsetX) / scale;

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
                    {hoveredPoint !== null && chartPoints[hoveredPoint] && chartSize.width > 0 && (() => {
                        const { scale, offsetX, offsetY } = getSvgScale(chartSize);
                        const p = chartPoints[hoveredPoint];

                        const px = offsetX + p.x * scale;
                        const py = offsetY + p.y * scale;

                        const margin = 4;
                        const left = Math.min(
                            Math.max(px, TOOLTIP_W / 2 + margin),
                            chartSize.width - TOOLTIP_W / 2 - margin
                        );
                        const top = Math.max(margin, py - 110);

                        return (
                            <div
                                className="pointer-events-none absolute p-3 rounded-xl bg-[#24123D] text-white shadow-xl z-30 font-medium border border-[#6B46C1]/40 backdrop-blur-md"
                                style={{
                                    width: TOOLTIP_W,
                                    left,
                                    top,
                                    transform: "translateX(-50%)",
                                }}
                            >
                                {/* FEJLÉC */}
                                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                                    <span className="text-[11px] text-[#DECFF2] uppercase tracking-wider">
                                        {p.date}
                                    </span>

                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                </div>

                                {/* ADATOK */}
                                <div className="space-y-1">

                                    {/* Pontszám */}
                                    <div className="flex items-center justify-between gap-5 text-xs">
                                        <span className="text-white/70">Pontszám:</span>
                                        <span className="font-bold text-[#EDDCFF]">{p.score}</span>
                                    </div>

                                    {/* Megoldott feladatok */}
                                    <div className="flex items-center justify-between gap-5 text-xs">
                                        <span className="text-white/70">Megoldva:</span>
                                        <span className="font-medium text-white">{p.tasks}</span>
                                    </div>

                                    {/* Pontosság */}
                                    <div className="flex items-center justify-between gap-5 text-xs">
                                        <span className="text-white/70">Pontosság:</span>
                                        <span className="font-semibold text-emerald-300">{p.accuracy}</span>
                                    </div>

                                </div>
                            </div>
                        );
                    })()}

                </div>

            </div>

        </section>
    );
}

export default ProgressAnalytics;