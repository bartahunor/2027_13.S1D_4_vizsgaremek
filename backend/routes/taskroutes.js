import express from 'express'
import sql from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { startTest, TestServiceError } from '../services/testCorrector.js'

const router = express.Router()

/* =========================
   VÉDETT API VÉGPONTOK - csak bejelentkezve érhetők el
========================= */

router.use(requireAuth)

//Tantárgyak és id-jeiket lekérő api végpont
router.get('/subjects', async (req, res, next) => {
  try {
    const rows = await sql`
      select id, nev
      from tantargyak
      order by nev
    `
 
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

//Adott tantárgy témaköreit szűrő api végpont
router.get('/topics', async (req, res, next) => {
  try {
    const { tantargy_id } = req.query

    let tantargyIdSzam
    if (tantargy_id !== undefined) {
      tantargyIdSzam = Number(tantargy_id)
      if (!Number.isInteger(tantargyIdSzam) || tantargyIdSzam <= 0) {
        return res.status(400).json({ error: 'Érvénytelen tantargy_id paraméter' })
      }
    }

    const rows = tantargyIdSzam
      ? await sql`
          select temakorok.*, tantargyak.nev as tantargy
          from temakorok
          join tantargyak on tantargyak.id = temakorok.tantargy_id
          where temakorok.tantargy_id = ${tantargyIdSzam}
          order by temakorok.nev
        `
      : await sql`
          select temakorok.*, tantargyak.nev as tantargy
          from temakorok
          join tantargyak on tantargyak.id = temakorok.tantargy_id
          order by temakorok.nev
        `

    res.json(rows)
  } catch (err) {
    next(err)
  }
})

//Adott tantárgy feladatait megjelenési év alapján szűrő api végpont
router.get('/year', async (req, res, next) => {
  try {
    const { tantargy_id } = req.query

    // tantargy_id kötelező - az év lekérdezés kizárólag tantárgytól függ
    const tantargyIdSzam = Number(tantargy_id)
    if (!Number.isInteger(tantargyIdSzam) || tantargyIdSzam <= 0) {
      return res.status(400).json({ error: 'A tantargy_id paraméter kötelező és érvényes egész szám kell legyen' })
    }

    const rows = await sql`
      select distinct ev.id, ev.ev
      from ev
      join feladatok on feladatok.ev_id = ev.id
      join temakorok on temakorok.id = feladatok.temakor_id
      where temakorok.tantargy_id = ${tantargyIdSzam}
      order by ev.ev
    `

    res.json(rows)
  } catch (err) {
    next(err)
  }
})

//Adott tantárgy feladatait szint alapján szűrő api végpont
router.get('/level', async (req, res, next) => {
  try {
    const { tantargy_id } = req.query
 
    const tantargyIdSzam = Number(tantargy_id)
    if (!Number.isInteger(tantargyIdSzam) || tantargyIdSzam <= 0) {
      return res.status(400).json({ error: 'A tantargy_id paraméter kötelező és érvényes egész szám kell legyen' })
    }
 
    const rows = await sql`
      select distinct ev.szint
      from ev
      join feladatok on feladatok.ev_id = ev.id
      join temakorok on temakorok.id = feladatok.temakor_id
      where temakorok.tantargy_id = ${tantargyIdSzam}
      order by ev.szint
    `
 
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

//Feladatok lekérése tantárgy id/szint/év vagy témakör id alapján
router.get('/chosentasks', async (req, res, next) => {
  try {
    const { tantargy_id, szint, ev, temakor_id } = req.query

    const tantargyIdSzam = Number(tantargy_id)
    if (!Number.isInteger(tantargyIdSzam) || tantargyIdSzam <= 0) {
      return res.status(400).json({ error: 'A tantargy_id paraméter kötelező és érvényes egész szám kell legyen' })
    }

    if (!szint || typeof szint !== 'string') {
      return res.status(400).json({ error: 'A szint paraméter kötelező' })
    }

    if (!ev && !temakor_id) {
      return res.status(400).json({ error: 'Az ev vagy a temakor_id paraméterek közül legalább az egyik kötelező' })
    }

    if (ev && temakor_id) {
      return res.status(400).json({ error: 'Az ev és a temakor_id paraméterek közül csak az egyik adható meg' })
    }

    let szuroFeltetel
    if (ev) {
      const evSzam = Number(ev)
      if (!Number.isInteger(evSzam) || evSzam <= 0) {
        return res.status(400).json({ error: 'Az ev paraméter érvényes egész szám kell legyen' })
      }
      szuroFeltetel = sql`and ev.ev = ${evSzam}`
    } else {
      const temakorIdSzam = Number(temakor_id)
      if (!Number.isInteger(temakorIdSzam) || temakorIdSzam <= 0) {
        return res.status(400).json({ error: 'A temakor_id paraméter érvényes egész szám kell legyen' })
      }
      szuroFeltetel = sql`and temakorok.id = ${temakorIdSzam}`
    }

    // Alap feladat adatok - most már a tipus_id-t feloldjuk a nevére
    const rows = await sql`
      select
        feladatok.id,
        feladat_tipusok.nev as tipus,
        feladatok.kerdes,
        feladatok.valaszok,
        forrasok.szoveg as forras_szoveg,
        forrasok.kep as forras_kep
      from feladatok
      join temakorok on temakorok.id = feladatok.temakor_id
      join ev on ev.id = feladatok.ev_id
      join feladat_tipusok on feladat_tipusok.id = feladatok.tipus_id
      left join forrasok on forrasok.id = feladatok.forras_id
      where temakorok.tantargy_id = ${tantargyIdSzam}
        and ev.szint = ${szint}
        ${szuroFeltetel}
      order by feladatok.id
    `

    // Táblázatos feladatok azonosítása és adataik hozzácsatolása
    const TABLAZATOS_TIPUS_NEV = 'tablazatos_feladat' // <-- ellenőrizd, ez egyezzen a feladat_tipusok.nev tényleges értékével!

    const tablazatosIdk = rows
      .filter(r => r.tipus === TABLAZATOS_TIPUS_NEV)
      .map(r => r.id)

    if (tablazatosIdk.length > 0) {
      const oszlopok = await sql`
        select feladat_id, oszlop_sorszam, oszlop_nev
        from tablazatos_feladat_oszlopok
        where feladat_id in ${sql(tablazatosIdk)}
        order by feladat_id, oszlop_sorszam
      `

      // A lathato=false celláknál az érték NEM kerül a válaszba - ez a helyes válasz
      const cellak = await sql`
        select
          feladat_id,
          sor_sorszam,
          oszlop_sorszam,
          lathato,
          case when lathato then ertek else null end as ertek
        from tablazatos_feladat_cellak
        where feladat_id in ${sql(tablazatosIdk)}
        order by feladat_id, sor_sorszam, oszlop_sorszam
      `

      const oszlopokMap = {}
      for (const o of oszlopok) {
        (oszlopokMap[o.feladat_id] ??= []).push(o)
      }

      const cellakMap = {}
      for (const c of cellak) {
        (cellakMap[c.feladat_id] ??= []).push(c)
      }

      for (const row of rows) {
        if (row.tipus === TABLAZATOS_TIPUS_NEV) {
          row.oszlopok = oszlopokMap[row.id] || []
          row.cellak = cellakMap[row.id] || []
        }
      }
    }

    res.json(rows)
  } catch (err) {
    next(err)
  }
})


//Teszt indítása: létrehoz egy folyamatban lévő tesztet a kiadott feladatokkal
router.post('/starttest', async (req, res, next) => {
  try {
    const { tantargy_id, feladat_idk, nev } = req.body

    const tantargyIdSzam = Number(tantargy_id)
    if (!Number.isInteger(tantargyIdSzam) || tantargyIdSzam <= 0) {
      return res.status(400).json({ error: 'A tantargy_id kötelező és érvényes egész szám kell legyen' })
    }

    if (!Array.isArray(feladat_idk) || feladat_idk.length === 0) {
      return res.status(400).json({ error: 'A feladat_idk kötelező, nem üres tömb kell legyen' })
    }

    const feladatIdkSzamok = feladat_idk.map(Number)
    if (!feladatIdkSzamok.every(id => Number.isInteger(id) && id > 0)) {
      return res.status(400).json({ error: 'A feladat_idk csak pozitív egész számokat tartalmazhat' })
    }

    if (nev !== undefined && (typeof nev !== 'string' || nev.length > 100)) {
      return res.status(400).json({ error: 'A nev szöveg kell legyen, legfeljebb 100 karakter' })
    }

    const teszt = await startTest({
      userId: req.user.id, // a requireAuth által validált felhasználó, NEM a body-ból
      tantargyId: tantargyIdSzam,
      feladatIdk: feladatIdkSzamok,
      nev,
    })

    res.status(201).json({
      teszt_id: teszt.id,
      status: teszt.status,
      feladat_idk: teszt.feladatIdk,
    })
  } catch (err) {
    if (err instanceof TestServiceError && err.status < 500) {
      return res.status(err.status).json({ error: err.message, code: err.code })
    }
    next(err)
  }
})

export default router