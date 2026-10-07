import { useState } from "react";

const getDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const getActivityLevel = (tasks = 0) => {
    if (tasks === 0) return 0;
    if (tasks < 20) return 1;
    if (tasks < 40) return 2;
    return 3;
};

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

function ActivityCalendar({ calendarStats }) {
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date().getDate());

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

    return (
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
    );
}

export default ActivityCalendar;