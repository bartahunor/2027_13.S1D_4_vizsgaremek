// testCorrector.js
// Teszt indítása: létrehoz egy "folyamatban" állapotú tesztet,
// a kiadott feladatokkal és üres válaszokkal, egyetlen tranzakcióban.

import sql from '../db.js'; 
import { javit, JavitoHiba } from './correctors/index.js';

export class TestServiceError extends Error {
  constructor(message, { code = 'TEST_SERVICE_ERROR', status = 500, cause } = {}) {
    super(message);
    this.name = 'TestServiceError';
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

const isPositiveInt = (n) => Number.isInteger(n) && n > 0;

// Ennyi másodpercnél kisebb eltérésnél elfogadjuk a kliens által mért időt
const IDO_TOLERANCIA_MASODPERC = 10;

/**
 * Új teszt indítása.
 *
 * @param {object}   params
 * @param {string}   params.userId      A validált tokenből származó user id (NE a request body-ból!)
 * @param {number}   params.tantargyId  A teszt tantárgya
 * @param {number[]} params.feladatIdk  A kiadott feladatok azonosítói (sorrendben)
 * @param {string}  [params.nev]        A teszt neve
 * @returns {Promise<{id: number, status: 'folyamatban', feladatIdk: number[]}>}
 */
export async function startTest({ userId, tantargyId, feladatIdk, nev = 'Teszt' }) {
  if (!userId || typeof userId !== 'string') {
    throw new TestServiceError('Hiányzó vagy érvénytelen userId', { code: 'INVALID_USER_ID', status: 400 });
  }
  if (!isPositiveInt(tantargyId)) {
    throw new TestServiceError('Érvénytelen tantargyId', { code: 'INVALID_TANTARGY_ID', status: 400 });
  }
  if (!Array.isArray(feladatIdk) || feladatIdk.length === 0 || !feladatIdk.every(isPositiveInt)) {
    throw new TestServiceError('A feladatIdk nem üres, egész számokból álló tömb kell legyen', {
      code: 'INVALID_FELADAT_IDK',
      status: 400,
    });
  }

  // Duplikátumok kiszűrése, a sorrend megtartásával
  const egyediFeladatIdk = [...new Set(feladatIdk)];

  try {
    const teszt = await sql.begin(async (tx) => {
      // Minden feladatnak léteznie kell, és az adott tantárgyhoz kell tartoznia
      const [{ db }] = await tx`
        select count(*)::int as db
        from feladatok
        join temakorok on temakorok.id = feladatok.temakor_id
        where feladatok.id = any(${egyediFeladatIdk}::int4[])
          and temakorok.tantargy_id = ${tantargyId}
      `;

      if (db !== egyediFeladatIdk.length) {
        throw new TestServiceError('Egy vagy több feladat nem létezik, vagy nem ehhez a tantárgyhoz tartozik', {
          code: 'UNKNOWN_FELADAT',
          status: 400,
        });
      }

      const [ujTeszt] = await tx`
        insert into tesztek (felhasznalo_id, tantargy_id, nev, datum, kitoltesi_ido, statusz)
        values (${userId}, ${tantargyId}, ${nev}, now(), null, 'folyamatban')
        returning id
      `;

      // Üres válaszok, a kiadás sorrendjét megőrizve
      await tx`
        insert into teszt_feladatok (teszt_id, feladat_id)
        select ${ujTeszt.id}, x.feladat_id
        from unnest(${egyediFeladatIdk}::int4[]) with ordinality as x(feladat_id, sorrend)
        order by x.sorrend
      `;

      return ujTeszt;
    });

    return { id: teszt.id, statusz: 'folyamatban', feladatIdk: egyediFeladatIdk };
  } catch (err) {
    if (err instanceof TestServiceError) throw err;
    throw new TestServiceError('Nem sikerült elindítani a tesztet', {
      code: 'TEST_START_FAILED',
      status: 500,
      cause: err,
    });
  }
}


/* =========================
   BEÉRKEZŐ TESZT PÁROSÍTÁSA
========================= */
 
/**
 * Ellenőrzi, hogy a beadás ténylegesen az adott felhasználó adott tesztjéhez érkezett-e.
 *  - a teszt létezik és a userId-hoz tartozik (idegen vagy nem létező teszt egyaránt 404,
 *    hogy ne derüljön ki, létezik-e más felhasználó tesztje ezzel az id-val)
 *  - a teszt még "folyamatban" van (nem lehet kétszer beadni)
 *  - minden beküldött feladat_id a teszthez kiadott feladatok közé tartozik
 *
 * @returns {Promise<{tantargyId: number, feladatIdk: number[]}>}
 */
export async function parositTesztet({ userId, testId, valaszok }) {
  try {
    const [teszt] = await sql`
      select id, tantargy_id, statusz
      from tesztek
      where id = ${testId}
        and felhasznalo_id = ${userId}::uuid
    `;
 
    if (!teszt) {
      throw new TestServiceError('A teszt nem található', { code: 'TEST_NOT_FOUND', status: 404 });
    }
    if (teszt.statusz !== 'folyamatban') {
      throw new TestServiceError('Ez a teszt már nem adható be', { code: 'TEST_NOT_IN_PROGRESS', status: 409 });
    }
 
    const sorok = await sql`
      select feladat_id
      from teszt_feladatok
      where teszt_id = ${testId}
    `;
    const kiadott = new Set(sorok.map((s) => s.feladat_id));
 
    const idegen = valaszok.find((v) => !kiadott.has(v.feladat_id));
    if (idegen) {
      throw new TestServiceError(
        `A(z) ${idegen.feladat_id} feladat nem tartozik ehhez a teszthez`,
        { code: 'FELADAT_NOT_IN_TEST', status: 400 },
      );
    }
 
    return { tantargyId: teszt.tantargy_id, feladatIdk: [...kiadott] };
  } catch (err) {
    if (err instanceof TestServiceError) throw err;
    throw new TestServiceError('Nem sikerült a beadást a teszthez párosítani', {
      code: 'TEST_MATCH_FAILED',
      status: 500,
      cause: err,
    });
  }
}
 
/**
 * A teszthez kiadott feladatok megoldásainak és pontjainak betöltése az adatbázisból.
 * A teszt_feladatok a kiadott feladatokat adja, így hiányzó (be nem küldött) feladat is szerepel.
 *
 * @param {number} testId
 * @returns {Promise<Map<number, {
 *   feladatId: number, tipus: string, pont: number,
 *   helyesValaszok: string[]|null,
 *   cellak: {sor_sorszam: number, oszlop_sorszam: number, ertek: string|null, lathato: boolean}[]
 * }>>} feladat_id -> megoldás
 */
async function betoltMegoldasokat(testId) {
  try {
    const feladatok = await sql`
      select
        f.id as feladat_id,
        ft.nev as tipus,
        f.pont,
        f.helyes_valaszok
      from teszt_feladatok tf
      join feladatok f on f.id = tf.feladat_id
      join feladat_tipusok ft on ft.id = f.tipus_id
      where tf.teszt_id = ${testId}
    `;
 
    // Táblázatos feladatok cellái (a többi típusnál nincs találat)
    const cellak = await sql`
      select c.feladat_id, c.sor_sorszam, c.oszlop_sorszam, c.ertek, c.lathato
      from teszt_feladatok tf
      join tablazatos_feladat_cellak c on c.feladat_id = tf.feladat_id
      where tf.teszt_id = ${testId}
      order by c.feladat_id, c.sor_sorszam, c.oszlop_sorszam
    `;
 
    const megoldasok = new Map();
    for (const f of feladatok) {
      megoldasok.set(f.feladat_id, {
        feladatId: f.feladat_id,
        tipus: f.tipus,
        pont: f.pont,
        helyesValaszok: f.helyes_valaszok,
        cellak: [],
      });
    }
    for (const c of cellak) {
      megoldasok.get(c.feladat_id)?.cellak.push({
        sor_sorszam: c.sor_sorszam,
        oszlop_sorszam: c.oszlop_sorszam,
        ertek: c.ertek,
        lathato: c.lathato,
      });
    }
 
    return megoldasok;
  } catch (err) {
    throw new TestServiceError('Nem sikerült betölteni a feladatok megoldásait', {
      code: 'SOLUTIONS_LOAD_FAILED',
      status: 500,
      cause: err,
    });
  }
}
 
/**
 * A párosított beadás feldolgozásának belépési pontja.
 * Csak a parositTesztet sikeres lefutása után hívható.
 *
 * @param {object}   parositottBeadas
 * @param {string}   parositottBeadas.userId
 * @param {number}   parositottBeadas.testId
 * @param {number}   parositottBeadas.tantargyId
 * @param {number[]} parositottBeadas.feladatIdk     A teszthez kiadott feladatok
 * @param {object[]} parositottBeadas.valaszok       [{ feladat_id, tipus, valasz }, ...]
 * @param {number}   parositottBeadas.idoMasodperc
 */
export async function feldolgozBeadast(parositottBeadas) {
  const { userId, testId, idoMasodperc } = parositottBeadas;
 
  // Csak helyi változók: nincs megosztott (modul szintű) állapot, így egyszerre több
  // felhasználó javítása sem keveredhet össze.
  let szerverMasodperc;
 
  // Teszt státusza "folyamatban" -> "javitas"
  // Egyetlen atomi UPDATE: ha két kérés párhuzamosan érkezik, csak az egyik találja
  // még "folyamatban" állapotban a tesztet, a másik 0 sort módosít és elutasításra kerül.
  // Ugyanebben a lekérdezésben számoljuk ki az adatbázis órájával az eltelt időt a teszt
  // kezdése (datum) óta, így nincs eltérés az alkalmazás és az adatbázis órája között.
  try {
    const lefoglalt = await sql`
      update tesztek
      set statusz = 'javitas'
      where id = ${testId}
        and felhasznalo_id = ${userId}::uuid
        and statusz = 'folyamatban'
      returning id, round(extract(epoch from (now() - datum)))::int as szerver_masodperc
    `;
 
    if (lefoglalt.length === 0) {
      throw new TestServiceError('Ez a teszt már nem adható be', { code: 'TEST_NOT_IN_PROGRESS', status: 409 });
    }
 
    szerverMasodperc = Math.max(0, lefoglalt[0].szerver_masodperc);
  } catch (err) {
    if (err instanceof TestServiceError) throw err;
    throw new TestServiceError('Nem sikerült a teszt állapotát átállítani', {
      code: 'TEST_STATUS_UPDATE_FAILED',
      status: 500,
      cause: err,
    });
  }
 
  // Kitöltési idő (másodperc): kis eltérésnél a kliens értéke, nagyobbnál az adatbázisé a mérvadó
  const kitoltesiIdo = Math.abs(idoMasodperc - szerverMasodperc) <= IDO_TOLERANCIA_MASODPERC
    ? idoMasodperc
    : szerverMasodperc;
 
  // TODO: a kitoltesiIdo mentése a tesztek.kitoltesi_ido mezőbe a záró tranzakcióban
  
  // 1. Minden feladat megoldásának és pontjának lekérése a tesztből (teszt_feladatok)
  const megoldasok = await betoltMegoldasokat(testId);
  // 2-3. Feladatonkénti javítás a típusnak megfelelő javító függvénnyel.
  // A kiadott feladatokon megyünk végig (nem a beküldötteken), így a be nem küldött
  // feladat is kap eredményt (0 pont).
  const beadottValaszok = new Map(parositottBeadas.valaszok.map((v) => [v.feladat_id, v]));
  const javitottak = [];
 
  for (const megoldas of megoldasok.values()) {
    const beadott = beadottValaszok.get(megoldas.feladatId);
 
    // A kliens által küldött típus egyezzen az adatbázisban lévővel
    if (beadott && beadott.tipus !== megoldas.tipus) {
      throw new TestServiceError(
        `A(z) ${megoldas.feladatId} feladat típusa nem egyezik (várt: ${megoldas.tipus}, kapott: ${beadott.tipus})`,
        { code: 'TIPUS_MISMATCH', status: 400 },
      );
      
    }
 
    try {
      const eredmeny = javit(megoldas, beadott?.valasz);
      javitottak.push({ feladatId: megoldas.feladatId, tipus: megoldas.tipus, pont: megoldas.pont, ...eredmeny });
    } catch (err) {
      throw new TestServiceError('Nem sikerült kijavítani a tesztet', {
        code: err instanceof JavitoHiba ? err.code : 'CORRECTION_FAILED',
        status: 500,
        cause: err,
      });
    }
  }
 
  /** Feladat ellenőrzési logika (folytatás):
   * 4. Egy tranzakcióban teszt mentés (javitottak, kitoltesiIdo) és státusz váltás "befejezett"-re
   * 5. Kliens válasz
   */
}
 
/**
 * Beérkező (már validált) beadás fogadása.
 * Egyelőre csak a belépési pont: a párosítás és a javítás később kerül ide.
 *
 * @param {object}   params
 * @param {string}   params.userId       A validált tokenből származó user id
 * @param {number}   params.testId       A beadott teszt azonosítója (a startTest által visszaadott id)
 * @param {object[]} params.valaszok     Validált válaszok: [{ feladat_id, tipus, valasz }, ...]
 * @param {number}   params.idoMasodperc Az eltelt idő másodpercben
 * @returns {Promise<{testId: number, fogadottFeladatok: number, idoMasodperc: number}>}
 */
export async function receiveSubmission({ userId, testId, valaszok, idoMasodperc }) {
  if (!userId || typeof userId !== 'string') {
    throw new TestServiceError('Hiányzó vagy érvénytelen userId', { code: 'INVALID_USER_ID', status: 400 });
  }
  if (!isPositiveInt(testId)) {
    throw new TestServiceError('Érvénytelen testId', { code: 'INVALID_TEST_ID', status: 400 });
  }
 
  // Csak akkor megyünk tovább, ha a beadás tényleg ehhez a felhasználóhoz és teszthez tartozik
  const { tantargyId, feladatIdk } = await parositTesztet({ userId, testId, valaszok });
 
  // Innentől a beadás bizonyítottan egy futó teszthez tartozik: ezt az objektumot kapják a további folyamatok. Ide csak párosított beadás juthat el.
  const parositottBeadas = {
    userId,
    testId,
    tantargyId,
    feladatIdk,
    valaszok,
    idoMasodperc,
  };
 
  await feldolgozBeadast(parositottBeadas);
 
  return { testId, fogadottFeladatok: valaszok.length, idoMasodperc };
}