"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  translations,
  type Translations,
  type SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "./translations";

// Types
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`
      : never
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<Translations>;

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  translations: Translations;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  isRTL: boolean;
}

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = "cjdquick_language";

// Create context
const I18nContext = createContext<I18nContextType | null>(null);

// Get nested value from object by dot notation path
function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split(".");
  let result: any = obj;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return path; // Return key as fallback
    }
  }

  return typeof result === "string" ? result : path;
}

// Detect browser language
function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  const browserLang = navigator.language.split("-")[0];

  // Check if browser language is supported
  const supported = SUPPORTED_LANGUAGES.find((l) => l.code === browserLang);
  return supported ? (browserLang as SupportedLanguage) : DEFAULT_LANGUAGE;
}

// Get stored language preference
function getStoredLanguage(): SupportedLanguage | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored as SupportedLanguage;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

// Store language preference
function storeLanguage(lang: SupportedLanguage): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // localStorage not available
  }
}

// Provider component
export function I18nProvider({
  children,
  defaultLanguage,
}: {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
}) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    defaultLanguage || DEFAULT_LANGUAGE
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    const stored = getStoredLanguage();
    const detected = detectBrowserLanguage();
    const initialLang = stored || detected;

    setLanguageState(initialLang);
    setIsInitialized(true);

    // Set document direction and lang attribute
    document.documentElement.lang = initialLang;
  }, []);

  // Update language
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    storeLanguage(lang);
    document.documentElement.lang = lang;
  }, []);

  // Translation function with parameter interpolation
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const currentTranslations = translations[language];
      let text = getNestedValue(currentTranslations as Record<string, any>, key);

      // Fallback to English if translation not found
      if (text === key && language !== "en") {
        text = getNestedValue(translations.en as Record<string, any>, key);
      }

      // Interpolate parameters
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          text = text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(value));
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value));
        });
      }

      return text;
    },
    [language]
  );

  // RTL languages (none currently supported, but ready for Arabic, Urdu, etc.)
  const isRTL = false;

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    translations: translations[language],
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL,
  };

  // Render with initial state to prevent hydration mismatch
  if (!isInitialized && typeof window !== "undefined") {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Hook to use only the t function (lighter weight)
export function useTranslation() {
  const { t, language } = useI18n();
  return { t, language };
}

// Export utilities
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };
export type { SupportedLanguage, Translations, TranslationKey, I18nContextType };
