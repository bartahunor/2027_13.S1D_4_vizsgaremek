import sql from '../db.js'

/* =========================
   Admin jogosultságot ellenőrző middleware
   Feltétel: a requireAuth middleware már lefutott előtte,
   tehát req.user.id elérhető.
========================= */
export async function requireAdmin(req, res, next) {
  try {
    const felhasznaloId = req.user.id

    const rows = await sql`
      select szerep
      from profilok
      where id = ${felhasznaloId}
    `

    if (rows.length === 0 || rows[0].szerep !== 'admin') {
      return res.status(403).json({ error: 'Nincs admin jogosultság ehhez a művelethez' })
    }

    next()
  } catch (err) {
    next(err)
  }
}