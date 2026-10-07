import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/apiClient";
import ActivityCard from "./ActivityCard";
import { getConfig, getTabLabel, formatTime, LEVEL_LABELS } from "./utils/profileUtils";

// ----------------- TEVÉKENYSÉGI NAPLÓ SEGÉDFÜGGVÉNYEI ---------------- //
const ACTIVITY_PAGE_SIZE = 5;

const fetchActivities = (tantargy, offset) => {
    const params = new URLSearchParams({ limit: ACTIVITY_PAGE_SIZE, offset });
    if (tantargy) params.append("tantargy", tantargy);

    return apiFetch(`/profilroutes/me/activities?${params}`);
};

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

function ActivityLog({ tabSubjects }) {
    const [activityFilter, setActivityFilter] = useState("Mind");
    const [activityItems, setActivityItems] = useState([]);
    const [activityHasMore, setActivityHasMore] = useState(false);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityLoadingMore, setActivityLoadingMore] = useState(false);
    const [activityError, setActivityError] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);

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

    const activityLogs = activityItems.map(mapActivity);

    return (
        <>
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
        </>
    );
}

export default ActivityLog;