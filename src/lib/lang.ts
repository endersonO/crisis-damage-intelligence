import type { Language } from "@/components/types";

// Shared language persistence so the app UI and the (separately mounted)
// install prompt stay in sync on the same ES/EN choice.
export const LANG_STORAGE_KEY = "rv-lang";
export const LANG_EVENT = "rv-langchange";

export function readStoredLang(): Language {
  if (typeof window === "undefined") return "es";
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "es" || stored === "en") return stored;
  return window.navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
}

export function persistLang(language: Language) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, language);
  } catch {
    // private mode / storage disabled — non-fatal
  }
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: language }));
}
