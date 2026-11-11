import React from "react";

const parse = (v) => {
    if (typeof v !== "string") return v;
    try { return JSON.parse(v); } catch { return null; }
};

const norm = (s) => String(s ?? "").trim().toLowerCase();

// A helyes érték több elfogadott változatot is tartalmazhat "/" jellel elválasztva.
const isRight = (given, correct) =>
    norm(given) !== "" && norm(correct).split("/").map(norm).includes(norm(given));

export default function TableSolution({ question, labels }) {
    const { cellak = [], megoldasok = [], oszlopok = [] } = question.tablazat ?? {};

    // "sor-oszlop" -> adott válasz / helyes érték
    const answers = {};
    (question.adott_valasz ?? []).map(parse).forEach((a) => {
        if (a) answers[`${a.sor}-${a.oszlop}`] = a.valasz;
    });
    const solutions = {};
    megoldasok.forEach((m) => {
        solutions[`${m.sor_sorszam}-${m.oszlop_sorszam}`] = m.helyes_ertek;
    });

    // Sorok összeállítása sorszám szerint
    const rows = {};
    cellak.forEach((c) => {
        (rows[c.sor_sorszam] ??= {})[c.oszlop_sorszam] = c;
    });
    const cols = [...oszlopok].sort((a, b) => a.oszlop_sorszam - b.oszlop_sorszam);

    const renderCell = (c, key) => {
        if (c?.lathato !== false) return c?.ertek;

        const given = answers[key];
        const correct = solutions[key];
        const ok = isRight(given, correct);

        return (
            <div className="space-y-1">
                <div className="flex gap-2 items-start">
                    <span
                        className={`material-symbols-outlined text-base ${
                            ok ? "text-emerald-600" : "text-red-600"
                        }`}
                    >
                        {ok ? "check_circle" : "cancel"}
                    </span>
                    <span className={given ? "" : "italic text-[#756B83]"}>
                        {given || labels.noAnswer}
                    </span>
                </div>
                {!ok && (
                    <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                        {labels.correctAnswer}: {correct}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-[#351F5B]/10">
            <table className="w-full text-sm text-left text-[#35284B]">
                <thead className="bg-[#F4F2F8] text-xs font-bold text-[#756B83] uppercase tracking-wide">
                    <tr>
                        {cols.map((o) => (
                            <th key={o.oszlop_sorszam} className="px-4 py-3">{o.oszlop_nev}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(rows)
                        .sort((a, b) => a - b)
                        .map((r) => (
                            <tr key={r} className="border-t border-[#351F5B]/10">
                                {cols.map((o) => (
                                    <td key={o.oszlop_sorszam} className="px-4 py-3 align-top font-medium">
                                        {renderCell(rows[r][o.oszlop_sorszam], `${r}-${o.oszlop_sorszam}`)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}