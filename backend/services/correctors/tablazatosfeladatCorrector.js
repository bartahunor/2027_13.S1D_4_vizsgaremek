/**
 * Javító függvény (még nincs megírva).
 *
 * @param {*}      valasz   A diák válasza (nem null, a hiányzó választ az index.js kezeli)
 * @param {object} megoldas { feladatId, tipus, pont, helyesValaszok, cellak }
 * @returns {{ elertPont: number, helyes: string, adottValasz: string[] }}
 */
export function javitTablazatos(valasz, megoldas) {
  throw new Error('javitTablazatos: még nincs implementálva')
}

// ADATBÁZISBA EGY JSON TÖMB MEGY A MEGOLDÁSOKRÓL PL: [{"sor":2,"oszlop":3,"valasz":"42"},{"sor":2,"oszlop":4,"valasz":"x²"}]