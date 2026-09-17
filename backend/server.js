import express from 'express'
import dotenv from 'dotenv'
import hpp from 'hpp'
import sql from './db.js'
import { createSecurityMiddleware } from './middleware/security.js'
import { createCorsMiddleware } from './middleware/corsconfig.js'
import { createApiLimiter } from './middleware/ratelimiter.js'
import { applyServerTimeouts } from './config/servertimeouts.js'

dotenv.config()

const app = express()

/* =========================
   MIDDLEWARE LÁNC - A SORREND SZÁNDÉKOS, NE CSERÉLD FEL

   1) security (helmet + CSP) - biztonsági headerek minden válaszon,
      minél korábban fusson le
   2) cors                    - origin-ellenőrzés, mielőtt bármi más
      (pl. body parse) megtörténne egy nem engedélyezett kérésen
   3) express.json             - body parse, explicit méretkorláttal
   4) express.static            - statikus frontend fájlok kiszolgálása
   5) hpp                       - query paraméterek "tisztítása",
      mielőtt bármelyik route handler hozzáférne req.query-hez
   6) rate limiter                - csak az /api útvonalakra, a route-ok
      regisztrálása előtt
========================= */

app.use(createSecurityMiddleware())
app.use(createCorsMiddleware())
app.use(express.json({ limit: '100kb' }))
app.use(express.static("public"))
app.use(hpp())
app.use('/api', createApiLimiter())

/* =========================
   FŐ OLDALI API LEKÉRÉSEK
========================= */

app.get('/api/temakorok/szuro_tantargyossz', async (req, res, next) => {
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
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

app.get('/api/feladatok/szuro_tanfel', async (req, res, next) => {
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
    res.json(rows)
  } catch (err) {
    next(err)
  }
})



/* =========================
   HIBAKEZELŐ MIDDLEWARE - mindig a route-ok UTÁN, de a listen ELŐTT
========================= */

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Szerverhiba történt' })
})

/* ========================= 
   SZERVER INDÍTÁS - MINDIG A VÉGÉN!
========================= */

const server = app.listen(3000, () => {
  console.log('Server fut: http://localhost:3000')
})

applyServerTimeouts(server)