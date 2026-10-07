function ActivityCard({ activity, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(activity)}
            className="
                w-full text-left
                p-4 rounded-xl bg-[#FAF9FB] border border-[#ECE6F3]
                flex flex-col sm:flex-row sm:items-center sm:justify-between
                gap-4
                transition-all duration-200
                hover:border-[#D7C7E8]
                hover:shadow-sm
                hover:-translate-y-[1px]
            "
        >
            {/* BAL OLDAL */}
            <div className="flex items-center gap-4">

                {/* IKON */}
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        backgroundColor: activity.iconBg,
                        color: activity.iconColor || "#FFFFFF",
                    }}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {activity.icon}
                    </span>
                </div>

                {/* TARTALOM */}
                <div className="flex flex-col">

                    <div className="flex items-center gap-2 flex-wrap">

                        <span className="text-sm font-semibold text-primary">
                            {activity.subject} · {activity.topic}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-[#EFEAF6] text-[#351F5B] text-[11px] font-medium">
                            {activity.level}
                        </span>

                    </div>

                    <span className="text-sm text-[#756E7E] mt-0.5">
                        {activity.description}
                    </span>

                </div>

            </div>

            {/* JOBB OLDAL */}
            <div className="flex items-center gap-4 sm:justify-end">

                <div className="flex flex-col sm:text-right">

                    <span className="text-[11px] text-[#817989]">
                        {activity.date}
                    </span>

                    <span className="text-sm font-bold text-emerald-600">
                        {activity.accuracy}% pontosság{" "}
                        ({activity.correct}/{activity.total} jó)
                    </span>

                </div>

                <span className="material-symbols-outlined text-[#B8B1C0] text-[20px]">
                    chevron_right
                </span>

            </div>
        </button>
    );
}

export default ActivityCard;