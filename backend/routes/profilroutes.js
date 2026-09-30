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

export default router