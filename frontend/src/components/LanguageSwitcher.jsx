import { useState } from "react";

const LOCALES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

/**
 * LanguageSwitcher — lets the user pick the target translation language.
 * Uses plain React state — no compiler needed.
 */
export default function LanguageSwitcher({ locale, onLocaleChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-[#14b8a5] text-[20px]">
          translate
        </span>
        <span className="text-sm font-medium text-slate-300">
          {currentLocale.flag} {currentLocale.label}
        </span>
        <span
          className={`material-symbols-outlined text-slate-500 text-[18px] transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Click-away overlay */}
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-48 z-[100] animate-[fade-in_0.15s_ease-out]">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1b2a]/95 backdrop-blur-xl shadow-2xl shadow-black/50">
              {LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => {
                    onLocaleChange(loc.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/10 cursor-pointer
                    ${locale === loc.code ? "text-[#14b8a5] font-semibold bg-[#14b8a5]/10" : "text-slate-300"}`}
                >
                  <span className="text-base">{loc.flag}</span>
                  <span>{loc.label}</span>
                  {locale === loc.code && (
                    <span className="material-symbols-outlined text-[#14b8a5] text-[16px] ml-auto">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
