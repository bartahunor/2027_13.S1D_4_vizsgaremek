import { createRemoteJWKSet, jwtVerify } from 'jose'

/* =========================
   SUPABASE JWT ELLENŐRZÉS

   A Supabase 2025 október óta minden ÚJ projektnél alapból aszimmetrikus
   (ES256/RS256) kulcsokkal írja alá a JWT-ket, amiket a projekt publikus
   JWKS végpontján keresztül lehet ellenőrizni - anélkül, hogy a titkos
   kulcsot ismernünk kellene, és anélkül, hogy minden kéréshez hívnunk
   kellene a Supabase Auth szervert (auth.getUser()).

   Ha a projekted még a régi, közös titkos kulcsos (HS256, "legacy JWT
   secret") rendszert használja, ellenőrizd a Dashboardon:
   Project Settings > JWT API Keys - és fontold meg az átállást az új
   kulcsrendszerre, ez a jelenlegi ajánlott gyakorlat.
   https://supabase.com/docs/guides/auth/signing-keys
========================= */

const SUPABASE_URL = process.env.SUPABASE_URL

if (!SUPABASE_URL) {
  throw new Error('Hiányzó környezeti változó: SUPABASE_URL')
}

// A JWKS-t a jose könyvtár automatikusan lekéri és cache-eli,
// nem kell minden kéréssel újra letölteni.
const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
)

const EXPECTED_ISSUER = `${SUPABASE_URL}/auth/v1`
const EXPECTED_AUDIENCE = 'authenticated'

/**
 * Kötelező authentikáció.
 * Kiolvassa és ellenőrzi a Bearer tokent, sikeres ellenőrzés esetén
 * feltölti a req.user objektumot, amit a route handlerek használhatnak.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Hiányzó vagy hibás Authorization header' })
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: EXPECTED_ISSUER,
      audience: EXPECTED_AUDIENCE,
    })

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      appMetadata: payload.app_metadata ?? {},
      userMetadata: payload.user_metadata ?? {},
    }

    next()
  } catch (err) {
    console.error('JWT ellenőrzés sikertelen:', err.code || err.message)
    return res.status(401).json({ error: 'Érvénytelen vagy lejárt token' })
  }
}

/**
 * Opcionális authentikáció - ha van token, ellenőrzi és feltölti a req.user-t,
 * ha nincs, simán továbbenged (pl. publikus végpont, ami bejelentkezve
 * személyre szabott, de anonimusan is elérhető).
 */
export function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next()
  return requireAuth(req, res, next)
}

/**
 * Authorizáció szerepkör alapján. Feltételezi, hogy requireAuth már lefutott.
 * A szerepkört a Supabase user app_metadata mezőjéből olvassa - ezt a mezőt
 * csak service_role kulccsal (tehát csak a backendről, pl. egy admin
 * végpontról) lehet módosítani, a user_metadata-val szemben, amit a
 * bejelentkezett user is írhat, ezért AUTHORIZÁCIÓRA sose azt használd.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.appMetadata?.role

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Nincs jogosultságod ehhez a művelethez' })
    }

    next()
  }
}