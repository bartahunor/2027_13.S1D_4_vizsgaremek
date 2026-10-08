// Alapértelmezett bal oldali (forrásanyag) slot.
// Kép és/vagy szöveges forrást jelenít meg, alatta a magyarázattal.
// A `value` és `onChange` itt nem használt, de minden Source slot ugyanazt a
// felületet kapja, hogy a PracticePage egységesen tudja meghívni őket.

// Szöveges forrás formázása:
//   Tetszőleges számú „idézet ...” (Szerző, kor) pár egy szövegben.
//   → az idézet dőlt, a záró zárójeles rész új sorban, félkövéren.
// Ami nem illeszkedik a mintára (pl. "A) " előtag), változatlanul jelenik meg.
const QUOTE_PATTERN = /„([^”]*)”\s*(\([^()]*\))(\.?)/g;

function FormattedSourceText({ text }) {
    const parts = [];
    let lastIndex = 0;

    for (const match of text.matchAll(QUOTE_PATTERN)) {
        const [full, quote, attribution, dot] = match;

        // az idézet előtti szöveg (pl. "A) ", "B) ")
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        parts.push(
            <span key={match.index}>
                <em>„{quote}”</em>
                <strong className="block mt-2 mb-4 font-semibold">
                    {attribution.replace(/\s+/g, ' ')}{dot}
                </strong>
            </span>
        );

        lastIndex = match.index + full.length;
    }

    // Ha egyetlen pár sem illeszkedett, változatlanul jelenik meg
    if (parts.length === 0) return <>{text}</>;

    // az utolsó pár utáni maradék szöveg
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return <>{parts}</>;
}

function DefaultSource({ task }) {
    const hasImage = Boolean(task.forras_kep_url);
    let hasText = Boolean(task.forras_szoveg); // feltételezett mezőnév, igazítsd az adatbázishoz
    const isEmpty = !hasImage && !hasText;

    if (hasImage) hasText=false;
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