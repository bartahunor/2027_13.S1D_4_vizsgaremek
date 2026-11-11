import React from "react";

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// Több adott és/vagy több helyes válasz megjelenítése.
// A felhasználó válaszai mellett ✓/✗ jelzi, hogy benne van-e a helyes válaszok között.
export default function MultiSolution({ question, status, labels }) {
    const given = toArray(question.megjelenites.adott_valasz_szoveg);
    const correct = toArray(question.megjelenites.helyes_valasz_szoveg);
    const isRight = (a) => correct.map(String).includes(String(a));

    return (
        <div className="space-y-3">
            <div className="rounded-xl bg-[#F4F2F8] border border-[#351F5B]/10 p-4">
                <p className="text-xs font-bold text-[#756B83] uppercase tracking-wide mb-2">
                    {labels.yourAnswer}
                </p>
                {given.length ? (
                    <ul className="space-y-1">
                        {given.map((a, i) => (
                            <li key={i} className="flex gap-2 items-start text-sm font-medium text-[#35284B]">
                                <span
                                    className={`material-symbols-outlined text-base ${
                                        isRight(a) ? "text-emerald-600" : "text-red-600"
                                    }`}
                                >
                                    {isRight(a) ? "check_circle" : "cancel"}
                                </span>
                                {a}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm font-medium text-[#35284B]">{labels.noAnswer}</p>
                )}
            </div>

            {status !== "correct" && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                        {labels.correctAnswer}
                    </p>
                    <ul
                        className={`text-sm font-medium text-emerald-800 ${
                            correct.length > 1 ? "list-disc pl-5" : ""
                        }`}
                    >
                        {correct.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
}