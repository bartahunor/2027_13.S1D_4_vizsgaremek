import React from "react";

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// Sorba rendezős feladat: a felhasználó sorrendje és a helyes sorrend,
// a felhasználó elemein jelölve, hogy a helyén van-e.
export default function OrderedSolution({ question, status, labels }) {
    const given = toArray(question.megjelenites.adott_valasz);
    const correct = toArray(question.megjelenites.helyes_valaszok);
    const inPlace = (a, i) => String(a) === String(correct[i]);

    return (
        <div className="space-y-3">
            <div className="rounded-xl bg-[#F4F2F8] border border-[#351F5B]/10 p-4">
                <p className="text-xs font-bold text-[#756B83] uppercase tracking-wide mb-2">
                    {labels.yourAnswer}
                </p>
                {given.length ? (
                    <ol className="space-y-1">
                        {given.map((a, i) => (
                            <li key={i} className="flex gap-2 items-start text-sm font-medium text-[#35284B]">
                                <span className="w-5 text-[#756B83]">{i + 2}.</span>
                                <span className="flex-1">{a}</span>
                                <span
                                    className={`material-symbols-outlined text-base ${
                                        inPlace(a, i) ? "text-emerald-600" : "text-red-600"
                                    }`}
                                >
                                    {inPlace(a, i) ? "check_circle" : "cancel"}
                                </span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-sm font-medium text-[#35284B]">{labels.noAnswer}</p>
                )}
            </div>

            {status !== "correct" && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                        {labels.correctAnswer}
                    </p>
                    <ol className="space-y-1 text-sm font-medium text-emerald-800">
                        {correct.map((a, i) => (
                            <li key={i} className="flex gap-2">
                                <span className="w-5">{i + 2}.</span>
                                {a}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}