const BETUJELEK = ['A', 'B', 'C', 'D']

function indexekEgeszkent(ertek) {
  if (ertek == null) return []
  const elemek = Array.isArray(ertek) ? ertek : [ertek]

  return elemek
    .flatMap(e => String(e).split(','))
    .map(e => Number(e.trim()))
    .filter(n => Number.isInteger(n) && n >= 1)
}

// Ha a valaszok tömb ki van töltve, azt használjuk.
// Ha üres, A–D betűjeles feladatnak tekintjük (de csak ha minden index 1–4 közé esik).
function opcioForras(valaszok, adottIndexek, helyesIndexek) {
  if (valaszok.length > 0) return { lista: valaszok, betujeles: false }

  const osszes = [...adottIndexek, ...helyesIndexek]
  if (osszes.every(n => n <= BETUJELEK.length)) {
    return { lista: BETUJELEK, betujeles: true }
  }

  return { lista: [], betujeles: false } // nem értelmezhető, nem találgatunk
}

export default function formatterOne(feladat) {
  const valaszok = Array.isArray(feladat.valaszok) ? feladat.valaszok : []
  const adottIndexek = indexekEgeszkent(feladat.adott_valasz)
  const helyesIndexek = indexekEgeszkent(feladat.helyes_valaszok)

  const { lista, betujeles } = opcioForras(valaszok, adottIndexek, helyesIndexek)

  const adott = new Set(adottIndexek)
  const helyes = new Set(helyesIndexek)

  const opciok = lista.map((szoveg, i) => {
    const sorszam = i + 1
    const kijelolt = adott.has(sorszam)
    const helyesOpcio = helyes.has(sorszam)

    return {
      sorszam,
      szoveg,
      kijelolt,
      helyes: helyesOpcio,
      allapot:
        kijelolt && helyesOpcio ? 'eltalalta'
        : kijelolt && !helyesOpcio ? 'melle'
        : !kijelolt && helyesOpcio ? 'kimaradt'
        : 'semleges',
    }
  })

  const szovegek = indexek =>
    [...new Set(indexek)]
      .sort((a, b) => a - b)
      .map(i => lista[i - 1])
      .filter(s => s != null)

  return {
    betujeles, // true, ha az opciók automatikusan A–D betűk
    opciok,
    adott_valasz_szoveg: szovegek(adottIndexek),
    helyes_valasz_szoveg: szovegek(helyesIndexek),
    nem_valaszolt: adott.size === 0,
    forras:
      feladat.forras_szoveg || feladat.forras_kep
        ? { szoveg: feladat.forras_szoveg, kep: feladat.forras_kep }
        : null,
  }
}