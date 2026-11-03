// correctors/tablazatos.js
// Táblázatos feladat javítása.
//
// Csak a rejtett (lathato = false) cellák számítanak: a láthatókat a diák már látta, azokra nem
// válaszolhat. Minden helyesen kitöltött rejtett cella 1 pontot ér, a rossz vagy üres cella 0-t.
// Az elért pont legfeljebb a feladat pontszáma lehet.
//
// A mentett adottValasz cellánként egy JSON-szöveg, csak a kitöltött cellákról, sor/oszlop szerint
// rendezve, pl. ['{"sor":2,"oszlop":3,"valasz":"42"}', '{"sor":2,"oszlop":4,"valasz":"x²"}']

const SZAM = /^-?\d+([.,]\d+)?$/

// Összetett (NFC) ékezetek, speciális szóközök, nagy/kisbetű, felesleges szóközök egységesítése
const normalizal = (s) =>
  String(s)
    .normalize('NFC')
    .replace(/[\u00a0\u2000-\u200b\u202f\u3000]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('hu')

// A sima perjel mellett a hasonló kinézetű változatokat is elválasztónak vesszük
const elvalaszto = /[/\u2044\u2215\uff0f]/

// A megoldás "/"-jellel elválasztott elfogadott változatokból állhat,
// pl. "végrehajtó/végrehajtás" -> "végrehajtó" és "végrehajtás" is jó.
// A teljes szöveget is elfogadjuk. Ha minden rész szám (pl. 1/2 tört, 2020/21),
// nem vágjuk szét, hogy az "1" ne legyen jó válasz az "1/2"-re.
function valtozatok(helyes) {
  const teljes = normalizal(helyes)
  const reszek = String(helyes).split(elvalaszto).map(normalizal).filter((r) => r.length > 0)

  if (reszek.length > 1 && reszek.every((r) => SZAM.test(r))) return [teljes]
  return [teljes, ...reszek]
}

// Kis- és nagybetű, felesleges szóközök nem számítanak; a számokat számként hasonlítjuk össze
// (a tizedesvessző és a tizedespont egyenértékű, a 42 és a 42,0 ugyanaz)
function egyezik(adott, helyes) {
  const a = normalizal(adott)

  return valtozatok(helyes).some((h) => {
    if (SZAM.test(a) && SZAM.test(h)) {
      return Number(a.replace(',', '.')) === Number(h.replace(',', '.'))
    }
    return a === h
  })
}

const kulcs = (sor, oszlop) => `${sor}:${oszlop}`

/**
 * @param {{ sor_sorszam: number, oszlop_sorszam: number, valasz: string|number|null }[]} valasz
 *        A diák cellaválaszai (nem null, azt az index.js kezeli)
 * @param {{ feladatId: number, pont: number, cellak: { sor_sorszam: number, oszlop_sorszam: number, ertek: string|null, lathato: boolean }[] }} megoldas
 * @returns {{ elertPont: number, adottValasz: string[] }}
 */
export function javitTablazatos(valasz, megoldas) {
  // A kitöltendő cellák: rejtettek, és van megoldásuk
  const rejtettCellak = new Map(
    (megoldas.cellak ?? [])
      .filter((c) => c.lathato !== true && c.ertek !== null && c.ertek !== undefined && String(c.ertek).trim() !== '')
      .map((c) => [kulcs(c.sor_sorszam, c.oszlop_sorszam), c]),
  )

  if (rejtettCellak.size === 0) {
    throw new Error(`A(z) ${megoldas.feladatId} feladatnak nincs kitöltendő (rejtett) cellája`)
  }

  let joCellak = 0
  const kitoltott = []

  for (const cella of valasz) {
    const megoldasCella = rejtettCellak.get(kulcs(cella.sor_sorszam, cella.oszlop_sorszam))

    // Ismeretlen vagy látható cellára érkező választ figyelmen kívül hagyjuk
    if (!megoldasCella) continue

    // Üres cella: nem mentjük, nem ér pontot
    if (cella.valasz === null || cella.valasz === undefined || String(cella.valasz).trim() === '') continue

    kitoltott.push({ sor: cella.sor_sorszam, oszlop: cella.oszlop_sorszam, valasz: String(cella.valasz) })

    if (egyezik(cella.valasz, megoldasCella.ertek)) joCellak++
  }

  kitoltott.sort((a, b) => a.sor - b.sor || a.oszlop - b.oszlop)

  return {
    elertPont: Math.min(joCellak, Number(megoldas.pont)),
    adottValasz: kitoltott.map((c) => JSON.stringify(c)),
  }
}