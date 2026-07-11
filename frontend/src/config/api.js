export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiPost(path, body) {
  const url = `${API_BASE}${path}`;
  console.log(`[API] POST ${url}`, body);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[API] Network error POST ${url}:`, err);
    throw new Error('Cannot reach the server. Is the backend running on port 8000?');
  }

  let data = {};
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`[API] Non-JSON response from ${url}:`, text.slice(0, 200));
      throw new Error('Unexpected server response. Check backend logs.');
    }
  }

  console.log(`[API] POST ${url} -> ${res.status}`, data);

  if (!res.ok) {
    const detail = data.detail || data.message || `Request failed (${res.status})`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return data;
}
