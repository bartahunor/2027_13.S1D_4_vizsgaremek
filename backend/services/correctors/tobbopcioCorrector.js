// correctors/tobbOpcio.js
// Egy opciós (egyetlen helyes választ elfogadó) feladat javítása.
//
// A diák válasza a kiválasztott opció indexe (egész szám), a megoldás pedig
// a helyes opció indexe szövegként, pl. ["2"]. Teljes pont vagy 0 jár.
 
/**
 * @param {number} valasz  A kiválasztott opció indexe (nem null, azt az index.js kezeli)
 * @param {{ feladatId: number, pont: number, helyesValaszok: string[]|null }} megoldas
 * @returns {{ elertPont: number, helyes: string, adottValasz: string[] }}
 */
export function javitTobbOpcio(valasz, megoldas) {
  const helyes = (megoldas.helyesValaszok ?? [])
    .map((elem) => String(elem).trim())
    .filter((elem) => elem.length > 0)
 
  if (helyes.length === 0) {
    throw new Error(`A(z) ${megoldas.feladatId} feladatnak nincs megadott helyes opciója`)
  }
 
  const adott = String(valasz).trim()
  const talalt = helyes.includes(adott)
 
  return {
    elertPont: talalt ? Number(megoldas.pont) : 0,
    adottValasz: [adott],
  }
}