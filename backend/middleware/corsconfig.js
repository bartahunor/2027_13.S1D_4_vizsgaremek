import cors from 'cors'

/**
 * CORS
 *
 * - Csak az explicit engedélyezett frontend origin-ek hívhatják az API-t.
 * - A .env-ben ALLOWED_ORIGINS néven, vesszővel elválasztva bővíthető
 *   (pl. "http://localhost:5173,https://sajat-domain.hu").
 * - Amíg nincs production domain, a Vite dev szerverre szűkítjük
 *   (http://localhost:5173) - ha megvan a végleges domain, elég csak
 *   a .env-et bővíteni, ezt a fájlt nem kell módosítani.
 * - origin === undefined esetén (pl. Postman/curl, vagy same-origin
 *   kérés) átengedjük, mert ez nem böngészős, CORS szempontból nem
 *   kihasználható eset.
 */
export function createCorsMiddleware() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173']

  return cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('CORS: nem engedélyezett origin'))
    }
  })
}