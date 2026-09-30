import express from 'express'
import sql from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

/* =========================
   VÉDETT API VÉGPONTOK - csak bejelentkezve érhetők el
========================= */

router.use(requireAuth)

//Bejelentkezett felhasználó profiladatait lekérő api végpont
router.get('/me', async (req, res, next) => {
  try {
    const felhasznaloId = req.user.id

    const rows = await sql`
      select
        p.id,
        p.felhasznalonev,
        p.email,
        p.szerep,
        u.created_at
      from profilok p
      join auth.users u on u.id = p.id
      where p.id = ${felhasznaloId}
    `

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nem található profil ehhez a felhasználóhoz' })
    }

    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

//Bejelentkezett felhasználóhoz tartozó tesztek lekérő api végpont
router.get('/me/tests', async (req, res, next) => {
  try {
    const felhasznaloId = req.user.id

    const rows = await sql`
      select
        tesztek.id,
        tesztek.nev,
        tesztek.datum,
        tesztek.kitoltesi_ido,
        tantargyak.nev as tantargy,
        count(teszt_feladatok.id)::int as feladatok_szama
      from tesztek
      join tantargyak on tantargyak.id = tesztek.tantargy_id
      left join teszt_feladatok on teszt_feladatok.teszt_id = tesztek.id
      where tesztek.felhasznalo_id = ${felhasznaloId}
      group by tesztek.id, tantargyak.nev
      order by tesztek.datum desc
    `

    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// Bejelentkezett felhasználó tantárgyankénti összesítése (kördiagramhoz)
router.get('/me/piechart', async (req, res, next) => {
  try {
    const felhasznaloId = req.user.id
    const days = Number.parseInt(req.query.days, 10)

    const rows = await sql`
      with teszt_osszes as (
        select
          tesztek.id,
          tesztek.tantargy_id,
          tesztek.kitoltesi_ido,
          (
            select count(*)
            from teszt_feladatok
            where teszt_feladatok.teszt_id = tesztek.id
          )::int as feladatok_szama
        from tesztek
        where tesztek.felhasznalo_id = ${felhasznaloId}
        ${Number.isInteger(days) && days > 0
          ? sql`and tesztek.datum >= now() - make_interval(days => ${days})`
          : sql``}
      )
      select
        tantargyak.nev as tantargy,
        coalesce(sum(teszt_osszes.kitoltesi_ido), 0)::int as kitoltesi_ido,
        coalesce(sum(teszt_osszes.feladatok_szama), 0)::int as feladatok_szama,
        count(teszt_osszes.id)::int as tesztek_szama
      from teszt_osszes
      join tantargyak on tantargyak.id = teszt_osszes.tantargy_id
      group by tantargyak.nev
      order by kitoltesi_ido desc
    `

    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// Bejelentkezett felhasználó napi feladatszáma
// Opcionális szűrő: ?days=30
router.get('/me/activitylog', async (req, res, next) => {
  try {
    const felhasznaloId = req.user.id
    const days = Number.parseInt(req.query.days, 10)

    const rows = await sql`
      select
        to_char(tesztek.datum::date, 'YYYY-MM-DD') as nap,
        count(teszt_feladatok.id)::int as feladatok_szama,
        count(distinct tesztek.id)::int as tesztek_szama
      from tesztek
      left join teszt_feladatok on teszt_feladatok.teszt_id = tesztek.id
      where tesztek.felhasznalo_id = ${felhasznaloId}
      ${Number.isInteger(days) && days > 0
        ? sql`and tesztek.datum >= now() - make_interval(days => ${days})`
        : sql``}
      group by tesztek.datum::date
      order by tesztek.datum::date asc
    `

    res.json(rows)
  } catch (err) {
    next(err)
  }
})

export default router