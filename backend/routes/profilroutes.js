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

//Bejelentkezett felhasználóhoz tartozó tesztek lekérő api végpont idő intervallum és tantárgy alapján
router.get('/me/tests', async (req, res, next) => {
  try {
    const felhasznaloId = req.user.id

    // Query paraméterek: ?tantargy=Matematika&napok=30
    const tantargy = req.query.tantargy ? String(req.query.tantargy).trim() : null
    const napok = req.query.napok ? parseInt(req.query.napok, 10) : null

    if (req.query.napok && (Number.isNaN(napok) || napok <= 0)) {
      return res.status(400).json({ error: 'Érvénytelen paraméter (napok)' })
    }

    const rows = await sql`
      select
        tesztek.id,
        tesztek.nev,
        tesztek.datum,
        tesztek.kitoltesi_ido,
        tantargyak.nev as tantargy,
        count(teszt_feladatok.id)::int as feladatok_szama,
        coalesce(sum(teszt_feladatok.elert_pont), 0)::float as elert_pont,
        coalesce(sum(feladatok.pont), 0)::int as max_pont
      from tesztek
      join tantargyak on tantargyak.id = tesztek.tantargy_id
      left join teszt_feladatok on teszt_feladatok.teszt_id = tesztek.id
      left join feladatok on feladatok.id = teszt_feladatok.feladat_id
      where tesztek.felhasznalo_id = ${felhasznaloId}
        and (${tantargy}::text is null or tantargyak.nev = ${tantargy})
        and (${napok}::int is null or tesztek.datum >= now() - make_interval(days => ${napok}::int))
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

// Bejelentkezett felhasználó napi feladatszáma és ideje
// Opcionális szűrő: ?days=30
router.get('/me/calendar', async (req, res, next) => {
  try {
    const felhasznaloId = req.user.id
    const days = Number.parseInt(req.query.days, 10)

    const rows = await sql`
      with teszt_osszes as (
        select
          tesztek.id,
          tesztek.datum::date as nap,
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
        to_char(nap, 'YYYY-MM-DD') as nap,
        coalesce(sum(feladatok_szama), 0)::int as feladatok_szama,
        coalesce(sum(kitoltesi_ido), 0)::int as kitoltesi_ido,
        count(id)::int as tesztek_szama
      from teszt_osszes
      group by nap
      order by nap asc
    `

    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// Bejelentkezett felhasználó tevékenységi naplója (tesztenként egy elem, lapozva)
// Query paraméterek: ?tantargy=Matematika&limit=5&offset=0
router.get('/me/activities', async (req, res, next) => {
  try {
    const felhasznaloId = req.user.id

    const tantargy = req.query.tantargy ? String(req.query.tantargy).trim() : null

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0

    if (Number.isNaN(limit) || limit <= 0 || limit > 50) {
      return res.status(400).json({ error: 'Érvénytelen paraméter (limit)' })
    }
    if (Number.isNaN(offset) || offset < 0) {
      return res.status(400).json({ error: 'Érvénytelen paraméter (offset)' })
    }

    // Eggyel többet kérünk le, hogy tudjuk, van-e további elem
    const rows = await sql`
      select
        tesztek.id,
        tesztek.nev,
        tesztek.datum,
        tesztek.kitoltesi_ido,
        tantargyak.nev as tantargy,
        max(ev.szint) as szint,
        count(teszt_feladatok.id)::int as feladatok_szama,
        count(teszt_feladatok.id) filter (
          where teszt_feladatok.elert_pont >= feladatok.pont
        )::int as helyes_szama,
        coalesce(sum(teszt_feladatok.elert_pont), 0)::float as elert_pont,
        coalesce(sum(feladatok.pont), 0)::int as max_pont
      from tesztek
      join tantargyak on tantargyak.id = tesztek.tantargy_id
      left join teszt_feladatok on teszt_feladatok.teszt_id = tesztek.id
      left join feladatok on feladatok.id = teszt_feladatok.feladat_id
      left join ev on ev.id = feladatok.ev_id
      where tesztek.felhasznalo_id = ${felhasznaloId}
        and (${tantargy}::text is null or tantargyak.nev = ${tantargy})
      group by tesztek.id, tantargyak.nev
      order by tesztek.datum desc, tesztek.id desc
      limit ${limit + 1} offset ${offset}
    `

    res.json({
      items: rows.slice(0, limit),
      hasMore: rows.length > limit,
    })
  } catch (err) {
    next(err)
  }
})

export default router