import express from 'express'
import sql from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

/* =========================
   VÉDETT API VÉGPONTOK - csak bejelentkezve érhetők el
========================= */

router.use(requireAuth)

router.get('/temakorok', async (req, res, next) => {
  try {
    const { tantargy_id } = req.query

    // input validáció - ha van tantargy_id, annak érvényes egész számnak kell lennie
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

export default router