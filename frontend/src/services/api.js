const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const msg = body?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export const api = {
  listDistricts: () => request('/session/districts'),
  getDistrict: () => request('/session/district'),
  setDistrict: (district) => request('/session/district', {
    method: 'POST',
    body: JSON.stringify({ district }),
  }),
  chat: (query) => request('/chat', {
    method: 'POST',
    body: JSON.stringify({ query }),
  }),
};
