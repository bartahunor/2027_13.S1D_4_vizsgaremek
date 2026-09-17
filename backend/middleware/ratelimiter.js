import rateLimit from 'express-rate-limit'

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
export function createApiLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 perc
    max: 100,                 // max kérés / IP / ablak
    standardHeaders: true,    // RateLimit-* headerek a válaszban
    legacyHeaders: false,     // ne küldje a régi X-RateLimit-* headereket
    message: { error: 'Túl sok kérés érkezett erről az IP-ről, próbáld újra később.' }
  })
}