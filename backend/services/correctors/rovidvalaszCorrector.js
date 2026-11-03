// correctors/rovidValasz.js
// Rövid szöveges válasz javítása.
//
// A megoldás (helyesValaszok) elemei "/"-jellel elválasztott elfogadott változatok,
// pl. ["népgyűlés/ecclesia"] -> "népgyűlés" és "ecclesia" is helyes.
// A válasz akkor helyes, ha valamelyik változat szóként megtalálható benne.
// Kis- és nagybetű között nem teszünk különbséget (az ékezetek számítanak).

const normalizal = (s) => s.trim().toLocaleLowerCase('hu')

const regexKarakter = /[.*+?^${}()|[\]\\]/g
const escape = (s) => s.replace(regexKarakter, '\\$&')

/**
 * @param {string} valasz  A diák válasza (nem null, azt az index.js kezeli)
 * @param {{ pont: number, helyesValaszok: string[]|null }} megoldas
 * @returns {{ elertPont: number, helyes: string, adottValasz: string[] }}
 */
export function javitRovidValasz(valasz, megoldas) {
  const elfogadott = (megoldas.helyesValaszok ?? [])
    .flatMap((elem) => String(elem).split('/'))
    .map(normalizal)
    .filter((szo) => szo.length > 0)

  if (elfogadott.length === 0) {
    throw new Error(`A(z) ${megoldas.feladatId} feladatnak nincs elfogadott megoldása`)
  }

  const szoveg = normalizal(String(valasz))

  // Egész szóként (vagy kifejezésként) keressük: a betűk/számok nem folytatódhatnak a találat két oldalán
  const talalt = elfogadott.some((szo) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${escape(szo)}(?![\\p{L}\\p{N}])`, 'u').test(szoveg),
  )

  return {
    elertPont: talalt ? Number(megoldas.pont) : 0,
    adottValasz: [String(valasz)],
  }
}