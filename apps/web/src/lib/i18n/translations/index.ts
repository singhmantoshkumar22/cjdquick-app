// Translation exports
export { en, type Translations } from "./en";
export { hi } from "./hi";
export { ta } from "./ta";
export { te } from "./te";
export { bn } from "./bn";
export { mr } from "./mr";
export { kn } from "./kn";
export { gu } from "./gu";

import { en } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";
import { te } from "./te";
import { bn } from "./bn";
import { mr } from "./mr";
import { kn } from "./kn";
import { gu } from "./gu";

export const translations = {
  en,
  hi,
  ta,
  te,
  bn,
  mr,
  kn,
  gu,
} as const;

export type SupportedLanguage = keyof typeof translations;

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
