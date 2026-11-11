import React from 'react';

export default function DefaultSolution({ question, labels }) {
    return (
        <div className="space-y-3">
            <div className="rounded-xl bg-[#F4F2F8] border border-[#351F5B]/10 p-4">
                <p className="text-xs font-bold text-[#756B83] uppercase tracking-wide mb-2">
                    {labels.yourAnswer}
                </p>
                <p className="text-sm font-medium text-[#35284B]">
                    {question.adott_valasz || labels.noAnswer}
                </p>
            </div>
 
            {status !== "correct" && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                        {labels.correctAnswer}
                    </p>
                    <p className="text-sm font-medium text-emerald-800">
                        {question.helyes_valaszok}
                    </p>
                </div>
            )}
        </div>
    )
}