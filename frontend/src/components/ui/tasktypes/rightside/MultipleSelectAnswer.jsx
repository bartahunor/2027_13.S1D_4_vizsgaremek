// Jobb oldali (válasz) slot: több opció bejelölése (tobb_valasz).
//
// Opciók:
//   - A feladat `valaszok` tömbjét jeleníti meg, minden opció előtt sorszámmal (1, 2, 3, ...),
//     mert a kérdés a helyes válaszok SORSZÁMÁT kéri.
//
// Hány opciót lehet bejelölni:
//   - A kérdés szövegéből derül ki, ahol a mennyiség betűkkel van leírva
//     (pl. „Adja meg a négy helyes válasz sorszámát!" → 4).
//   - Ha a szövegben nem található ilyen mennyiség, nincs felső korlát.
//
// Érték: a kiválasztott opciók INDEXEINEK tömbje, növekvő sorrendben (0-alapú, mint a
// MultipleChoiceAnswer-nél), pl. [0, 3, 5, 7]. Ha még nincs válasz: undefined.
// Ellenőrzés: a helyes megoldást ugyanilyen, rendezett index-tömbként kell tárolni,
// és a `isMultiAnswerCorrect(value, correct)` segédfüggvénnyel összehasonlítani.
// FIGYELEM: a 0 érvényes index, ezért ne `if (value[0])`-t használj.

const NUMBER_WORDS = {
    egy: 1,
    egyet: 1,
    két: 2,
    kettő: 2,
    három: 3,
    négy: 4,
    öt: 5,
    hat: 6,
    hét: 7,
    nyolc: 8,
    kilenc: 9,
    tíz: 10,
};

// „négy helyes válasz", „két állítás", „három jó megoldás", ...
// A számnévnek egy főnév (helyes/jó/válasz/állítás/...) előtt kell állnia, így az
// általános „egy" névelő (pl. „egy forrás alapján") nem téveszti meg.
const COUNT_PATTERN = new RegExp(
    `(?<![\\p{L}])(${Object.keys(NUMBER_WORDS).join('|')})\\s+` +
        `(?:helyes|jó|igaz|megfelelő|pontos|válasz|állítás|megoldás|sorszám|lehetőség|tényező|tény)`,
    'iu'
);

// A kérdésből kiolvasott darabszám, vagy null, ha nincs megadva.
export function parseMaxSelections(question) {
    const match = typeof question === 'string' ? question.match(COUNT_PATTERN) : null;
    return match ? NUMBER_WORDS[match[1].toLowerCase()] ?? null : null;
}

// Két index-tömb egyezése sorrendtől függetlenül.
export function isMultiAnswerCorrect(value, correct) {
    if (!Array.isArray(value) || !Array.isArray(correct)) return false;
    if (value.length !== correct.length) return false;
    const sorted = [...correct].sort((a, b) => a - b);
    return [...value].sort((a, b) => a - b).every((v, i) => v === sorted[i]);
}

function MultiSelectAnswer({ task, value, onChange }) {
    const options = Array.isArray(task?.valaszok) ? task.valaszok : [];
    const selected = Array.isArray(value) ? value : [];

    const max = parseMaxSelections(task?.kerdes);
    const limitReached = max !== null && selected.length >= max;

    const groupName = `question-multi-${task?.id ?? 'task'}`;

    const toggle = (index) => {
        const next = selected.includes(index)
            ? selected.filter((i) => i !== index)
            : [...selected, index].sort((a, b) => a - b);

        // Ha nincs kijelölt opció, a válasz "nincs válasz" (undefined).
        onChange(next.length > 0 ? next : undefined);
    };

    return (
        <div className="space-y-3">
            {max !== null && (
                <p
                    className="text-sm text-slate-600"
                    aria-live="polite"
                >
                    {selected.length} / {max} kiválasztva
                </p>
            )}

            {options.map((option, index) => {
                const checked = selected.includes(index);
                // Ha elértük a korlátot, a ki nem választott opciók le vannak tiltva.
                const disabled = limitReached && !checked;

                return (
                    <label
                        key={index}
                        className={`
                            flex
                            items-start
                            p-3
                            border
                            rounded-lg
                            transition-colors
                            focus-within:ring-2
                            focus-within:ring-[#351F5B]
                            focus-within:ring-offset-2
                            focus-within:ring-offset-white
                            ${
                                disabled
                                    ? 'border-slate-200 opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer hover:bg-slate-50'
                            }
                            ${
                                checked
                                    ? 'border-[#351F5B] bg-[#351F5B]/5'
                                    : 'border-slate-200'
                            }
                        `}
                    >
                        <input
                            type="checkbox"
                            name={groupName}
                            value={index}
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggle(index)}
                            className="mt-1 w-4 h-4 shrink-0 accent-[#351F5B]"
                        />

                        <span className="ml-3 text-slate-900">
                            <span className="font-semibold mr-2">{index + 1}.</span>
                            {String(option).trim()}
                        </span>
                    </label>
                );
            })}
        </div>
    );
}

export default MultiSelectAnswer;