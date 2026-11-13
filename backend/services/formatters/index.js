import fallback from './fallback.js'
import formatterOne from './formatterOne.js'
import formatterTwo from './formatterTwo.js'

// típus neve (kisbetűsítve) -> formázó függvény
// Új típusnál: importáld a formázót, és vedd fel ide egy sorban.
const REGISTRY = {
    'rovid_valasz': fallback,
    'tobb_valasz': formatterOne,
    'tobb_opcio': formatterOne,
    'sorba_rendezos': formatterTwo,
    'tablazatos_feladat': formatterTwo
}

function kulcs(tipus) {
  return typeof tipus === 'string' ? tipus.trim().toLowerCase() : null
}

/**
 * Egy feladatot megjelenítésre kész alakra hoz.
 * @param feladat   a lekérdezés egy sora
 * @param kontextus további adatok (később: táblázatos oszlopok/cellák)
 */
export function formatTask(feladat, kontextus = {}) {
  const formazo = REGISTRY[kulcs(feladat.tipus)] ?? fallback

  let megjelenites
  try {
    megjelenites = formazo(feladat, kontextus)
  } catch (err) {
    console.error(`Formázási hiba (feladat ${feladat.feladat_id}, típus ${feladat.tipus}):`, err)
    megjelenites = fallback(feladat, kontextus)
  }

  return {
    // közös burkoló: minden típusnál ugyanez
    feladat_id: feladat.feladat_id,
    kerdes: feladat.kerdes,
    tipus: feladat.tipus,
    temakor_id: feladat.temakor_id,
    temakor: feladat.temakor,
    elert_pont: feladat.elert_pont,
    max_pont: feladat.max_pont,
    forras:
      feladat.forras_szoveg || feladat.forras_kep
        ? { szoveg: feladat.forras_szoveg, kep: feladat.forras_kep }
        : null,

    // régi mezők egyelőre megmaradnak, hogy a frontend ne törjön el
    adott_valasz: feladat.adott_valasz,
    helyes_valaszok: feladat.helyes_valaszok,

    // típusspecifikus, megjelenítésre kész blokk
    megjelenites,
  }
}