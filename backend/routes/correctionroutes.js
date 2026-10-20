import express from 'express'
import sql from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

/* =========================
   VÉDETT API VÉGPONTOK - csak bejelentkezve érhetők el
========================= */

router.use(requireAuth)

/* =========================
   Korlátok
========================= */

const MAX_FELADAT = 100   // egy beadásban legfeljebb ennyi feladat
const MAX_CELLA = 200     // egy táblázatos feladatban legfeljebb ennyi cella
const MAX_ELEM = 50       // sorba rendezős válasz max. hossza
const MAX_SZOVEG = 500    // egy szöveges válasz max. hossza
const MAX_ROVID = 300        // rövid szöveges válasz max. hossza
const MAX_VALASZTAS = 20     // több válaszos feladatban max. kiválasztott opció
const MAX_IDO_MASODPERC = 24 * 60 * 60  // a beadáshoz tartozó idő max. 24 óra (másodpercben)

const TIPUSOK = new Set([
  'tobb_opcio',
  'tobb_valasz',
  'rovid_valasz',
  'tablazatos_feladat',
  'sorba_rendezos',
])

const pozitivEgesz = (v) => Number.isInteger(v) && v > 0

/* =========================
   Validáció
   Mindegyik függvény hibaüzenetet (string) ad vissza, vagy null-t, ha minden rendben.
========================= */

function validalTobbOpcio(valasz) {
  if (valasz === null) return null
  if (!Number.isInteger(valasz) || valasz < 0) {
    return 'a válasz egész szám vagy null lehet'
  }
  return null
}

function validalTablazatos(valasz) {
  if (!Array.isArray(valasz)) return 'a válasz tömb kell legyen'
  if (valasz.length > MAX_CELLA) return `legfeljebb ${MAX_CELLA} cella engedélyezett`

  const lattCellak = new Set()

  for (let i = 0; i < valasz.length; i++) {
    const cella = valasz[i]

    if (typeof cella !== 'object' || cella === null || Array.isArray(cella)) {
      return `cella[${i}]: érvénytelen elem`
    }
    if (!pozitivEgesz(cella.sor_sorszam) || !pozitivEgesz(cella.oszlop_sorszam)) {
      return `cella[${i}]: érvénytelen sor- vagy oszlopsorszám`
    }

    const kulcs = `${cella.sor_sorszam}:${cella.oszlop_sorszam}`
    if (lattCellak.has(kulcs)) return `cella[${i}]: duplikált cella (${kulcs})`
    lattCellak.add(kulcs)

    const v = cella.valasz
    const rendben =
      v === null ||
      (typeof v === 'number' && Number.isFinite(v)) ||
      (typeof v === 'string' && v.length <= MAX_SZOVEG)

    if (!rendben) return `cella[${i}]: a válasz szám, szöveg vagy null lehet`
  }

  return null
}

function validalSorbaRendezos(valasz) {
  if (valasz === null) return null
  if (!Array.isArray(valasz)) return 'a válasz tömb vagy null lehet'
  if (valasz.length > MAX_ELEM) return `legfeljebb ${MAX_ELEM} elem engedélyezett`

  const lattElemek = new Set()

  for (let i = 0; i < valasz.length; i++) {
    const elem = valasz[i]

    if (typeof elem !== 'string' || elem.length === 0 || elem.length > MAX_SZOVEG) {
      return `elem[${i}]: nem üres szöveg kell legyen`
    }
    if (lattElemek.has(elem)) return `elem[${i}]: duplikált elem (${elem})`
    lattElemek.add(elem)
  }

  return null
}

function validalRovidValasz(valasz) {
  if (valasz === null) return null
  if (typeof valasz !== 'string') return 'a válasz szöveg vagy null lehet'
  if (valasz.length === 0) return 'a válasz nem lehet üres szöveg'
  if (valasz.length > MAX_ROVID) return `legfeljebb ${MAX_ROVID} karakter engedélyezett`
  return null
}

function validalTobbValasz(valasz) {
  if (valasz === null) return null
  if (!Array.isArray(valasz)) return 'a válasz tömb vagy null lehet'
  if (valasz.length > MAX_VALASZTAS) {
    return `legfeljebb ${MAX_VALASZTAS} opció választható`
  }

  const lattOpciok = new Set()

  for (let i = 0; i < valasz.length; i++) {
    const opcio = valasz[i]

    if (!Number.isInteger(opcio) || opcio < 0) {
      return `opcio[${i}]: egész szám kell legyen`
    }
    if (lattOpciok.has(opcio)) {
      return `opcio[${i}]: duplikált opció (${opcio})`
    }
    lattOpciok.add(opcio)
  }

  return null
}

const VALIDALOK = {
  tobb_opcio: validalTobbOpcio,
  tobb_valasz: validalTobbValasz,
  rovid_valasz: validalRovidValasz,
  tablazatos_feladat: validalTablazatos,
  sorba_rendezos: validalSorbaRendezos,
}

function validalBeadast(valaszok) {
  if (!Array.isArray(valaszok)) return 'a "valaszok" mező hiányzik, vagy nem tömb'
  if (valaszok.length === 0) return 'üres beadás'
  if (valaszok.length > MAX_FELADAT) {
    return `legfeljebb ${MAX_FELADAT} feladat küldhető be egyszerre`
  }

  const lattIdk = new Set()

  for (let i = 0; i < valaszok.length; i++) {
    const f = valaszok[i]

    if (typeof f !== 'object' || f === null || Array.isArray(f)) {
      return `valaszok[${i}]: érvénytelen elem`
    }
    if (!pozitivEgesz(f.feladat_id)) {
      return `valaszok[${i}]: érvénytelen feladat_id`
    }
    if (!TIPUSOK.has(f.tipus)) {
      return `valaszok[${i}]: ismeretlen feladattípus`
    }
    if (lattIdk.has(f.feladat_id)) {
      return `valaszok[${i}]: duplikált feladat_id (${f.feladat_id})`
    }
    lattIdk.add(f.feladat_id)

    const hiba = VALIDALOK[f.tipus](f.valasz)
    if (hiba) return `valaszok[${i}] (feladat ${f.feladat_id}): ${hiba}`
  }

  return null
}

/* =========================
   Időérték ellenőrzése és másodpercre alakítása
   Visszatér: { hiba } vagy { masodperc }
========================= */

function feldolgozIdo(ido) {
  if (ido === undefined || ido === null) return { hiba: 'az "ido" mező hiányzik' }
  if (typeof ido !== 'number' || !Number.isFinite(ido)) {
    return { hiba: 'az "ido" mező szám kell legyen' }
  }
  if (ido < 0) return { hiba: 'az "ido" nem lehet negatív' }

  let masodperc = ido

  // Ha a szám nagyobb, mint a lehetséges másodperc-érték, akkor milliszekundumnak vesszük.
  if (masodperc > MAX_IDO_MASODPERC) {
    masodperc = masodperc / 1000
  }

  // Ha az átváltás után is túl nagy, akkor nem fogadjuk el.
  if (masodperc > MAX_IDO_MASODPERC) {
    return { hiba: `az "ido" túl nagy (legfeljebb ${MAX_IDO_MASODPERC} másodperc)` }
  }

  return { masodperc }
}

/* =========================
   POST /incoming
   Body: { valaszok: [ { feladat_id, tipus, valasz }, ... ], ido: <szám> }
========================= */

router.post('/incoming', express.json({ limit: '100kb' }), (req, res) => {
  const { valaszok, ido } = req.body ?? {}

  const hiba = validalBeadast(valaszok)
  if (hiba) {
    return res.status(400).json({ error: hiba })
  }

  const idoEredmeny = feldolgozIdo(ido)
  if (idoEredmeny.hiba) {
    return res.status(400).json({ error: idoEredmeny.hiba })
  }
  const idoMasodperc = idoEredmeny.masodperc

  console.log('Felhasználó:', req.user?.id)
  console.log('Érvényes beadás, feladatok száma:', valaszok.length)
  console.log('Eltelt idő (mp):', idoMasodperc)

  res.json({
    ok: true,
    felhasznalo: req.user?.id ?? null,
    fogadott_feladatok: valaszok.length,
    ido_masodperc: idoMasodperc,
  })
})



export default router