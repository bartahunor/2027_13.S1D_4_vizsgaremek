import express from 'express'
import sql from '../db.js'

const router = express.Router()

/* =========================
   PUBLIKUS API VÉGPONTOK - nincs authentikáció,
   a főoldalon mindenkinek elérhetőek
========================= */

router.get('/szuro_tantargyossz', async (req, res, next) => {
  try {
    const rows = await sql`
      select 
        tantargyak.nev as tantargy,
        count(*) as darab
      from temakorok
      join tantargyak on tantargyak.id = temakorok.tantargy_id
      group by tantargyak.id, tantargyak.nev
      order by tantargyak.nev
    `
    res.set('Cache-Control', 'public, max-age=300') // 5 perc
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

router.get('/szuro_tanfel', async (req, res, next) => {
  try {
    const rows = await sql`
      select 
        tantargyak.nev as tantargy,
        count(*) as darab
      from feladatok
      join temakorok on temakorok.id = feladatok.temakor_id
      join tantargyak on tantargyak.id = temakorok.tantargy_id
      group by tantargyak.id, tantargyak.nev
      order by tantargyak.nev
    `
    res.set('Cache-Control', 'public, max-age=300') // 5 perc
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

export default router