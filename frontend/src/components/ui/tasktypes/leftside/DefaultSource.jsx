// Alapértelmezett bal oldali (forrásanyag) slot.
// Kép és/vagy szöveges forrást jelenít meg, alatta a magyarázattal.
// A `value` és `onChange` itt nem használt, de minden Source slot ugyanazt a
// felületet kapja, hogy a PracticePage egységesen tudja meghívni őket.

// Szöveges forrás formázása:
//   A) „idézet ...” (Szerző, kor)
//   → az idézet dőlt, a záró zárójeles rész új sorban, félkövéren.
// Ha a szöveg nem ilyen alakú, változatlanul jelenik meg.
function FormattedSourceText({ text }) {
    const match = text.match(/^([\s\S]*?)(„[\s\S]*”)\s*(\([^()]*\)\.?)\s*$/);

    if (!match) return <>{text}</>;

    const [, prefix, quote, attribution] = match;

    return (
        <>
            {prefix}
            <em>{quote}</em>
            <strong className="block mt-2 font-semibold">
                {attribution.replace(/\s+/g, ' ')}
            </strong>
        </>
    );
}

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
                    align-center
                    justify-center
                    
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
                    <div className="p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                        <FormattedSourceText text={task.forras_szoveg} />
                    </div>
                )}

                {isEmpty && (
                    <div className="w-full flex-grow flex items-center justify-center text-sm text-slate-400">
                        Nincs forrásanyag
                    </div>
                )}
            </div>

            
        </>
    );
}

export default DefaultSource;