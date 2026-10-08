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

export const cellKey = (sor, oszlop) => `${sor}-${oszlop}`;

// Kitölthető-e a cella (ugyanez a szabály az ellenőrzésnél is használható).
export const isEditableCell = (cell) =>
    cell.lathato === false && cell.ertek === null;

function TableSource({ task, value, onChange }) {
    
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
                

                {hasTable ? (
                    <div className="p-4">
                        <table className="w-full table-fixed border-collapse">
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.oszlop_sorszam}
                                            className="
                                                border
                                                border-primary/10
                                                bg-primary/10
                                                p-2
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wider
                                                text-primary
                                                text-left
                                            "
                                        >
                                            {col.oszlop_nev}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {rowNumbers.map((sor) => (
                                    <tr key={sor}>
                                        {columns.map((col) => {
                                            const oszlop = col.oszlop_sorszam;
                                            const cell = cellMap.get(cellKey(sor, oszlop));
                                            const key = cellKey(sor, oszlop);

                                            return (
                                                <td
                                                    key={key}
                                                    className="
                                                        border
                                                        border-slate-200
                                                        p-2
                                                        align-middle
                                                        text-sm
                                                        text-slate-900
                                                        break-words
                                                    "
                                                >
                                                    {cell?.lathato && cell.ertek}

                                                    {cell && isEditableCell(cell) && (
                                                        <input
                                                            type="text"
                                                            value={answers[key] ?? ''}
                                                            onChange={(e) =>
                                                                handleCellChange(key, e.target.value)
                                                            }
                                                            aria-label={`${col.oszlop_nev}, ${sor}. sor`}
                                                            className="
                                                                w-full
                                                                rounded-lg
                                                                border border-slate-200
                                                                bg-white
                                                                px-2 py-1.5
                                                                text-sm
                                                                text-slate-900
                                                                outline-none
                                                                focus:border-primary
                                                                focus:ring-4
                                                                focus:ring-primary/10
                                                            "
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="w-full flex-grow flex items-center justify-center p-4 text-sm text-slate-400">
                        Nincs táblázat
                    </div>
                )}
            </div>

           
        </>
    );
}

export default TableSource;