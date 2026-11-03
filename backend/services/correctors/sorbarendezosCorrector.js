// correctors/sorbaRendezos.js
// Sorba rendezős feladat javítása.
//
// A diák válasza a tételek jelölése az általa beállított sorrendben (pl. ["2.", "3.", "1."]),
// a megoldás ugyanilyen formában a helyes sorrend (pl. ["2.", "1.", "3."]).
// Minden elemért 1 pont jár, ha a megoldáshoz képest a helyes helyen áll.
// Az elért pont legfeljebb a feladat pontszáma lehet.

/**
 * @param {string[]} valasz  A diák sorrendje (nem null, azt az index.js kezeli)
 * @param {{ feladatId: number, pont: number, helyesValaszok: string[]|null }} megoldas
 * @returns {{ elertPont: number, adottValasz: string[] }}
 */
export function javitSorbaRendezos(valasz, megoldas) {
  const helyesSorrend = (megoldas.helyesValaszok ?? []).map((elem) => String(elem).trim())

  if (helyesSorrend.length === 0) {
    throw new Error(`A(z) ${megoldas.feladatId} feladatnak nincs megadott helyes sorrendje`)
  }

  const adott = valasz.map((elem) => String(elem))

  // Pozíciónként összevetjük: a hiányzó vagy felesleges elemek nem kapnak pontot
  const helyenLevok = helyesSorrend.filter((elem, index) => adott[index]?.trim() === elem).length

  return {
    elertPont: Math.min(helyenLevok, Number(megoldas.pont)),
    adottValasz: adott,
  }
}