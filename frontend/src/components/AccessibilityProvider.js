"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiRequest } from "@/services/api";

const AccessibilityContext = createContext(null);

const DEFAULT_PREFERENCES = {
  font_size: 18,
  line_spacing: 1.8,
  high_contrast: false,
  dyslexia_friendly_font: false,
  text_to_speech: false,
};

function normalizePrefs(raw) {
  return {
    font_size:             Number(raw?.font_size)            || DEFAULT_PREFERENCES.font_size,
    line_spacing:          Number(raw?.line_spacing)         || DEFAULT_PREFERENCES.line_spacing,
    high_contrast:         Number(raw?.high_contrast)        === 1 || raw?.high_contrast === true,
    dyslexia_friendly_font: Number(raw?.dyslexia_friendly_font) === 1 || raw?.dyslexia_friendly_font === true,
    text_to_speech:        Number(raw?.text_to_speech)       === 1 || raw?.text_to_speech === true,
  };
}

export function AccessibilityProvider({ children }) {
  const [preferences,        setPreferences]        = useState(DEFAULT_PREFERENCES);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [error,              setError]              = useState("");

  const loadPreferences = useCallback(async () => {
    try {
      // API mengembalikan { preferences: { font_size, … } }
      const data = await apiRequest("/preferences/me");
      setPreferences(normalizePrefs(data.preferences));
      setError("");
    } catch (err) {
      // 401 = belum login; jangan tampilkan error
      if (err.status !== 401) {
        setError(err.message || "Preferensi belum dapat dimuat.");
      }
    } finally {
      setLoadingPreferences(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreferences = useCallback(
    async (changes) => {
      const updated = { ...preferences, ...changes };
      // Optimistic update agar UI langsung responsif
      setPreferences(updated);

      try {
        const data = await apiRequest("/preferences/me", {
          method: "PUT",
          body: JSON.stringify(updated),
        });
        // Sinkronkan dengan nilai yang dikembalikan server
        setPreferences(normalizePrefs(data.preferences));
        setError("");
        return true;
      } catch (err) {
        setError(err.message || "Gagal menyimpan preferensi.");
        // Rollback ke nilai sebelumnya jika gagal
        await loadPreferences();
        return false;
      }
    },
    [preferences, loadPreferences],
  );

  /* ── CSS custom properties ─────────────────────────────────────────────── */
  const fontFamily = preferences.dyslexia_friendly_font
    ? "Arial, Verdana, sans-serif"
    : "inherit";

  return (
    <AccessibilityContext.Provider
      value={{ preferences, updatePreferences, loadingPreferences, error }}
    >
      <div
        className={preferences.high_contrast ? "accessibility-high-contrast" : ""}
        style={{
          "--access-font-size":   `${preferences.font_size}px`,
          "--access-line-height": preferences.line_spacing,
          "--access-font-family": fontFamily,
        }}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility harus digunakan di dalam AccessibilityProvider.",
    );
  }
  return context;
}
