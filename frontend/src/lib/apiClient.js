import { supabase } from './supabaseClient';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Fetch wrapper, ami automatikusan hozzáadja a Supabase access tokent
 * Authorization headerként minden híváshoz, JSON törzs esetén beállítja
 * a Content-Type fejlécet, és egységesen kezeli a hibákat.
 *
 * Használat:
 *   const data = await apiFetch('/taskroutes/subjects');
 *   const data = await apiFetch('/taskroutes/ev?tantargy_id=3');
 *   const data = await apiFetch('/taskroutes/feladatok/ellenorzes', {
 *     method: 'POST',
 *     body: JSON.stringify({ valaszok }),
 *   });
 */
export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Nincs bejelentkezve a felhasználó.');
  }

  // A Headers objektum összefésüli a hívásnál megadott fejléceket a sajátjainkkal
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);

  // JSON fejléc csak szöveges törzsnél (FormData-nál a böngésző állítja be magától)
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Hiba történt: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) errorMessage = body.error;
    } catch {
      // a válasz nem JSON, marad az alapértelmezett üzenet
    }
    throw new Error(errorMessage);
  }

  // Üres válasz (pl. 204) esetén nincs mit JSON-ként olvasni
  if (response.status === 204) return null;

  return response.json();
}