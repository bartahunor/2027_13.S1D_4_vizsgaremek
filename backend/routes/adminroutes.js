import express from 'express'
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
router.get('/tantargyak', requireAdmin, async (req, res, next) => {
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
router.get('/temakorok', requireAdmin, async (req, res, next) => {
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

export default router