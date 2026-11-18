import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { supabaseForUser } from '../config/supabaseClient.js'   // a te meglévő segéded
import sql from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminauth.js'

const router = express.Router()

/* =========================
   VÉDETT API VÉGPONTOK - csak bejelentkezve érhetők el
========================= */

router.use(requireAuth) 

//Bejelentkezett felhasználó admin jogosultságát ellenőrző api végpont
router.get('/checkadmin', async (req, res, next) => {
  try {
    const felhasznaloId = req.user.id

    const rows = await sql`
      select szerep
      from profilok
      where id = ${felhasznaloId}
    `

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nem található profil ehhez a felhasználóhoz' })
    }

    const isAdmin = rows[0].szerep === 'admin'

    res.json({ isAdmin })
  } catch (err) {
    next(err)
  }
})

//Dashboard statisztikák: feladatok, feladatsorok, felhasználók száma
//Csak admin jogosultsággal érhető el - ezért a requireAdmin middleware-t
//kifejezetten csak erre a route-ra tesszük rá, a /checkadmin-re nem.
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [feladatokResult] = await sql`
      select count(*)::int as count from feladatok
    `

    // Egy feladatsor = egy érettségi sor (ev: év + szint) egy adott tantárgyból.
    // Az ev tábla nem tartalmaz tantárgyat, ezért a feladatok -> temakorok
    // kapcsolaton keresztül határozzuk meg az egyedi (ev_id, tantargy_id) párokat.
    const [feladatsorokResult] = await sql`
      select count(*)::int as count
      from (
        select distinct f.ev_id, t.tantargy_id
        from feladatok f
        join temakorok t on t.id = f.temakor_id
        where f.ev_id is not null
          and t.tantargy_id is not null
      ) as feladatsorok
    `

    const [felhasznalokResult] = await sql`
      select count(*)::int as count from profilok
    `

    res.json({
      feladatokSzama: feladatokResult.count,
      feladatsorokSzama: feladatsorokResult.count,
      felhasznalokSzama: felhasznalokResult.count
    })
  } catch (err) {
    next(err)
  }
})

//Tantárgyak és a hozzájuk tartozó feladatok száma
// A feladat tantárgya a feladatok -> temakorok -> tantargyak kapcsolaton keresztül érhető el.
router.get('/subjects', requireAdmin, async (req, res, next) => {
  try {
    const rows = await sql`
      select
        ta.id,
        ta.nev,
        count(f.id)::int as feladatok_szama
      from tantargyak ta
      left join temakorok t on t.tantargy_id = ta.id
      left join feladatok f on f.temakor_id = t.id
      group by ta.id, ta.nev
      order by ta.nev
    `

    res.json(rows.map(r => ({
      id: r.id,
      nev: r.nev,
      feladatokSzama: r.feladatok_szama
    })))
  } catch (err) {
    next(err)
  }
})

//Témakörök, a hozzájuk tartozó tantárgy és a feladatok száma
router.get('/topics', requireAdmin, async (req, res, next) => {
  try {
    const rows = await sql`
      select
        t.id,
        t.nev,
        t.tantargy_id,
        ta.nev as tantargy_nev,
        count(f.id)::int as feladatok_szama
      from temakorok t
      left join tantargyak ta on ta.id = t.tantargy_id
      left join feladatok f on f.temakor_id = t.id
      group by t.id, t.nev, t.tantargy_id, ta.nev
      order by ta.nev, t.nev
    `

    res.json(rows.map(r => ({
      id: r.id,
      nev: r.nev,
      tantargyId: r.tantargy_id,
      tantargyNev: r.tantargy_nev,
      feladatokSzama: r.feladatok_szama
    })))
  } catch (err) {
    next(err)
  }
})

router.get('/tasktypes', requireAdmin, async (req, res, next) => {
  try {
    const rows = await sql`
      select
        ft.id,
        ft.nev,
        count(f.id)::int as feladatok_szama
      from feladat_tipusok ft
      left join feladatok f on f.tipus_id = ft.id
      group by ft.id, ft.nev
      order by ft.nev
    `

    res.json(rows.map(r => ({
      id: r.id,
      nev: r.nev,
      feladatokSzama: r.feladatok_szama
    })))
  } catch (err) {
    next(err)
  }
})

// Felhasználók listája: felhasználónév, email, szerep és hogy van-e mai kitöltött tesztje
router.get('/felhasznalok', requireAdmin, async (req, res, next) => {
  try {
    const rows = await sql`
      select
        p.id,
        p.felhasznalonev,
        p.email,
        p.szerep,
        exists (
          select 1
          from tesztek t
          where t.felhasznalo_id = p.id
            and t.datum::date = (now() at time zone 'Europe/Budapest')::date
        ) as van_mai_teszt
      from profilok p
      order by p.felhasznalonev
    `

    res.json(rows.map(r => ({
      id: r.id,
      felhasznalonev: r.felhasznalonev,
      email: r.email,
      szerep: r.szerep,
      vanMaiTeszt: r.van_mai_teszt
    })))
  } catch (err) {
    next(err)
  }
})





// Forrásképek feltöltése és tárolása Supabase Storage-ban
const BUCKET = 'forras-kepek'
const MAX_BEMENET_BYTES = 10 * 1024 * 1024   // feltöltött eredeti
const MAX_KIMENET_BYTES = 2 * 1024 * 1024    // tárolt WebP
const MAX_OLDAL = 1600

const forrasUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BEMENET_BYTES, files: 1 },
}).single('kep')

// WebP-re alakít, és ha nem fér bele 2 MB-ba, fokozatosan csökkenti a minőséget, majd a méretet
async function webpreAlakit(buffer) {
  const probak = [
    { oldal: MAX_OLDAL, minoseg: 82 },
    { oldal: MAX_OLDAL, minoseg: 72 },
    { oldal: MAX_OLDAL, minoseg: 62 },
    { oldal: 1200, minoseg: 70 },
    { oldal: 1000, minoseg: 60 },
    { oldal: 800, minoseg: 55 },
  ]

  for (const { oldal, minoseg } of probak) {
    const ki = await sharp(buffer)
      .rotate()
      .resize({ width: oldal, height: oldal, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: minoseg })
      .toBuffer()

    if (ki.length <= MAX_KIMENET_BYTES) return ki
  }
  throw new Error('A kép nem tömöríthető 2 MB alá')
}

router.post('/sourceupload', requireAdmin, (req, res, next) => {
  forrasUpload(req, res, err => {
    if (err) return res.status(400).json({ error: `Feltöltési hiba: ${err.message}` })
    next()
  })
}, async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  let utvonal = null

  try {
    const szoveg = String(req.body.szoveg ?? '').trim()
    if (!szoveg && !req.file) {
      return res.status(400).json({ error: 'A szoveg vagy a kep megadasa kotelezo' })
    }

    let kepUtvonal = null

    if (req.file) {
      const mappa = String(req.body.mappa ?? '').trim()
      if (!mappa || mappa.length > 100 || /[\\/]/.test(mappa) || mappa.includes('..')) {
        return res.status(400).json({ error: 'Hiányzó vagy érvénytelen mappa' })
      }

      let webp
      try {
        webp = await webpreAlakit(req.file.buffer)   // a sharp hibát dob, ha nem valódi kép
      } catch {
        return res.status(400).json({ error: 'A fájl nem alakítható át képpé, vagy túl nagy marad tömörítés után' })
      }

      utvonal = `${mappa}/${randomUUID()}.webp`
      const { error } = await supabaseForUser(token)
        .storage
        .from(BUCKET)
        .upload(utvonal, webp, {
          contentType: 'image/webp',
          upsert: false,
          cacheControl: '31536000',
        })

      if (error) {
        console.error('Forráskép feltöltési hiba:', error.message)
        utvonal = null   // nem jött létre fájl, nincs mit takarítani
        return res.status(403).json({ error: 'A feltöltés nem sikerült' })
      }
      kepUtvonal = utvonal
    }

    const [row] = await sql`
      insert into forrasok (szoveg, kep)
      values (${szoveg}, ${kepUtvonal})
      returning id
    `

    res.status(201).json({ id: row.id, kep: kepUtvonal })
  } catch (err) {
    if (utvonal) {
      try { await supabaseForUser(token).storage.from(BUCKET).remove([utvonal]) } catch { /* nem jelezzük tovább */ }
    }
    next(err)
  }
})

export default router