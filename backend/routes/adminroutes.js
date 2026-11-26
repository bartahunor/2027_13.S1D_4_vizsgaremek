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
        return res.status(400).json({ error: `Hiányzó vagy érvénytelen mappa. Mappa név: ${mappa}` })
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

// Év + szint felvétele (pl. { "ev": 2024, "szint": "emelt" }). Visszaadja az ev tábla id-ját.
// Ha ugyanilyen év és szint már van, a meglévő id-t adja vissza.
router.post('/evupload', requireAdmin, async (req, res, next) => {
  try {
    const ev = Number(req.body?.ev)
    const szint = typeof req.body?.szint === 'string' ? req.body.szint.trim() : ''

    if (!Number.isInteger(ev) || ev < 1900 || ev > 2100) {
      return res.status(400).json({ error: 'Az év érvénytelen.' })
    }
    if (!szint) {
      return res.status(400).json({ error: 'A szint megadása kötelező.' })
    }

    const [existing] = await sql`
      select id from ev where ev = ${ev} and szint = ${szint} limit 1
    `
    if (existing) {
      return res.json({ id: existing.id })
    }

    const [row] = await sql`
      insert into ev (ev, szint)
      values (${ev}, ${szint})
      returning id
    `
    res.status(201).json({ id: row.id })
  } catch (err) {
    next(err)
  }
})




//Feladatok feltöltés 
class HibasAdat extends Error {}

const ellenoriz = (feltetel, uzenet) => {
  if (!feltetel) throw new HibasAdat(uzenet)
}

const szovegLista = (lista, hely) => {
  ellenoriz(Array.isArray(lista) && lista.every(x => typeof x === 'string'),
    `${hely}: hibás lista.`)
  return lista.map(x => x.trim())
}

const sorszam = (ertek, max, hely) => {
  const s = ertek.replace(/\.+$/, '')
  const n = Number(s)
  ellenoriz(/^\d+$/.test(s) && n >= 1 && n <= max, `${hely}: hibás helyes válasz "${ertek}".`)
  return String(n)
}

const pontos = s => s.replace(/\.+$/, '') + '.'

// típusfüggő mezők
function valaszMezok(task, hely) {
  if (task.TypeName === 'tablazatos_feladat') {
    return { valaszok: null, helyes: null }
  }

  const opciok = szovegLista(task.Options ?? [], hely)
  const megoldasok = szovegLista(task.CorrectAnswers ?? [], hely)

  switch (task.TypeName) {
    case 'rovid_valasz': {
      const jok = megoldasok.filter(Boolean)
      ellenoriz(jok.length > 0, `${hely}: nincs helyes válasz.`)
      return { valaszok: null, helyes: [jok.join('/')] }
    }
    case 'tobb_opcio':
    case 'tobb_valasz': {
      ellenoriz(opciok.length >= 2, `${hely}: nincs elég válaszlehetőség.`)
      const helyes = [...new Set(megoldasok.map(a => sorszam(a, opciok.length, hely)))]
      ellenoriz(helyes.length > 0, `${hely}: nincs helyes válasz.`)
      ellenoriz(task.TypeName !== 'tobb_opcio' || megoldasok.length === 1,
        `${hely}: pontosan egy helyes válasz kell.`)
      return { valaszok: opciok, helyes }
    }
    case 'sorba_rendezos': {
      const elemek = opciok.map(pontos)
      const sorrend = megoldasok.map(pontos)
      ellenoriz(elemek.length >= 2 &&
        JSON.stringify([...elemek].sort()) === JSON.stringify([...sorrend].sort()),
        `${hely}: a sorrend nem egyezik a lehetőségekkel.`)
      return { valaszok: elemek, helyes: sorrend }
    }
    default:
      throw new HibasAdat(`${hely}: ismeretlen típus "${task.TypeName}".`)
  }
}

async function tablazatMentes(tx, feladatId, task, hely) {
  const { TableColumns: fejlec, TableCells: cellak } = task
  ellenoriz(Array.isArray(fejlec) && fejlec.length > 0 &&
    Array.isArray(cellak) && cellak.length > 0, `${hely}: hiányos táblázat.`)

  const nevek = szovegLista(fejlec, hely)
  const oszlopSorok = nevek.map((nev, i) => ({
    feladat_id: feladatId,
    oszlop_sorszam: i + 1,
    oszlop_nev: nev
  }))

  const cellaSorok = cellak.map(c => {
    ellenoriz(c && Number.isInteger(c.Row) && c.Row >= 1 &&
      Number.isInteger(c.Column) && c.Column >= 1 && c.Column <= nevek.length &&
      typeof c.Visible === 'boolean' &&
      (c.Value == null || typeof c.Value === 'string'), `${hely}: hibás cella.`)

    return {
      feladat_id: feladatId,
      sor_sorszam: c.Row,
      oszlop_sorszam: c.Column,
      ertek: c.Value?.trim() ? c.Value : null,
      lathato: c.Visible
    }
  })

  await tx`insert into tablazatos_feladat_oszlopok ${tx(oszlopSorok)}`
  await tx`insert into tablazatos_feladat_cellak ${tx(cellaSorok)}`
}

router.post('/tasks-upload', requireAdmin, async (req, res, next) => {
  try {
    const { EvId, Tasks } = req.body ?? {}
    ellenoriz(Number.isInteger(EvId), 'Hiányzik az EvId.')
    ellenoriz(Array.isArray(Tasks) && Tasks.length > 0, 'Nincs feltöltendő feladat.')

    const idk = await sql.begin(async tx => {
      const tipusok = await tx`select id, nev from feladat_tipusok`
      const tipusIdk = new Map(tipusok.map(t => [t.nev, t.id]))
      const ujIdk = []

      for (const task of Tasks) {
        ellenoriz(task, 'Üres feladat a listában.')
        const hely = `${task.Number}${task.PartLabel ?? ''} feladat`

        ellenoriz(Number.isInteger(task.TopicId), `${hely}: hiányzik a témakör.`)
        ellenoriz(Number.isInteger(task.Points), `${hely}: hiányzik a pontszám.`)
        ellenoriz(typeof task.Question === 'string' && task.Question.trim(),
          `${hely}: hiányzik a kérdés.`)
        ellenoriz(tipusIdk.has(task.TypeName), `${hely}: ismeretlen típus.`)

        let forrasId = null
        if (task.SourceKey != null && String(task.SourceKey).trim()) {
          forrasId = Number(task.SourceKey)
          ellenoriz(Number.isInteger(forrasId), `${hely}: a forrás nincs feltöltve.`)
        }

        const { valaszok, helyes } = valaszMezok(task, hely)

        const [uj] = await tx`
          insert into feladatok
            (temakor_id, forras_id, kerdes, pont, ev_id, tipus_id, valaszok, helyes_valaszok)
          values
            (${task.TopicId}, ${forrasId}, ${task.Question}, ${task.Points}, ${EvId},
             ${tipusIdk.get(task.TypeName)}, ${valaszok}, ${helyes})
          returning id
        `

        if (task.TypeName === 'tablazatos_feladat') {
          await tablazatMentes(tx, uj.id, task, hely)
        }

        ujIdk.push(uj.id)
      }

      return ujIdk
    })

    res.status(201).json({ darab: idk.length, idk })
  } catch (err) {
    if (err instanceof HibasAdat || /^(22|23)/.test(err.code ?? '')) {
      return res.status(400).json({ hiba: err.message })
    }
    next(err)
  }
})

export default router