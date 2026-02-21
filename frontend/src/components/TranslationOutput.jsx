import { useState, useEffect, useRef, useCallback } from "react";
import { LingoDotDevEngine } from "lingo.dev/sdk";

// Initialize Lingo.dev engine using full Vite proxy URL to bypass CORS
const lingo = new LingoDotDevEngine({
  apiKey: import.meta.env.VITE_LINGO_API_KEY,
  apiUrl: `${window.location.origin}/lingo-api`, // Proxied via vite.config.js
});

/**
 * TranslationOutput — translates the recognized sentence via Lingo.dev JS SDK
 * and speaks it using Web Speech API TTS.
 */
export default function TranslationOutput({ sentence, targetLocale }) {
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastTranslatedRef = useRef({ text: "", locale: "" });
  const debounceRef = useRef(null);

  // Locale → BCP-47 voice tag mapping
  const LOCALE_VOICE_MAP = {
    en: "en-US",
    hi: "hi-IN",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP",
    ar: "ar-SA",
    zh: "zh-CN",
    ko: "ko-KR",
    pt: "pt-BR",
  };

  // Translate using Lingo.dev SDK
  const translateSentence = useCallback(async (text, locale) => {
    if (!text?.trim()) {
      setTranslatedText("");
      return;
    }

    if (locale === "en") {
      setTranslatedText(text);
      return;
    }

    // Skip if same text+locale was already translated
    if (
      lastTranslatedRef.current.text === text &&
      lastTranslatedRef.current.locale === locale
    ) {
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await lingo.localizeText(text, {
        sourceLocale: "en",
        targetLocale: locale,
      });
      setTranslatedText(translated);
      lastTranslatedRef.current = { text, locale };
    } catch (err) {
      console.error("Lingo.dev translation failed:", err);
      setTranslatedText(text); // fallback to original
    } finally {
      setIsTranslating(false);
    }
  }, []);

  useEffect(() => {
    // Debounce translation calls (wait 800ms after sentence stops changing)
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (sentence?.trim()) {
        translateSentence(sentence, targetLocale);
      } else {
        setTranslatedText("");
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sentence, targetLocale, translateSentence]);

  // TTS — speak the translated text
  const handleSpeak = () => {
    const textToSpeak = targetLocale === "en" ? sentence : translatedText;
    if (!textToSpeak?.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = LOCALE_VOICE_MAP[targetLocale] || "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const displayText = targetLocale === "en" ? sentence : translatedText;

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-[160px] rounded-2xl bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-colors duration-300 hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]">
      <div className="p-4 bg-black/20 border-b border-white/5 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Translation Output
        </span>
        <button
          onClick={handleSpeak}
          disabled={!displayText?.trim() || isSpeaking}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
            ${
              isSpeaking
                ? "bg-amber-500 shadow-amber-500/20 animate-pulse"
                : "bg-[#14b8a5] hover:bg-[#0f766e] shadow-[#14b8a5]/20"
            }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isSpeaking ? "graphic_eq" : "volume_up"}
          </span>
          {isSpeaking ? "Speaking..." : "Speak"}
        </button>
      </div>

      <div className="p-5 flex-1 relative flex flex-col justify-center">
        {isTranslating ? (
          <div className="flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[#14b8a5] text-xl animate-spin">
              progress_activity
            </span>
            <span className="text-[#14b8a5] text-sm font-medium animate-pulse">
              Translating via Lingo.dev...
            </span>
          </div>
        ) : displayText ? (
          <p className="text-lg text-slate-200 leading-relaxed font-light">
            {displayText}
          </p>
        ) : (
          <p className="text-slate-500 italic font-light text-center">
            Awaiting gestures...
          </p>
        )}
      </div>
    </div>
  );
}
