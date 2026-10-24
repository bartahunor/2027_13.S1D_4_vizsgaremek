// correctors/index.js
// Feladattípus -> javító függvény térkép és a javítás belépési pontja.
//
// Egységes kimenet minden javítótól:
//   { elertPont: number, helyes: 'helyes' | 'reszben_helyes' | 'helytelen', adottValasz: string[] }
//
// A javítók tiszta függvények (nem nyúlnak az adatbázishoz), így önmagukban tesztelhetők.

import { javitTobbOpcio } from './tobbopcioCorrector.js'
import { javitTobbValasz } from './tobbvalaszCorrector.js'
import { javitRovidValasz } from './rovidvalaszCorrector.js'
import { javitSorbaRendezos } from './sorbarendezosCorrector.js'
import { javitTablazatos } from './tablazatosfeladatCorrector.js'

export class JavitoHiba extends Error {
  constructor(message, { code = 'CORRECTOR_ERROR', cause } = {}) {
    super(message)
    this.name = 'JavitoHiba'
    this.code = code
    this.cause = cause
  }
}

// A kulcsoknak meg kell egyezniük a feladat_tipusok.nev értékeivel
const JAVITOK = {
  tobb_opcio: javitTobbOpcio,
  tobb_valasz: javitTobbValasz,
  rovid_valasz: javitRovidValasz,
  tablazatos_feladat: javitTablazatos,
  sorba_rendezos: javitSorbaRendezos,
}

/**
 * Egy feladat javítása a típusának megfelelő javítóval.
 *
 * @param {{ feladatId: number, tipus: string, pont: number, helyesValaszok: *, cellak: object[] }} megoldas
 *        A betoltMegoldasok egy eleme (az adatbázisból, megbízható)
 * @param {*} valasz  A diák válasza; undefined / null, ha nem válaszolt
 * @returns {{ elertPont: number, helyes: string, adottValasz: string[] }}
 */
export function javit(megoldas, valasz) {
  const javito = JAVITOK[megoldas.tipus]
  if (!javito) {
    throw new JavitoHiba(`Ismeretlen feladattípus: ${megoldas.tipus} (feladat ${megoldas.feladatId})`, {
      code: 'UNKNOWN_TASK_TYPE',
    })
  }

  // Hiányzó válasz: nem kell típusonként külön kezelni
  if (valasz === undefined || valasz === null) {
    return { elertPont: 0, helyes: 'helytelen', adottValasz: [] }
  }

  try {
    return javito(valasz, megoldas)
  } catch (err) {
    if (err instanceof JavitoHiba) throw err
    throw new JavitoHiba(`Hiba a(z) ${megoldas.feladatId} feladat javításakor (${megoldas.tipus})`, {
      code: 'CORRECTOR_FAILED',
      cause: err,
    })
  }
}