import { supabase } from './supabaseClient';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Fetch wrapper, ami automatikusan hozzáadja a Supabase access tokent
 * Authorization headerként minden híváshoz, és egységesen kezeli a hibákat.
 *
 * Használat:
 *   const data = await apiFetch('/taskroutes/subjects');
 *   const data = await apiFetch('/taskroutes/ev?tantargy_id=3');
 */
export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Nincs bejelentkezve a felhasználó.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
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

  return response.json();
}