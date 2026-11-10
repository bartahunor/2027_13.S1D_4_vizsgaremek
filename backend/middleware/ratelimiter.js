import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { isIP } from 'node:net'

/**
 * RATE LIMITING
 *
 * - Egyelőre egy általános limiter minden /api végpontra.
 * - Amint írási (POST/PUT/DELETE) végpontok is lesznek, azokra érdemes
 *   lesz külön, szigorúbb limitert tenni (pl. egy createWriteLimiter()
 *   hasonló mintával, kisebb max értékkel).
 * - trust proxy szándékosan NINCS beállítva a server.js-ben, amíg nem
 *   dől el a hosting (VPS + nginx / managed platform / közvetlen Node) -
 *   ha proxy mögé kerül a szerver, ezt is figyelembe kell majd venni,
 *   mert különben a limiter rossz (proxy-) IP-t fog látni minden
 *   kérésnél, és nem tud ténylegesen IP-nkénti korlátozást tartani.
 */

/* - Nem használunk globális trust proxy: true beállítást.
 *
 * Ha az X-Real-IP hiányzik vagy érvénytelen,
 * az Express által látott IP-címet használjuk.
 */

export function createApiLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,

    keyGenerator: (req) => {
      const railwayIp = req.get('X-Real-IP')

      if (railwayIp && isIP(railwayIp)) {
        return ipKeyGenerator(railwayIp, 56)
      }

      return ipKeyGenerator(req.ip, 56)
    },

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      error: 'Túl sok kérés érkezett erről az IP-ről, próbáld újra később.'
    }
  })
}