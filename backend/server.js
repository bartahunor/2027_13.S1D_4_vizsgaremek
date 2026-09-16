import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import sql from './db.js'


dotenv.config()

const app = express()

// A Supabase projekt URL-je - a frontend közvetlenül ezt hívja auth-hoz,
// ezért a CSP connect-src-jének is engednie kell. (Ugyanez az env változó
// kell majd a backend JWT-validációjához is, ha még nincs a .env-ben, vedd fel.)
const SUPABASE_URL = process.env.SUPABASE_URL

/* =========================
   HELMET - alap HTTP biztonsági headerek + Content-Security-Policy
   - A React + Vite production build alapból CSP-barát (scriptek/stílusok
     külön fájlban, nem inline), ezért itt már nem kell kikapcsolni.
   - A Google Fonts két külön hostot igényel: a stíluslap a
     fonts.googleapis.com-ról jön (style-src), a betűtípus-fájlok pedig
     a fonts.gstatic.com-ról (font-src).
   - Ha a frontend a jövőben más külső forrást (CDN, kép, analitika) is
     használ, ide kell felvenni az adott directívába.
========================= */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", ...(SUPABASE_URL ? [SUPABASE_URL] : [])],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}))

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

/* =========================
   RATE LIMITING
   - Egyelőre egy általános limiter minden /api végpontra.
   - Amint írási (POST/PUT/DELETE) végpontok is lesznek, azokra
     külön, szigorúbb limitert teszünk majd.
   - trust proxy szándékosan NINCS beállítva, amíg nem dől el a hosting
     (VPS + nginx / managed platform / közvetlen Node) - ha proxy mögé
     kerül a szerver, ide vissza kell térni.
========================= */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 perc
  max: 100,                 // max kérés / IP / ablak
  standardHeaders: true,    // RateLimit-* headerek a válaszban
  legacyHeaders: false,     // ne küldje a régi X-RateLimit-* headereket
  message: { error: 'Túl sok kérés érkezett erről az IP-ről, próbáld újra később.' }
})

app.use('/api', apiLimiter)

/* =========================
   FŐ OLDALI API LEKÉRÉSEK
========================= */

app.get('/api/temakorok/szuro_tantargyossz', async (req, res) => {
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
})

app.get('/api/feladatok/szuro_tanfel', async (req, res) => {
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
})



/* ========================= 
   SZERVER INDÍTÁS - MINDIG A VÉGÉN!
========================= */

app.listen(3000, () => {
  console.log('Server fut: http://localhost:3000')
})