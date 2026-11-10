import React from "react";
 
/**
 * Alapértelmezett státusz konfiguráció.
 * Felülírható a `statusConfig` propon keresztül.
 */
const defaultStatusConfig = {
    correct: {
        label: "Helyes",
        icon: "check_circle",
        color: "text-emerald-700",
        badge: "bg-emerald-50 border-emerald-100",
        border: "border-emerald-500",
    },
    partial: {
        label: "Részben helyes",
        icon: "pending",
        color: "text-amber-700",
        badge: "bg-amber-50 border-amber-100",
        border: "border-amber-500",
    },
    incorrect: {
        label: "Helytelen",
        icon: "cancel",
        color: "text-red-700",
        badge: "bg-red-50 border-red-100",
        border: "border-red-500",
    },
};
 
/**
 * Alapértelmezett szövegek. Felülírható a `labels` propon keresztül.
 */
const defaultQuestion = {
    id: 1,
    title: "Példa feladat",
    topic: "",
    question: "",
    userAnswer: "",
    correctAnswer: "",
    earned: 0,
    max: 0,
    explanation: [],
}

const defaultLabels = {
    taskSuffix: ". feladat:",
    points: "pont",
    yourAnswer: "A te válaszod",
    noAnswer: "Nem adtál meg választ.",
    correctAnswer: "Helyes válasz",
    explanationToggle: "Javítási útmutató",
    explanationTitle: "Lépésről lépésre megoldás",
    empty: "Nincs megjeleníthető feladat.",
};
 
/**
 * Alapértelmezett státuszmeghatározás a pontszám alapján.
 */
const defaultGetStatus = (question) => {
    if (question.elert_pont >= question.max_pont) return "correct";
    if (question.elert_pont > 0) return "partial";
    return "incorrect";
};
 
/**
 * Egyetlen feladat kártya.
 */
function TaskCard({
    question = defaultQuestion,
    status: statusProp,
    config: configProp,
    expanded = false,
    onToggleExplanation = () => {},
    getStatus = defaultGetStatus,
    statusConfig = defaultStatusConfig,
    labels,
}) {
    const mergedLabels = { ...defaultLabels, ...labels };

    const status = statusProp ?? getStatus(question);
    const config = configProp ?? statusConfig[status] ?? defaultStatusConfig.incorrect;

    return (
        <article className="bg-white rounded-2xl border border-[#351F5B]/10 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className={`p-5 sm:p-6 border-l-4 ${config.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${config.badge} ${config.color}`}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {config.icon}
                                </span>
                                {config.label}
                            </span>
 
                            {question.temakor && (
                                <span className="text-xs text-[#8A8196]">
                                    {question.temakor}
                                </span>
                            )}
                        </div>
 
                        <h3 className="text-lg font-bold text-[#351F5B]">
                            {question.feladat_id}
                            {mergedLabels.taskSuffix} {question.title}
                        </h3>
                    </div>
 
                    <span className="font-bold text-[#351F5B] whitespace-nowrap">
                        {question.elert_pont}/{question.max_pont} {mergedLabels.points}
                    </span>
                </div>
 
                <p className="text-sm sm:text-base text-[#514760] leading-relaxed mb-5">
                    {question.kerdes}
                </p>
 
                <div className="space-y-3">
                    <div className="rounded-xl bg-[#F4F2F8] border border-[#351F5B]/10 p-4">
                        <p className="text-xs font-bold text-[#756B83] uppercase tracking-wide mb-2">
                            {mergedLabels.yourAnswer}
                        </p>
                        <p className="text-sm font-medium text-[#35284B]">
                            {question.adott_valasz || mergedLabels.noAnswer}
                        </p>
                    </div>
 
                    {status !== "correct" && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                                {mergedLabels.correctAnswer}
                            </p>
                            <p className="text-sm font-medium text-emerald-800">
                                {question.helyes_valaszok}
                            </p>
                        </div>
                    )}
                </div>
 
                {question.explanation?.length > 0 && (
                    <>
                        <button
                            type="button"
                            onClick={() => onToggleExplanation(question.feladat_id)}
                            className="mt-5 flex items-center gap-2 text-sm font-bold text-[#4B2A7F] hover:text-[#24123D] transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">
                                menu_book
                            </span>
                            {mergedLabels.explanationToggle}
                            <span
                                className={`material-symbols-outlined text-lg transition-transform ${
                                    expanded ? "rotate-180" : ""
                                }`}
                            >
                                expand_more
                            </span>
                        </button>
 
                        {expanded && (
                            <div className="mt-4 p-5 rounded-xl bg-[#F8F6FB] border border-[#351F5B]/10">
                                <h4 className="font-bold text-[#351F5B] flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined">
                                        format_list_numbered
                                    </span>
                                    {mergedLabels.explanationTitle}
                                </h4>
 
                                <div className="space-y-4">
                                    {question.explanation.map((step, index) => (
                                        <div key={index} className="flex gap-3 items-start">
                                            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#351F5B]/10 text-[#4B2A7F] flex items-center justify-center text-xs font-bold">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <p className="text-sm text-[#514760] leading-relaxed pt-1">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </article>
    );
}

export default TaskCard;