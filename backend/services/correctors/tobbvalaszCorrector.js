// correctors/tobbValasz.js
// Több helyes választ elfogadó feladat javítása.
//
// A diák válasza a kijelölt opciók indexeinek tömbje (pl. [1, 4, 6, 8]), a megoldás pedig
// a helyes opciók indexei szövegként, pl. ["1","4","6","8"]. A sorrend nem számít.
// Minden jól kijelölt opcióért 1 pont jár, a rossz kijelölés nem von le pontot.
// Az elért pont legfeljebb a feladat pontszáma lehet.

/**
 * @param {number[]} valasz  A kijelölt opciók indexei (nem null, azt az index.js kezeli)
 * @param {{ feladatId: number, pont: number, helyesValaszok: string[]|null }} megoldas
 * @returns {{ elertPont: number, adottValasz: string[] }}
 */
export function javitTobbValasz(valasz, megoldas) {
  const helyes = new Set(
    (megoldas.helyesValaszok ?? []).map((elem) => String(elem).trim()).filter((elem) => elem.length > 0),
  )

  if (helyes.size === 0) {
    throw new Error(`A(z) ${megoldas.feladatId} feladatnak nincs megadott helyes opciója`)
  }

  // Növekvő sorrendbe rendezett szövegek: egységes mentett forma, a duplikátumok kiesnek
  const adott = [...new Set(valasz.map((index) => String(index).trim()))]
    .sort((a, b) => Number(a) - Number(b))

  const joKijelolesek = adott.filter((index) => helyes.has(index)).length

  return {
    elertPont: Math.min(joKijelolesek, Number(megoldas.pont)),
    adottValasz: adott,
  }
}