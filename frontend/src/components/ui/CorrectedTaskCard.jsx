import React, { useState, useEffect } from "react";
import { taskTypes, fallbackType } from "./correctedtasks/correctedtasks.js";
import { getForrasKepUrl } from "../../lib/supabaseStorage";

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

const defaultQuestion = {
    feladat_id: 1,
    tipus: "",
    title: "Példa feladat",
    temakor: "",
    kerdes: "",
    adott_valasz: "",
    helyes_valaszok: "",
    elert_pont: 0,
    max_pont: 0,
    explanation: [],
};

const defaultLabels = {
    taskSuffix: ". feladat:",
    points: "pont",
    yourAnswer: "A te válaszod",
    noAnswer: "Nem adtál meg választ.",
    correctAnswer: "Helyes válasz",
    explanationToggle: "Javítási útmutató",
    explanationTitle: "Lépésről lépésre megoldás",
};

const defaultGetStatus = (q) => {
    if (q.elert_pont >= q.max_pont) return "correct";
    if (q.elert_pont > 0) return "partial";
    return "incorrect";
};

function TaskCard({
    question = defaultQuestion,
    number,
    status: statusProp,
    config: configProp,
    expandable = true,
    expanded = false,
    onToggleExplanation = () => {},
    getStatus = defaultGetStatus,
    statusConfig = defaultStatusConfig,
    labels,
}) {
    const mergedLabels = { ...defaultLabels, ...labels };
    const status = statusProp ?? getStatus(question);
    const config = configProp ?? statusConfig[status] ?? defaultStatusConfig.incorrect;

    // A feladat típusa dönti el, melyik komponensek jelennek meg
    const { Solution, Explanation } = taskTypes[question.tipus] ?? fallbackType;
    const [forrasKepUrl, setForrasKepUrl] = useState(null);

    useEffect(() => {
        let cancelled = false;

        if (!question.forras.kep) {
            setForrasKepUrl(null);
            return;
        }

        getForrasKepUrl(question.forras.kep).then((url) => {
            if (!cancelled) setForrasKepUrl(url);
        });

        return () => {
            cancelled = true;
        };
    }, [question.forras.kep]);



    return (
        <article className="bg-white rounded-2xl border border-[#351F5B]/10 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className={`p-5 sm:p-6 border-l-4 ${config.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${config.badge} ${config.color}`}
                            >
                                <span className="material-symbols-outlined text-sm">{config.icon}</span>
                                {config.label}
                            </span>
                            {question.temakor && (
                                <span className="text-xs text-[#8A8196]">{question.temakor}</span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-[#351F5B]">
                            {number}
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

                {Solution && (
                    <Solution question={question} status={status} labels={mergedLabels} />
                )}

                {expandable && (
                    <button
                        onClick={onToggleExplanation}
                        className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#351F5B]"
                    >
                        {expanded ? "Kiegészítés elrejtése" : "Kiegészítés megtekintése"}
                        <span className="material-symbols-outlined text-base">
                            {expanded ? "expand_less" : "expand_more"}
                        </span>
                    </button>
                )}

                {expandable && expanded && (
                    <div className="mt-3 rounded-xl bg-[#F4F2F8] p-4 text-sm text-[#35284B]">
                        {Explanation && (
                            <Explanation
                                question={question}
                                forrasKep={forrasKepUrl}
                                forrasSzoveg={question.forras.szoveg}
                                magyarazat={question.magyarazat}
                                labels={mergedLabels}
                            />
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

export default TaskCard;