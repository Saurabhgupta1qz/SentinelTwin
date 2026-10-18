const BASE = ((import.meta as any).env?.VITE_API_BASE_URL || 'https://sentineltwin.onrender.com').replace(/\/$/, '');

export const api = (path: string, init?: RequestInit) =>
  fetch(`${BASE}${path}`, init);

export async function apiJson(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} on ${path}`);
  }
  return res.json();
}
