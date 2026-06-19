/**
 * App-shell internationalization (i18next + react-i18next).
 *
 * This translates ExcaliDash's OWN UI (login, dashboard, settings, save status,
 * etc.) — it is intentionally separate from the Excalidraw canvas language
 * (handled by `@excalidraw/excalidraw` via LanguageSelector). The two use
 * different localStorage keys so changing one never affects the other.
 *
 * Supported: English (default) and Brazilian Portuguese. The chosen language is
 * persisted to localStorage so it survives reloads.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt-BR", label: "Português (Brasil)" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

/** localStorage key for the app-shell language (NOT the Excalidraw canvas one). */
export const UI_LANGUAGE_STORAGE_KEY = "excalidash-ui-lang";

export const resources = {
  en: { translation: en },
  "pt-BR": { translation: ptBR },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "pt-BR"],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: UI_LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
