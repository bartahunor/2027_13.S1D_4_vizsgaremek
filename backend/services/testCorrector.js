// testService.js
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
        insert into tesztek (felhasznalo_id, tantargy_id, nev, datum, kitoltesi_ido, status)
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

    return { id: teszt.id, status: 'folyamatban', feladatIdk: egyediFeladatIdk };
  } catch (err) {
    if (err instanceof TestServiceError) throw err;
    throw new TestServiceError('Nem sikerült elindítani a tesztet', {
      code: 'TEST_START_FAILED',
      status: 500,
      cause: err,
    });
  }
}