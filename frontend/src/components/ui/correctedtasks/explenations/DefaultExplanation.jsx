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
                    {attribution.replace(/\s+/g, " ")}{dot}
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

export default function DefaultExplanation({ forrasKep, forrasSzoveg }) {
    const hasImage = Boolean(forrasKep);
    // ugyanaz a logika, mint a DefaultSource-ban: ha van kép, a szöveg nem jelenik meg
    const hasText = !hasImage && Boolean(forrasSzoveg);

    if (!hasImage && !hasText) return null;

    return (
        <div className="rounded-lg border border-[#351F5B]/10 bg-white overflow-hidden">
            {hasImage && (
                <img
                    src={forrasKep}
                    alt="Forrás"
                    className="mx-auto max-w-full max-h-64 sm:max-h-80 w-auto object-contain p-2"
                />
            )}

            {hasText && (
                <div className="p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    <FormattedSourceText text={forrasSzoveg} />
                </div>
            )}
        </div>
    );
}