/**
 * Centralised runtime configuration.
 *
 * In development the values come from .env (VITE_* prefix).
 * On a cloud deploy you set those env vars at build time (e.g. Vercel / Railway).
 *
 * If no env vars are set we derive sensible defaults from window.location so
 * the frontend can talk to a backend co-hosted on the same domain/port.
 */

function deriveApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Fallback: same origin (works when frontend is served by the backend)
  return window.location.origin;
}

function deriveWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  // Fallback: derive from current page URL
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
}

export const API_BASE = deriveApiUrl();
export const WS_BASE = deriveWsUrl();
