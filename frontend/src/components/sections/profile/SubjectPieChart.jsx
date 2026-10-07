import { useState } from "react";
import { getConfig, formatTime } from "./utils/profileUtils";

// ----------------- KÖR DIAGRAM ADATAINAK RENDEZÉSE ---------------- //
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

const getSliceTransform = (middleAngle, distance = 10) => {
    const radians = (middleAngle * Math.PI) / 180;

    const x = Math.cos(radians) * distance;
    const y = Math.sin(radians) * distance;

    return `translate(${x}px, ${y}px)`;
};

function SubjectPieChart({ pieStats }) {
    const [hoveredPieSubject, setHoveredPieSubject] = useState(null);

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

        const middleAngle = startAngle + angle / 2;

        currentAngle = endAngle;

        return {
            ...item,
            startAngle,
            endAngle,
            middleAngle
        };
    });

    return (
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
    );
}

export default SubjectPieChart;