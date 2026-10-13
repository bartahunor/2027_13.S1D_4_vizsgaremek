// Jobb oldali (válasz) slot: sorba rendezős feladat (sorba_rendezos).
//
// Bemenet (task):
//   task.valaszok : ['2.', '3.', '4.', '5.']  – a sorba rendezendő elemek
//   task.id       : a keveréshez használt mag (seed)
//
// Az 1. pozíción mindig az "1." elem áll: ez nincs az adatbázisban, nem mozgatható,
// és nem része a válasznak – csak a kijelzésben szerepel (lakat ikonnal).
// A mozgatható elemek így a 2. pozíciótól kezdődnek.
//
// Érték (value): CSAK a mozgatható elemek sorrendje, tömbként, pl. ['3.', '2.', '5.', '4.']
// (az "1." nélkül). Amíg a felhasználó nem mozgat semmit, a value undefined
// (→ beküldéskor null, azaz "nem válaszolt"), a lista pedig egy feladatonként
// állandó, megkevert sorrendben jelenik meg.
//
// Kezelés: húzás (egérrel) ÉS fel/le gombok (érintőképernyő, billentyűzet).
// Külső függőség nincs. A beküldéshez külön serializer nem kell: a tömb
// az alapértelmezett serializerrel változatlanul átmegy.
//
// A görgetést a Practice jobb oldali konténere adja, ezért itt nincs saját scroll.

import { useMemo, useState } from 'react';

// Az első, rögzített elem felirata és a mozgatható elemek első pozíciója.
const FIXED_LABEL = '1.';
const FIRST_MOVABLE_POSITION = 2;

// Determinisztikus keverés: ugyanaz a feladat mindig ugyanabban a sorrendben jön,
// és biztosan nem a helyes (adatbázis szerinti) sorrendben indul.
const seededShuffle = (items, seed) => {
    let s = (Number(seed) || 1) | 0;
    const rand = () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    // Ha véletlenül az eredeti sorrend jött ki, toljuk el eggyel.
    if (arr.length > 1 && arr.every((v, i) => v === items[i])) {
        arr.push(arr.shift());
    }
    return arr;
};

function OrderedAnswer({ task, value, onChange }) {

    const items = useMemo(() => task.valaszok ?? [], [task.valaszok]);
    const initialOrder = useMemo(
        () => seededShuffle(items, task.id),
        [items, task.id]
    );

    // A mentett érték csak akkor érvényes, ha pontosan ugyanazokat az elemeket tartalmazza.
    const isValid =
        Array.isArray(value) &&
        value.length === items.length &&
        items.every((item) => value.includes(item));

    const order = isValid ? value : initialOrder;

    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);

    const moveItem = (from, to) => {
        if (from === to || to < 0 || to >= order.length) return;

        const next = [...order];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onChange(next);
    };

    const resetDrag = () => {
        setDragIndex(null);
        setOverIndex(null);
    };

    if (order.length === 0) {
        return (
            <div className="w-full min-h-[120px] flex items-center justify-center p-4 text-sm text-slate-400">
                Nincsenek rendezendő elemek
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            

            <ol className="flex flex-col gap-2">
                {/* 1. pozíció: rögzített, nem mozgatható elem */}
                <li
                    className="
                        flex items-center gap-3
                        rounded-xl
                        border border-slate-200
                        bg-slate-50
                        px-3 py-2.5
                        select-none
                    "
                    aria-label={`${FIXED_LABEL} – rögzített, nem mozgatható`}
                >
                    <span
                        className="material-symbols-outlined text-slate-300"
                        aria-hidden="true"
                    >
                        lock
                    </span>

                    <span
                        className="
                            flex h-7 w-7 shrink-0 items-center justify-center
                            rounded-full
                            bg-slate-200
                            text-xs font-bold text-slate-500
                        "
                    >
                        1
                    </span>

                    <span className="flex-grow text-base font-semibold text-slate-500 break-words">
                        {FIXED_LABEL}
                    </span>
                </li>

                {order.map((item, index) => {
                    const isDragging = dragIndex === index;
                    const isOver =
                        overIndex === index && dragIndex !== null && dragIndex !== index;

                    return (
                        <li
                            key={item}
                            draggable
                            onDragStart={(e) => {
                                setDragIndex(index);
                                e.dataTransfer.effectAllowed = 'move';
                                // Firefoxhoz kell valamilyen adat a húzáshoz.
                                e.dataTransfer.setData('text/plain', String(index));
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                if (overIndex !== index) setOverIndex(index);
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (dragIndex !== null) moveItem(dragIndex, index);
                                resetDrag();
                            }}
                            onDragEnd={resetDrag}
                            className={`
                                flex items-center gap-3
                                rounded-xl
                                border
                                bg-white
                                px-3 py-2.5
                                shadow-sm
                                cursor-grab active:cursor-grabbing
                                select-none
                                transition
                                ${isDragging ? 'opacity-40' : ''}
                                ${isOver
                                    ? 'border-primary ring-4 ring-primary/10'
                                    : 'border-slate-200 hover:border-primary/40'}
                            `}
                        >
                            {/* Húzófogantyú */}
                            <span
                                className="material-symbols-outlined text-slate-300"
                                aria-hidden="true"
                            >
                                drag_indicator
                            </span>

                            {/* Pozíció */}
                            <span
                                className="
                                    flex h-7 w-7 shrink-0 items-center justify-center
                                    rounded-full
                                    bg-primary/10
                                    text-xs font-bold text-primary
                                "
                                aria-label={`${index + FIRST_MOVABLE_POSITION}. hely`}
                            >
                                {index + FIRST_MOVABLE_POSITION}
                            </span>

                            {/* Elem */}
                            <span className="flex-grow text-base font-semibold text-slate-900 break-words">
                                {String(item)}
                            </span>

                            {/* Fel / le gombok */}
                            <div className="flex shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => moveItem(index, index - 1)}
                                    disabled={index === 0}
                                    aria-label={`${item} mozgatása feljebb`}
                                    className="
                                        p-1.5 rounded-lg
                                        text-primary
                                        bg-primary/10
                                        hover:bg-primary/20
                                        disabled:opacity-30
                                        disabled:cursor-not-allowed
                                        transition
                                    "
                                >
                                    <span className="material-symbols-outlined text-base">
                                        arrow_upward
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => moveItem(index, index + 1)}
                                    disabled={index === order.length - 1}
                                    aria-label={`${item} mozgatása lejjebb`}
                                    className="
                                        p-1.5 rounded-lg
                                        text-primary
                                        bg-primary/10
                                        hover:bg-primary/20
                                        disabled:opacity-30
                                        disabled:cursor-not-allowed
                                        transition
                                    "
                                >
                                    <span className="material-symbols-outlined text-base">
                                        arrow_downward
                                    </span>
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export default OrderedAnswer;