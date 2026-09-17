import helmet from 'helmet'

/**
 * HELMET - alap HTTP biztonsági headerek + Content-Security-Policy
 *
 * - A React + Vite production build alapból CSP-barát (scriptek/stílusok
 *   külön fájlban, nem inline), ezért nincs szükség a CSP kikapcsolására.
 * - A Google Fonts két külön hostot igényel: a stíluslap a
 *   fonts.googleapis.com-ról jön (style-src), a betűtípus-fájlok pedig
 *   a fonts.gstatic.com-ról (font-src).
 * - A connect-src-be bekerül a Supabase projekt URL-je is, mert a
 *   frontend közvetlenül ezt hívja auth-hoz (és később egyéb Supabase
 *   szolgáltatásokhoz is).
 * - Ha a frontend a jövőben más külső forrást (CDN, kép, analitika) is
 *   használ, ide kell felvenni az adott directívába.
 */
export function createSecurityMiddleware() {
  const SUPABASE_URL = process.env.SUPABASE_URL

  return helmet({
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
  })
}