"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useI18n, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "inline" | "compact";
  className?: string;
  showNativeName?: boolean;
}

export default function LanguageSwitcher({
  variant = "dropdown",
  className = "",
  showNativeName = true,
}: LanguageSwitcherProps) {
  const { language, setLanguage, supportedLanguages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = supportedLanguages.find((l) => l.code === language);

  // Compact variant - just shows current language code
  if (variant === "compact") {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase">{language}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-50">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 ${
                  language === lang.code ? "bg-cyan-50 text-cyan-700" : "text-gray-700"
                }`}
              >
                <span>{showNativeName ? lang.nativeName : lang.name}</span>
                {language === lang.code && <Check className="h-4 w-4 text-cyan-600" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Inline variant - horizontal list of language options
  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 text-gray-400" />
        {supportedLanguages.map((lang, index) => (
          <span key={lang.code} className="flex items-center">
            <button
              onClick={() => setLanguage(lang.code)}
              className={`text-sm ${
                language === lang.code
                  ? "text-cyan-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {lang.nativeName}
            </button>
            {index < supportedLanguages.length - 1 && (
              <span className="ml-2 text-gray-300">|</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:border-gray-300 transition-colors"
        aria-label="Select language"
      >
        <Globe className="h-5 w-5 text-gray-500" />
        <span className="text-sm text-gray-700">
          {showNativeName ? currentLang?.nativeName : currentLang?.name}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50 max-h-64 overflow-y-auto">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 ${
                language === lang.code ? "bg-cyan-50" : ""
              }`}
            >
              <div>
                <p className={`text-sm ${language === lang.code ? "text-cyan-700 font-medium" : "text-gray-700"}`}>
                  {lang.nativeName}
                </p>
                {showNativeName && lang.nativeName !== lang.name && (
                  <p className="text-xs text-gray-400">{lang.name}</p>
                )}
              </div>
              {language === lang.code && <Check className="h-4 w-4 text-cyan-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Quick language selector for mobile (just shows top 4 languages)
export function QuickLanguageSelector({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useI18n();

  // Show top 4 most common languages
  const quickLanguages: SupportedLanguage[] = ["en", "hi", "ta", "te"];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {quickLanguages.map((code) => {
        const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
        return (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={`px-2 py-1 text-xs rounded ${
              language === code
                ? "bg-cyan-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {code === "en" ? "EN" : lang?.nativeName.slice(0, 4)}
          </button>
        );
      })}
    </div>
  );
}

// Language badge that shows current language
export function LanguageBadge({ className = "" }: { className?: string }) {
  const { language, translations } = useI18n();

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 ${className}`}>
      <Globe className="h-3 w-3" />
      {translations.languages[language]}
    </span>
  );
}
