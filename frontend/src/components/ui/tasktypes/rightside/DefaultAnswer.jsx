// Alapértelmezett jobb oldali (válasz) slot: szabad szöveges válasz.
// Minden Answer slot ugyanazt a felületet kapja: task, value, onChange.

function DefaultAnswer({ value, onChange }) {
    return (
        <div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
                Válasz
            </label>

            <textarea
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Írd ide a válaszodat..."
                className="
                    w-full
                    min-h-[160px]
                    resize-none
                    rounded-xl
                    border border-slate-200
                    p-4
                    text-sm
                    outline-none
                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/10
                "
            />

        </div>
    );
}

export default DefaultAnswer;