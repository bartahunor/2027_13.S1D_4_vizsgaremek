import { useEffect, useState } from "react";
import { apiFetch } from '../../lib/apiClient';

function ProfilePage() {

    const [profildata, setProfildata] = useState([]);
    const [profiltests, setProfiltests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //Fruzsi
    const [selectedSubject, setSelectedSubject] = useState("Mind");
    const [timeRange, setTimeRange] = useState("30d");
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [hoveredPieSubject, setHoveredPieSubject] = useState(null);
    const [calendarDate, setCalendarDate] = useState(new Date(2026, 4, 1));
    const [selectedCalendarDay, setSelectedCalendarDay] = useState(8);
    const [activityFilter, setActivityFilter] = useState("all");

    useEffect(() => {

        const loadProfilData = async () => {
            try {
                setLoading(true);
                const data = await apiFetch('/profilroutes/me');
                setProfildata(data);
                console.log('Beérkezett adat:', data);
            } catch (err) {
                setError("Nem sikerült betölteni az adatokat.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadProfilData();

        const loadProfilTests = async () => {
            try {
                setLoading(true);
                const data = await apiFetch('/profilroutes/me/tests');
                setProfiltests(data);
                console.log('Beérkezett adat:', data);
            } catch (err) {
                setError("Nem sikerült betölteni az adatokat.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadProfilTests();
    }, []);

    const pieData = [
        {
            subject: "Matematika",
            hours: "52 óra",
            percent: 35,
            tasks: "78 feladat",
            color: "#351F5B",
            change: "+3.8%"
        },
        {
            subject: "Magyar nyelv és irodalom",
            legendSubject: "Magyar irodalom",
            hours: "37 óra",
            percent: 25,
            tasks: "54 feladat",
            color: "#6D4DA3",
            change: "+1.5%"
        },
        {
            subject: "Történelem",
            hours: "26.5 óra",
            percent: 18,
            tasks: "38 feladat",
            color: "#916CBD",
            change: "stabil"
        },
        {
            subject: "Angol nyelv",
            hours: "21 óra",
            percent: 14,
            tasks: "29 feladat",
            color: "#B892F7",
            change: "+2.1%"
        },
        {
            subject: "Biológia",
            hours: "11.5 óra",
            percent: 8,
            tasks: "16 feladat",
            color: "#DECFF2",
            change: "új"
        }
    ];

    const activityLogs = [
        {
            id: 1,
            type: "matek",
            subject: "Matematika",
            topic: "Függvények és sorozatok",
            level: "Középszint",
            icon: "functions",
            iconBg: "#351F5B",
            description: "18 feladat megoldva · 25 perc időráfordítás",
            date: "Ma · 11:20",
            accuracy: 92,
            correct: 16,
            total: 18,
        },
        {
            id: 2,
            type: "tori",
            subject: "Történelem",
            topic: "Kiegyezés és dualizmus kora",
            level: "Emelt szint",
            icon: "history_edu",
            iconBg: "#6D4DA3",
            description: "12 forráselemző kérdés · 35 perc időráfordítás",
            date: "Ma · 09:42",
            accuracy: 85,
            correct: 10,
            total: 12,
        },
        {
            id: 3,
            type: "magyar",
            subject: "Magyar nyelv & irodalom",
            topic: "Kosztolányi novellák",
            level: "Középszint",
            icon: "menu_book",
            iconBg: "#8C69B5",
            description: "14 feladatsor · 30 perc időráfordítás",
            date: "Tegnap · 16:30",
            accuracy: 90,
            correct: 13,
            total: 14,
        },
        {
            id: 4,
            type: "angol",
            subject: "Angol nyelv",
            topic: "B2 Nyelvtan & Reading",
            level: "B2 Szint",
            icon: "translate",
            iconBg: "#B892F7",
            iconColor: "#351F5B",
            description: "22 feleletválasztós teszt · 28 perc",
            date: "Tegnap · 14:15",
            accuracy: 86,
            correct: 19,
            total: 22,
        },
        {
            id: 5,
            type: "bio",
            subject: "Biológia",
            topic: "Sejttan és genetika",
            level: "Középszint",
            icon: "biotech",
            iconBg: "#DECFF2",
            iconColor: "#351F5B",
            description: "16 tesztfeladat · 20 perc",
            date: "Máj 07 · 18:00",
            accuracy: 88,
            correct: 14,
            total: 16,
        },
    ];


    const chartPointsBySubject = {
        Mind: [
            { x: 65, y: 38, date: "Már 30.", score: "18 450 XP", tasks: "42 feladat", accuracy: "88%" },
            { x: 148, y: 54, date: "Ápr 4.", score: "19 120 XP", tasks: "44 feladat", accuracy: "89%" },
            { x: 235, y: 48, date: "Ápr 8.", score: "20 210 XP", tasks: "47 feladat", accuracy: "91%" },
            { x: 330, y: 65, date: "Ápr 12.", score: "18 980 XP", tasks: "43 feladat", accuracy: "87%" },
            { x: 420, y: 58, date: "Ápr 16.", score: "19 450 XP", tasks: "45 feladat", accuracy: "89%" },
            { x: 535, y: 102, date: "Ápr 20.", score: "16 820 XP", tasks: "34 feladat", accuracy: "80%" },
            { x: 675, y: 110, date: "Ápr 24.", score: "16 340 XP", tasks: "32 feladat", accuracy: "78%" },
            { x: 785, y: 96, date: "Ápr 27.", score: "17 240 XP", tasks: "36 feladat", accuracy: "82%" },
            { x: 872, y: 104, date: "Ápr 30.", score: "17 620 XP", tasks: "39 feladat", accuracy: "84%" }
        ],

        Matematika: [
            { x: 65, y: 90, date: "Már 30.", score: "15 200 XP", tasks: "35 feladat", accuracy: "76%" },
            { x: 148, y: 72, date: "Ápr 4.", score: "16 450 XP", tasks: "38 feladat", accuracy: "79%" },
            { x: 235, y: 84, date: "Ápr 8.", score: "15 980 XP", tasks: "36 feladat", accuracy: "77%" },
            { x: 330, y: 60, date: "Ápr 12.", score: "17 240 XP", tasks: "41 feladat", accuracy: "83%" },
            { x: 420, y: 48, date: "Ápr 16.", score: "18 120 XP", tasks: "43 feladat", accuracy: "86%" },
            { x: 535, y: 66, date: "Ápr 20.", score: "17 680 XP", tasks: "40 feladat", accuracy: "84%" },
            { x: 675, y: 42, date: "Ápr 24.", score: "18 940 XP", tasks: "45 feladat", accuracy: "89%" },
            { x: 785, y: 55, date: "Ápr 27.", score: "18 420 XP", tasks: "44 feladat", accuracy: "87%" },
            { x: 872, y: 35, date: "Ápr 30.", score: "19 350 XP", tasks: "47 feladat", accuracy: "91%" }
        ],

        Történelem: [
            { x: 65, y: 60, date: "Már 30.", score: "17 200 XP", tasks: "40 feladat", accuracy: "82%" },
            { x: 148, y: 82, date: "Ápr 4.", score: "16 340 XP", tasks: "37 feladat", accuracy: "78%" },
            { x: 235, y: 55, date: "Ápr 8.", score: "18 020 XP", tasks: "42 feladat", accuracy: "85%" },
            { x: 330, y: 72, date: "Ápr 12.", score: "17 410 XP", tasks: "39 feladat", accuracy: "81%" },
            { x: 420, y: 44, date: "Ápr 16.", score: "18 760 XP", tasks: "44 feladat", accuracy: "88%" },
            { x: 535, y: 58, date: "Ápr 20.", score: "18 120 XP", tasks: "41 feladat", accuracy: "84%" },
            { x: 675, y: 35, date: "Ápr 24.", score: "19 240 XP", tasks: "46 feladat", accuracy: "90%" },
            { x: 785, y: 48, date: "Ápr 27.", score: "18 820 XP", tasks: "43 feladat", accuracy: "87%" },
            { x: 872, y: 30, date: "Ápr 30.", score: "19 650 XP", tasks: "48 feladat", accuracy: "92%" }
        ],

        Magyar: [
            { x: 65, y: 75, date: "Már 30.", score: "16 420 XP", tasks: "37 feladat", accuracy: "79%" },
            { x: 148, y: 62, date: "Ápr 4.", score: "17 120 XP", tasks: "39 feladat", accuracy: "82%" },
            { x: 235, y: 70, date: "Ápr 8.", score: "16 780 XP", tasks: "38 feladat", accuracy: "80%" },
            { x: 330, y: 48, date: "Ápr 12.", score: "18 050 XP", tasks: "42 feladat", accuracy: "86%" },
            { x: 420, y: 58, date: "Ápr 16.", score: "17 640 XP", tasks: "40 feladat", accuracy: "84%" },
            { x: 535, y: 40, date: "Ápr 20.", score: "18 420 XP", tasks: "44 feladat", accuracy: "88%" },
            { x: 675, y: 52, date: "Ápr 24.", score: "17 980 XP", tasks: "42 feladat", accuracy: "86%" },
            { x: 785, y: 35, date: "Ápr 27.", score: "18 760 XP", tasks: "45 feladat", accuracy: "90%" },
            { x: 872, y: 45, date: "Ápr 30.", score: "18 310 XP", tasks: "43 feladat", accuracy: "88%" }
        ],

        Angol: [
            { x: 65, y: 50, date: "Már 30.", score: "18 020 XP", tasks: "41 feladat", accuracy: "86%" },
            { x: 148, y: 42, date: "Ápr 4.", score: "18 640 XP", tasks: "43 feladat", accuracy: "88%" },
            { x: 235, y: 58, date: "Ápr 8.", score: "17 920 XP", tasks: "40 feladat", accuracy: "84%" },
            { x: 330, y: 38, date: "Ápr 12.", score: "19 120 XP", tasks: "45 feladat", accuracy: "90%" },
            { x: 420, y: 30, date: "Ápr 16.", score: "19 680 XP", tasks: "47 feladat", accuracy: "92%" },
            { x: 535, y: 46, date: "Ápr 20.", score: "18 940 XP", tasks: "44 feladat", accuracy: "89%" },
            { x: 675, y: 34, date: "Ápr 24.", score: "19 420 XP", tasks: "46 feladat", accuracy: "91%" },
            { x: 785, y: 25, date: "Ápr 27.", score: "20 040 XP", tasks: "49 feladat", accuracy: "94%" },
            { x: 872, y: 32, date: "Ápr 30.", score: "19 760 XP", tasks: "48 feladat", accuracy: "93%" }
        ],

        Biológia: [
            { x: 65, y: 105, date: "Már 30.", score: "14 820 XP", tasks: "32 feladat", accuracy: "72%" },
            { x: 148, y: 88, date: "Ápr 4.", score: "15 640 XP", tasks: "35 feladat", accuracy: "75%" },
            { x: 235, y: 94, date: "Ápr 8.", score: "15 280 XP", tasks: "34 feladat", accuracy: "74%" },
            { x: 330, y: 76, date: "Ápr 12.", score: "16 120 XP", tasks: "37 feladat", accuracy: "78%" },
            { x: 420, y: 68, date: "Ápr 16.", score: "16 740 XP", tasks: "39 feladat", accuracy: "81%" },
            { x: 535, y: 82, date: "Ápr 20.", score: "16 020 XP", tasks: "36 feladat", accuracy: "77%" },
            { x: 675, y: 60, date: "Ápr 24.", score: "17 180 XP", tasks: "41 feladat", accuracy: "83%" },
            { x: 785, y: 70, date: "Ápr 27.", score: "16 860 XP", tasks: "40 feladat", accuracy: "81%" },
            { x: 872, y: 52, date: "Ápr 30.", score: "17 540 XP", tasks: "42 feladat", accuracy: "85%" }
        ]
    };

    const calendarActivity = {
        "2026-05-01": {
            logins: 3,
            tasks: 45,
            subjects: "Matek, Történelem",
            minutes: 75,
        },
        "2026-05-02": {
            logins: 2,
            tasks: 24,
            subjects: "Magyar nyelv",
            minutes: 40,
        },
        "2026-05-03": {
            logins: 1,
            tasks: 0,
            subjects: "Áttekintés",
            minutes: 10,
        },
        "2026-05-04": {
            logins: 2,
            tasks: 18,
            subjects: "Angol",
            minutes: 30,
        },
        "2026-05-05": {
            logins: 4,
            tasks: 52,
            subjects: "Matek esszék",
            minutes: 90,
        },
        "2026-05-06": {
            logins: 2,
            tasks: 30,
            subjects: "Történelem",
            minutes: 50,
        },
        "2026-05-07": {
            logins: 3,
            tasks: 28,
            subjects: "Biológia",
            minutes: 45,
        },
        "2026-05-08": {
            logins: 3,
            tasks: 36,
            subjects: "Több tantárgy",
            minutes: 65,
        },
    };

    const filteredActivityLogs =
        activityFilter === "all"
            ? activityLogs
            : activityLogs.filter(
                (activity) => activity.type === activityFilter
            );

    const plannedDays = {
        "2026-05-09": "Tervezett felkészülés: Történelem esszé",
        "2026-05-10": "Tervezett felkészülés: Matematika próbaérettségi",
        "2026-05-11": "Tervezett felkészülés: Magyar irodalom",
        "2026-05-12": "Tervezett felkészülés: Angol teszt",
        "2026-05-13": "Tervezett felkészülés",
        "2026-05-14": "Tervezett felkészülés",
    };

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

    const totalPercent = pieData.reduce(
        (sum, item) => sum + item.percent,
        0
    );

    let currentAngle = -90;

    const slices = pieData.map((item) => {
        const startAngle = currentAngle;

        const angle =
            (item.percent / totalPercent) * 360;

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

    const [animatedChartPoints, setAnimatedChartPoints] = useState(
        chartPointsBySubject.Mind
    );

    useEffect(() => {
        const targetPoints = chartPointsBySubject[selectedSubject];

        const startPoints = animatedChartPoints;

        const duration = 650;
        const startTime = performance.now();

        let animationFrame;

        const easeInOutCubic = (t) => {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const animate = (currentTime) => {
            const progress = Math.min(
                (currentTime - startTime) / duration,
                1
            );

            const eased = easeInOutCubic(progress);

            const nextPoints = targetPoints.map((target, index) => {
                const start = startPoints[index];

                return {
                    ...target,

                    x: start.x + (target.x - start.x) * eased,

                    y: start.y + (target.y - start.y) * eased
                };
            });

            setAnimatedChartPoints(nextPoints);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrame);
        };

    }, [selectedSubject]);

    const chartPoints = animatedChartPoints;

    const chartLinePath = chartPoints
        .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ");

    const chartAreaPath = `
    M ${chartPoints[0].x} 240
    ${chartPoints.map(point => `L ${point.x} ${point.y}`).join(" ")}
    L ${chartPoints[chartPoints.length - 1].x} 240
    Z
`;


    return (
        <main className="w-full max-w-7xl mx-auto px-6 pt-24 bg-transparent flex-grow">
            <div className="flex flex-col w-full pb-10">

                {/* PROFIL FEJLÉC */}
                <section className="w-full bg-white rounded-2xl border border-[#E8E3EE] shadow-sm p-6 mb-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                        {/* BAL OLDAL */}
                        <div className="flex items-center gap-6">

                            {/* AVATAR */}
                            <div className="relative">

                                <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-[#351F5B] text-white flex items-center justify-center text-2xl font-bold tracking-tight shadow-md">
                                    KD
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
                                        Kovács Dániel
                                    </h1>

                                    {/* TANULÓ */}
                                    <span className="px-2 py-0.5 rounded-full bg-[#EFEAF6] text-[#351F5B] text-[11px] leading-[14px] uppercase tracking-wider font-semibold">
                                        Tanuló
                                    </span>

                                    {/* VÉGZŐS */}
                                    <span className="px-2 py-0.5 rounded-full bg-[#F7F6F8] text-[#49454F] text-[11px] leading-[14px] font-medium">
                                        Végzős
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
                                        2025. szeptember
                                    </span>

                                    <span>
                                        óta · Cél:
                                    </span>

                                    <span className="text-[#351F5B] font-semibold">
                                        Érettségi 2026
                                    </span>

                                </p>

                            </div>

                        </div>

                        {/* JOBB OLDALI GOMBOK */}
                        <div className="flex items-center gap-2 self-start md:self-center">

                            {/* PROFIL SZERKESZTÉSE */}
                            <button
                                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7F6F8] hover:bg-[#EEEAF4] text-[#351F5B] text-sm leading-[22px] font-medium transition-all shadow-sm border border-[#E3DCED]"
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
                                Összesített teljesítmény fejlődési görbéje · 2026. tavaszi érettségi felkészülés
                            </p>
                        </div>


                        {/* SZŰRŐK */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

                            {/* TANTÁRGYVÁLASZTÓ */}
                            <div
                                className="flex items-center gap-1 p-1 bg-[#F1ECF7] rounded-xl overflow-x-auto shadow-inner"
                                id="subjectEvolutionTabs"
                                role="tablist"
                            >

                                {[
                                    "Mind",
                                    "Matematika",
                                    "Történelem",
                                    "Magyar",
                                    "Angol",
                                    "Biológia"
                                ].map((subject) => (

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
                                        {subject === "Mind"
                                            ? "Mind / Összesített"
                                            : subject === "Magyar"
                                                ? "Magyar nyelv és irodalom"
                                                : subject === "Angol"
                                                    ? "Angol nyelv"
                                                    : subject
                                        }
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
                                    2,480
                                </span>

                                <span
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200"
                                    id="kpiScoreBadge"
                                >
                                    <span className="material-symbols-outlined text-[13px] font-bold">
                                        arrow_upward
                                    </span>

                                    <span id="kpiScoreTrend">
                                        1.9%
                                    </span>
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
                                    5.14K
                                </span>

                                <span
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200"
                                    id="kpiTasksBadge"
                                >
                                    <span className="material-symbols-outlined text-[13px] font-bold">
                                        arrow_upward
                                    </span>

                                    <span id="kpiTasksTrend">
                                        46.2%
                                    </span>
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
                                    1:21
                                </span>

                                <span
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold text-[#BA1A1A] bg-[#FFDAD6]/60 border border-[#FFDAD6]"
                                    id="kpiTimeBadge"
                                >
                                    <span className="material-symbols-outlined text-[13px] font-bold">
                                        arrow_downward
                                    </span>

                                    <span id="kpiTimeTrend">
                                        30.3%
                                    </span>
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
                                    82.93%
                                </span>

                                <span
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold text-[#BA1A1A] bg-[#FFDAD6]/60 border border-[#FFDAD6]"
                                    id="kpiAccuracyBadge"
                                >
                                    <span className="material-symbols-outlined text-[13px] font-bold">
                                        arrow_downward
                                    </span>

                                    <span id="kpiAccuracyTrend">
                                        21.7%
                                    </span>
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* VONALDIAGRAM */}
                    <div className="p-6 relative bg-white select-none">

                        <div
                            className="relative w-full h-72 sm:h-80 cursor-crosshair"
                            id="chartContainer"
                        >

                            <svg
                                className="w-full h-full overflow-visible"
                                id="evolutionChart"
                                preserveAspectRatio="none"
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
                                <g
                                    className="stroke-[#ECE7F2]"
                                    strokeDasharray="3 3"
                                    strokeWidth="1"
                                >
                                    <line x1="60" x2="900" y1="30" y2="30" />
                                    <line x1="60" x2="900" y1="72" y2="72" />
                                    <line x1="60" x2="900" y1="114" y2="114" />
                                    <line x1="60" x2="900" y1="156" y2="156" />
                                    <line x1="60" x2="900" y1="198" y2="198" />
                                    <line x1="60" x2="900" y1="240" y2="240" />
                                </g>


                                {/* Y TENGELY */}
                                <g
                                    className="fill-[#7B7580]"
                                    textAnchor="end"
                                >
                                    <text x="50" y="34">25k</text>
                                    <text x="50" y="76">20k</text>
                                    <text x="50" y="118">15k</text>
                                    <text x="50" y="160">10k</text>
                                    <text x="50" y="202">5k</text>
                                    <text x="50" y="244">0</text>
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
                                {hoveredPoint !== null && (
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
                                <g
                                    className="fill-[#49454F]"
                                    id="evoXAxisLabels"
                                    textAnchor="middle"
                                >
                                    <text x="65" y="268">Mar 30</text>
                                    <text x="200" y="268">Apr 4</text>
                                    <text x="340" y="268">Apr 9</text>
                                    <text x="485" y="268">Apr 14</text>
                                    <text x="625" y="268">Apr 19</text>
                                    <text x="755" y="268">Apr 24</text>
                                    <text x="870" y="268">Apr 29</text>
                                </g>

                            </svg>


                            {/* TOOLTIP */}
                            {hoveredPoint !== null && (
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
                                        Összesen: <strong>148 óra</strong>
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
                                        const activePieSubject =
                                            hoveredPieSubject ?? "Matematika";;

                                        const selected =
                                            pieData.find(
                                                (item) => item.subject === activePieSubject
                                            ) ?? pieData[0];

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
                                                    {hovered.subject} · {hovered.hours} · {hovered.percent}
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
                                                key={item.id}
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

                                                    <span
                                                        className={`block text-[11px] font-semibold ${item.change.startsWith("+")
                                                            ? "text-emerald-600"
                                                            : "text-[#756E7E]"
                                                            }`}
                                                    >
                                                        {item.change}
                                                    </span>

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

                            <span className="font-semibold text-primary">
                                Legaktívabb: Matematika
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
                                        Mini Naptár &amp; Belépések
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
                                    const planned = plannedDays[dateKey];

                                    const isSelected = selectedCalendarDay === day;

                                    const isToday =
                                        year === 2026 &&
                                        month === 4 &&
                                        day === 8;

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
              ${planned && !activity
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

                                const planned = selectedDate
                                    ? plannedDays[selectedDate]
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
                                                    ? `${activity.logins} belépés · ${activity.tasks} feladat · ${activity.minutes} perc`
                                                    : planned
                                                        ? planned
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

                    

                </div>

            </div>
        </main>
    )
}

export default ProfilePage;

