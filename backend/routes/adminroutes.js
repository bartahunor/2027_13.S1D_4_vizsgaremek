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

    const [feladatsorokResult] = await sql`
      select count(*)::int as count from ev
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

export default router