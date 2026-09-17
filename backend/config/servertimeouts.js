/**
 * Node HTTP szerver timeout beállításai.
 *
 * Miért nem middleware?
 * Ezek a beállítások a nyers `http.Server` objektumon élnek (amit
 * `app.listen()` ad vissza), nem az Express middleware láncban.
 * Slowloris-jellegű támadásnál a kliens szándékosan sosem küldi el
 * teljesen a kérést - így az Express middleware lánc el sem indul rá,
 * a védelemnek a socket szintjén kell megtörténnie.
 *
 * Sorrend-szabály (Node maga is figyelmeztet, ha nem tartod be):
 *   headersTimeout > keepAliveTimeout
 *   requestTimeout >= headersTimeout
 *
 * Használat a server.js-ben:
 *   const server = app.listen(3000, () => {...})
 *   applyServerTimeouts(server)
 */
export function applyServerTimeouts(server) {
  // Mennyi ideig várjon a HTTP fejlécek teljes beérkezésére.
  // Ha egy kliens csak darabonként, lassan küldi a fejléceket
  // (klasszikus Slowloris minta), ennyi idő után a kapcsolat megszakad.
  server.headersTimeout = 10_000 // 10 mp

  // Mennyi ideig várjon a TELJES kérésre (fejléc + body együtt).
  server.requestTimeout = 15_000 // 15 mp

  // Idle keep-alive kapcsolatot mennyi ideig tartson nyitva
  // a válasz elküldése után, mielőtt lezárja.
  server.keepAliveTimeout = 5_000 // 5 mp
}