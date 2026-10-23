// testCorrector.js
// Teszt indítása: létrehoz egy "folyamatban" állapotú tesztet,
// a kiadott feladatokkal és üres válaszokkal, egyetlen tranzakcióban.

import sql from '../db.js'; // 

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

  // Teszt státusza "folyamatban" -> "javitas"

  /** Idő számítás
   * Teszt kezdési idejének lekérése
   * Teszt kitöltési idő számítása
   * Kis eltérés estén még a kliens válaszsa helyes, nagyobbnál az addatbázisé a mérvadó
   */
  
  /** Feladat ellenőrzési logika:
   * 1. Minden feladat megoldásának és pontjának lekérése a folyamatban lévő tesztből (teszt_feladatok)
   * 2. Feladat típusunkénti ellenőrzés és javítás
   * 3. Javított feladatok egységese válasszal a függvényektől
   * 4. Egy tranzakcióban teszt mentés és státusz váltás "befejezett"-re
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