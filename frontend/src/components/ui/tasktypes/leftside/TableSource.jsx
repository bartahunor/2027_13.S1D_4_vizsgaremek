// Bal oldali (forrás) slot: kitöltendő táblázat (tablazatos_feladat).
//
// Bemenet (task):
//   task.oszlopok : [{ oszlop_sorszam, oszlop_nev }, ...]
//   task.cellak   : [{ sor_sorszam, oszlop_sorszam, lathato, ertek }, ...]
//   task.forras_kep_url (opcionális): a megadott információkat tartalmazó kép
//
// Cellák megjelenítése:
//   - lathato === true                       → az érték (ha null, üres cella)
//   - lathato === false ÉS ertek === null    → beírható input (ezt tölti ki a felhasználó)
//   - minden más eset (pl. lathato false, de van érték) → üres cella, az érték nem jelenik meg
//
// Érték (value): objektum, amely CSAK a kitöltendő cellák válaszait tartalmazza,
// kulcsa "<sor>-<oszlop>", pl. { "1-2": "Szerző", "2-3": "novella" }.
// Az ellenőrzésnél ugyanezt a kulcsot lehet képezni a cellákból a `cellKey` segítségével.
//
// Elrendezés:
//   - Az #source-material egyetlen görgethető konténer: felül a kép, alatta a táblázat.
//     A kép NEM zsugorodik (shrink-0), így hosszú táblázatnál is a kép az elején látszik,
//     és az egész tartalom görgethető.
//   - A táblázat fejléce sticky: görgetés közben fent marad.
//   - Teljes képernyőn (fullscreenchange figyelve) középre igazított, nagyobb betűs,
//     egységes elrendezést kapunk.

import { useEffect, useState } from 'react';

export const cellKey = (sor, oszlop) => `${sor}-${oszlop}`;

// Kitölthető-e a cella (ugyanez a szabály az ellenőrzésnél is használható).
export const isEditableCell = (cell) =>
    cell.lathato === false && cell.ertek === null;

// Egy oszlop minimális szélessége (px) – kis kijelzőn ennél keskenyebbre
// nem nyomjuk össze, inkább vízszintesen görgethető.
const MIN_COL_WIDTH = 140;

function TableSource({ task, value, onChange }) {

    // Teljes képernyős állapot figyelése (a Practice az #source-material elemet nagyítja).
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handler = () =>
            setIsFullscreen(document.fullscreenElement?.id === 'source-material');

        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const handleExitFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen?.();
        }
    };

    const columns = [...(task.oszlopok ?? [])].sort(
        (a, b) => a.oszlop_sorszam - b.oszlop_sorszam
    );
    const cells = task.cellak ?? [];

    // Sorok: a cellákban szereplő különböző sorszámok, növekvő sorrendben.
    const rowNumbers = [...new Set(cells.map((c) => c.sor_sorszam))].sort(
        (a, b) => a - b
    );

    // Gyors keresés sor/oszlop alapján.
    const cellMap = new Map(
        cells.map((c) => [cellKey(c.sor_sorszam, c.oszlop_sorszam), c])
    );

    const answers = value ?? {};

    const handleCellChange = (key, text) => {
        onChange({ ...answers, [key]: text });
    };

    const hasTable = columns.length > 0 && rowNumbers.length > 0;
    const hasImage = Boolean(task.forras_kep_url);

    return (
        <>
            {/* FORRÁSANYAG – egyetlen görgethető konténer */}
            <div
                id="source-material"
                className={`
                    relative
                    flex-1
                    min-h-[300px]
                    overflow-auto
                    bg-white
                    ${isFullscreen
                        ? 'max-h-none'
                        : 'max-h-[70vh] md:max-h-none rounded-xl border border-primary/10'}
                `}
            >
                {/* Kilépés teljes képernyőből (érintőképernyőn is használható) */}
                {isFullscreen && (
                    <button
                        type="button"
                        onClick={handleExitFullscreen}
                        aria-label="Kilépés a teljes képernyőből"
                        className="
                            fixed top-4 right-4 z-30
                            p-2
                            bg-white
                            rounded-lg
                            shadow-md
                            border border-primary/10
                            text-primary
                            hover:bg-primary
                            hover:text-white
                            transition-all
                        "
                    >
                        <span className="material-symbols-outlined text-base">
                            close
                        </span>
                    </button>
                )}

                {/* Belső elrendezés: oszlopos, egységes térközzel; teljes képernyőn középre igazítva */}
                <div
                    className={`
                        flex flex-col
                        w-full
                        ${isFullscreen
                            ? 'max-w-6xl mx-auto gap-6 p-6 sm:p-10 text-base'
                            : 'gap-4 p-3 sm:p-4 text-sm'}
                    `}
                >
                    {/* KÉP – nem zsugorodhat, a magassága korlátos, így mindig látszik */}
                    {hasImage && (
                        <div
                            className="
                                shrink-0
                                rounded-xl
                                border border-slate-200
                                bg-slate-50
                                p-2
                                flex
                                justify-center
                            "
                        >
                            <img
                                src={task.forras_kep_url}
                                alt="Forrásanyag"
                                className={`
                                    block
                                    max-w-full
                                    h-auto
                                    w-auto
                                    object-contain
                                    rounded-lg
                                    ${isFullscreen ? 'max-h-[55vh]' : 'max-h-[40vh]'}
                                `}
                            />
                        </div>
                    )}

                    {/* TÁBLÁZAT */}
                    {hasTable ? (
                        <table
                            className="w-full table-fixed border-separate border-spacing-0"
                            style={{ minWidth: columns.length * MIN_COL_WIDTH }}
                        >
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.oszlop_sorszam}
                                            className="
                                                sticky top-0 z-10
                                                bg-primary/10
                                                backdrop-blur
                                                border-y border-r border-primary/15
                                                first:border-l
                                                first:rounded-tl-lg
                                                last:rounded-tr-lg
                                                px-3 py-2.5
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wider
                                                text-primary
                                                text-left
                                                break-words
                                            "
                                        >
                                            {col.oszlop_nev}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {rowNumbers.map((sor, rowIdx) => (
                                    <tr
                                        key={sor}
                                        className="odd:bg-white even:bg-slate-50/70"
                                    >
                                        {columns.map((col, colIdx) => {
                                            const oszlop = col.oszlop_sorszam;
                                            const key = cellKey(sor, oszlop);
                                            const cell = cellMap.get(key);
                                            const editable = cell && isEditableCell(cell);
                                            const isLastRow = rowIdx === rowNumbers.length - 1;
                                            const isFirstCol = colIdx === 0;
                                            const isLastCol = colIdx === columns.length - 1;

                                            return (
                                                <td
                                                    key={key}
                                                    className={`
                                                        border-b border-r border-slate-200
                                                        ${isFirstCol ? 'border-l' : ''}
                                                        ${isLastRow && isFirstCol ? 'rounded-bl-lg' : ''}
                                                        ${isLastRow && isLastCol ? 'rounded-br-lg' : ''}
                                                        ${editable ? 'bg-primary/5' : ''}
                                                        px-3 py-2
                                                        align-middle
                                                        text-slate-900
                                                        break-words
                                                    `}
                                                >
                                                    {cell?.lathato && cell.ertek}

                                                    {editable && (
                                                        <input
                                                            type="text"
                                                            value={answers[key] ?? ''}
                                                            onChange={(e) =>
                                                                handleCellChange(key, e.target.value)
                                                            }
                                                            aria-label={`${col.oszlop_nev}, ${sor}. sor`}
                                                            className={`
                                                                w-full
                                                                rounded-lg
                                                                border border-primary/20
                                                                bg-white
                                                                px-2.5
                                                                ${isFullscreen ? 'py-2 text-base' : 'py-1.5 text-sm'}
                                                                text-slate-900
                                                                shadow-sm
                                                                outline-none
                                                                transition
                                                                focus:border-primary
                                                                focus:ring-4
                                                                focus:ring-primary/10
                                                            `}
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="w-full min-h-[120px] flex items-center justify-center p-4 text-sm text-slate-400">
                            Nincs táblázat
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default TableSource;