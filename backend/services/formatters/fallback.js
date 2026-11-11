// Ismeretlen vagy null típushoz: a nyers értékeket adja vissza.
export default function fallback(feladat) {
  return {
    adott_valasz: feladat.adott_valasz,
    helyes_valaszok: feladat.helyes_valaszok,
    forras:
      feladat.forras_szoveg || feladat.forras_kep
        ? { szoveg: feladat.forras_szoveg, kep: feladat.forras_kep }
        : null,
  }
}