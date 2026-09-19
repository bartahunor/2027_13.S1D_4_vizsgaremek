import express from 'express'
import sql from '../db.js'
import { requireAuth } from '../middleware/auth.js'

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

export default router