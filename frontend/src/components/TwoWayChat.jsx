import { useState, useEffect, useRef } from "react";

const glassPanel =
  "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-colors duration-300 hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]";

/**
 * TwoWayChat — STT for the hearing user to speak back to the signing user.
 */
export default function TwoWayChat({ targetLocale }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef(null);

  // Locale → BCP-47 voice tag mapping to fix SpeechRecognition network errors
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

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    // Continuous mode often causes 'network' errors on localhost without HTTPS
    recognition.continuous = false;
    recognition.interimResults = true;

    // Web Speech API requires exact BCP-47 tags (e.g., 'hi-IN', not just 'hi')
    recognition.lang = LOCALE_VOICE_MAP[targetLocale] || "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage("");
    };

    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);

      if (event.error === "network") {
        setErrorMessage("Network error: Chrome requires HTTPS for STT.");
      } else if (event.error === "not-allowed") {
        setErrorMessage("Mic access denied.");
      } else {
        setErrorMessage(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [targetLocale]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript(""); // Clear past transcript on new session
      recognitionRef.current.start();
    }
  };

  return (
    <div
      className={`flex flex-col p-5 rounded-2xl ${glassPanel} min-h-[140px]`}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          Hearing User (STT)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-95 shadow-lg ${
              isListening
                ? "bg-red-500 shadow-red-500/30 animate-pulse"
                : "bg-white/10 hover:bg-white/20"
            }`}
            title={isListening ? "Stop listening" : "Start listening"}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isListening ? "text-white" : "text-slate-300"
              }`}
            >
              {isListening ? "mic_off" : "mic"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {errorMessage ? (
          <p className="text-sm text-red-400 italic font-light">
            <span className="material-symbols-outlined inline-block align-middle mr-1 text-[16px]">
              error
            </span>
            {errorMessage}
          </p>
        ) : transcript ? (
          <p className="text-lg text-emerald-300 leading-relaxed font-light">
            “{transcript}”
          </p>
        ) : (
          <p className="text-slate-500 italic font-light">
            {isListening ? "Listening..." : "Tap mic to speak..."}
          </p>
        )}
      </div>
    </div>
  );
}
