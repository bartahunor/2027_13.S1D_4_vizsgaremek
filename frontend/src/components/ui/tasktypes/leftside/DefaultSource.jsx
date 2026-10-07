// Alapértelmezett bal oldali (forrásanyag) slot.
// Kép és/vagy szöveges forrást jelenít meg, alatta a magyarázattal.
// A `value` és `onChange` itt nem használt, de minden Source slot ugyanazt a
// felületet kapja, hogy a PracticePage egységesen tudja meghívni őket.

function DefaultSource({ task }) {
    const hasImage = Boolean(task.forras_kep_url);
    const hasText = Boolean(task.forras_szoveg); // feltételezett mezőnév, igazítsd az adatbázishoz
    const isEmpty = !hasImage && !hasText;

    return (
        <>
            {/* FORRÁSANYAG */}
            <div
                id="source-material"
                className="
                    flex-grow
                    min-h-[300px]
                    rounded-xl
                    overflow-auto
                    border border-primary/10
                    bg-white
                    flex flex-col
                "
            >
                {hasImage && (
                    <img
                        src={task.forras_kep_url}
                        alt="Forrásanyag"
                        className="w-full flex-grow min-h-0 object-contain p-2"
                    />
                )}

                {hasText && (
                    <p className="p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                        {task.forras_szoveg}
                    </p>
                )}

                {isEmpty && (
                    <div className="w-full flex-grow flex items-center justify-center text-sm text-slate-400">
                        Nincs forrásanyag
                    </div>
                )}
            </div>

            {task.forras_magyarazat && (
                <p className="mt-4 text-xs text-slate-500 italic">
                    {task.forras_magyarazat}
                </p>
            )}
        </>
    );
}

export default DefaultSource;