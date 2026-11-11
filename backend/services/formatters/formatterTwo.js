export default function formatterTwo(feladat) {
  return {
    adott_valasz: feladat.adott_valasz,
    helyes_valaszok: feladat.helyes_valaszok,
    forras:
      feladat.forras_szoveg || feladat.forras_kep
        ? { szoveg: feladat.forras_szoveg, kep: feladat.forras_kep }
        : null,
  }
}