// Jobb oldali (válasz) slot: opciók közüli választás (negy_opcio, harom_opcio, ...).
//
// Opciók:
//   - Ha a feladatnak van `valaszok` tömbje, azokat jeleníti meg (pl. harom_opcio).
//   - Ha nincs (null / üres), az alapértelmezett A-D betűket kapja (pl. negy_opcio,
//     ahol az opciók szövege a bal oldali forrásképen van).
//
// Érték: a kiválasztott opció INDEXE (A=0, B=1, C=2, D=3), vagy undefined, ha még nincs válasz.
// Az `onChange` ezt az indexet kapja meg, így az ellenőrzés minden típusnál ugyanúgy működik.
// FIGYELEM: a 0 érvényes válasz, ezért "van-e válasz" ellenőrzésnél
// `value !== undefined` kell, nem `if (value)`.

const DEFAULT_LETTERS = ['A', 'B', 'C', 'D'];

function OptionsAnswer({ task, value, onChange }) {
    const hasCustomOptions =
        Array.isArray(task?.valaszok) && task.valaszok.length > 0;

    const options = hasCustomOptions ? task.valaszok : DEFAULT_LETTERS;

    // A rádiógombok csoportneve feladatonként egyedi.
    const groupName = `question-options-${task?.id ?? 'task'}`;

    return (
        <div className="space-y-3">
            {options.map((option, index) => (
                <label
                    key={index}
                    className="
                        flex
                        items-center
                        p-3
                        border
                        border-slate-200
                        rounded-lg
                        cursor-pointer
                        hover:bg-slate-50
                        transition-colors
                        focus-within:ring-2
                        focus-within:ring-[#351F5B]
                        focus-within:ring-offset-2
                        focus-within:ring-offset-white
                    "
                >
                    <input
                        type="radio"
                        name={groupName}
                        value={index}
                        checked={value === index}
                        onChange={() => onChange(index)}
                        className="w-4 h-4 shrink-0 accent-[#351F5B]"
                    />

                    <span className="ml-3 text-slate-900">
                        {hasCustomOptions
                            ? String(option).trim()
                            : `${option}. lehetőség`}
                    </span>
                </label>
            ))}
        </div>
    );
}

export default OptionsAnswer;