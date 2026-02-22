import { useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import WebcamFeed from "./components/WebcamFeed";
import GestureDisplay from "./components/GestureDisplay";
import SentenceBuilder from "./components/SentenceBuilder";
import LanguageSwitcher from "./components/LanguageSwitcher";
import TranslationOutput from "./components/TranslationOutput";
import TwoWayChat from "./components/TwoWayChat";

const glassPanel =
  "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]";

export default function App() {
  const { isConnected, prediction, error, sendFrame } = useWebSocket();
  const [targetLocale, setTargetLocale] = useState("en");

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[linear-gradient(135deg,#0a0a1a_0%,#0d1b2a_100%)] text-slate-100 font-[Inter,sans-serif] selection:bg-[#14b8a5] selection:text-white">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a1a]/80 backdrop-blur-md z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#14b8a5] to-emerald-600 shadow-lg shadow-[#14b8a5]/20">
            <span className="material-symbols-outlined text-white text-2xl">
              sign_language
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            SignBridge Pro
            <span className="text-2xl animate-pulse">🤟</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14b8a5] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-[#14b8a5]" : "bg-red-500"}`}
              ></span>
            </span>
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${isConnected ? "text-[#14b8a5]" : "text-red-500"}`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Badge */}
          <div className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wide">
            Phase 4
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher
            locale={targetLocale}
            onLocaleChange={setTargetLocale}
          />
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 overflow-hidden">
        {/* Left Column: Video Feed */}
        <section
          className={`flex flex-col flex-1 min-h-[300px] lg:h-full relative rounded-2xl overflow-hidden group ${glassPanel}`}
        >
          <WebcamFeed
            sendFrame={sendFrame}
            landmarks={prediction?.landmarks || []}
            isConnected={isConnected}
          />
          {error && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-md border border-red-500/50 rounded-xl p-4 text-red-400 font-mono text-sm text-center">
              System Error
              <br />
              {error}
            </div>
          )}
        </section>

        {/* Right Column: Intelligence Panel */}
        <aside className="flex flex-col gap-4 lg:w-[420px] shrink-0 h-full overflow-y-auto pr-1">
          {/* Card 1: Gesture Recognition */}
          <GestureDisplay
            label={prediction?.label}
            word={prediction?.word}
            confidence={prediction?.confidence}
            type={prediction?.type}
          />

          {/* Card 2: Sentence Builder */}
          <SentenceBuilder sentence={prediction?.sentence || ""} />

          {/* Card 3: Translation Output (Lingo.dev SDK + TTS) */}
          <TranslationOutput
            sentence={
              prediction?.sentence ||
              "Hello, welcome to SignBridge. How are you?"
            }
            targetLocale={targetLocale}
          />

          {/* Card 4: Speech-To-Text STT (Web Speech API) */}
          <TwoWayChat targetLocale={targetLocale} />

          {/* Card 5: System Status Compact */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`${glassPanel} p-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/5 cursor-default`}
            >
              <span
                className={`material-symbols-outlined text-xl ${isConnected ? "text-emerald-400" : "text-red-400"}`}
              >
                dns
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Backend
              </span>
              <span className="text-xs text-white font-mono">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
            <div
              className={`${glassPanel} p-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/5 cursor-default transition-colors duration-300 ${prediction?.type === "dynamic" ? "bg-purple-900/30 border-purple-500/30" : ""}`}
            >
              <span
                className={`material-symbols-outlined text-xl ${prediction?.type === "dynamic" ? "text-purple-400" : "text-blue-400"}`}
              >
                psychology
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                AI Model
              </span>
              <span className="text-xs text-white font-mono">
                {prediction?.type === "dynamic" ? "LSTM" : "TFLite"}
              </span>
            </div>
            <div
              className={`${glassPanel} p-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/5 cursor-default`}
            >
              <span className="material-symbols-outlined text-purple-400 text-xl">
                translate
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Lingo.dev
              </span>
              <span className="text-xs text-white font-mono">Active</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
