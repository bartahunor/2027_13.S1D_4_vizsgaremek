const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function publicFetch(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    let errorMessage = `Hiba történt: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) errorMessage = body.error;
    } catch {
      // a válasz nem JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}