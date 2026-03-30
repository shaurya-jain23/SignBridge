import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { FALLBACK_LOCALES } from "../constants/locales";

export function useLocales() {
  const [locales, setLocales] = useState(FALLBACK_LOCALES);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocales() {
      try {
        const res = await fetch(`${API_BASE}/api/locales`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.locales) || data.locales.length === 0) return;

        const normalized = data.locales
          .filter((loc) => loc?.code && loc?.label)
          .map((loc) => ({
            code: String(loc.code),
            label: String(loc.label),
            flag: loc.flag ? String(loc.flag) : String(loc.code).toUpperCase(),
          }));

        if (!cancelled && normalized.length > 0) {
          setLocales(normalized);
        }
      } catch {
        // Fallback locales remain in place.
      }
    }

    fetchLocales();

    return () => {
      cancelled = true;
    };
  }, []);

  return locales;
}
