import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useWebSocket } from "../hooks/useWebSocket";
import { clearSession } from "../hooks/useSessionStorage";
import { API_BASE } from "../config";
import WebcamFeed from "../components/WebcamFeed";
import GestureDisplay from "../components/GestureDisplay";
import SentenceBuilder from "../components/SentenceBuilder";
import LanguageSwitcher from "../components/LanguageSwitcher";
import UnifiedTimeline from "../components/UnifiedTimeline";

const glassPanel =
  "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]";

export default function SignerDashboard({ roomId, sessionState }) {
  const navigate = useNavigate();
  const {
    isConnected,
    prediction,
    messages,
    presence,
    error,
    sendFrame,
    sendChatMessage,
    sendPresence,
    clearConversation,
  } = useWebSocket(roomId);
  const [targetLocale, setTargetLocale] = useState(
    sessionState.language || "en",
  );

  // Mode & Sentence Pipeline State
  const [mode, setMode] = useState("hybrid");
  const [currentWord, setCurrentWord] = useState("");
  const [sentence, setSentence] = useState([]);
  const [lastStaticLabel, setLastStaticLabel] = useState(null);

  // Broadcast presence
  const isSigning = sentence.length > 0 || currentWord.length > 0;
  useEffect(() => {
    sendPresence("signer", isSigning);
  }, [isSigning, sendPresence]);

  // Phrase Library History
  const [phraseHistory, setPhraseHistory] = useState([]);

  // Basic English TTS hook for committed phrases
  const speakText = (text) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Parse incoming predictions into the sentence array
  useEffect(() => {
    if (!prediction) return;

    if (
      prediction.type === "static" &&
      prediction.label &&
      prediction.label !== "Unknown"
    ) {
      if (prediction.label !== lastStaticLabel) {
        setCurrentWord((prev) => prev + prediction.label);
        setLastStaticLabel(prediction.label);
      }
    } else if (prediction.type === "dynamic" && prediction.word) {
      setSentence((prev) => [...prev, prediction.word]);
      setLastStaticLabel(null);
    } else {
      setLastStaticLabel(null);
    }
  }, [prediction]);

  const fullSentence = [...sentence, currentWord].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* ─── App Header Bar ─── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0a0a1a]/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14b8a5] opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isConnected ? "bg-[#14b8a5]" : "bg-red-500"
                }`}
              />
            </span>
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isConnected ? "text-[#14b8a5]" : "text-red-500"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Mode Selector */}
          <div className="flex bg-[#0f172a] rounded-lg p-1 border border-white/10">
            {["static", "hybrid", "dynamic"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                  mode === m
                    ? "bg-[#14b8a5] text-white shadow-md shadow-[#14b8a5]/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Badge */}
          <div className="hidden lg:block px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wide">
            Phase 5
          </div>

          {/* Room Code */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              toast.success(`Room code copied: ${roomId}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs font-mono cursor-pointer"
            title="Click to copy room code"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            {roomId}
          </button>

          {/* Leave Session */}
          <button
            onClick={() => {
              clearSession();
              toast.success("Left the session");
              navigate("/session");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-xs font-bold"
            title="Leave session"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            Leave
          </button>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher
          locale={targetLocale}
          onLocaleChange={setTargetLocale}
        />
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 overflow-hidden">
        {/* Left Column: Video Feed */}
        <section
          className={`flex flex-col flex-1 min-h-[300px] lg:h-full relative rounded-2xl overflow-hidden group ${glassPanel}`}
        >
          <WebcamFeed
            sendFrame={(f) => sendFrame(f, mode)}
            landmarks={prediction?.landmarks || []}
            poseLandmarks={prediction?.pose_landmarks || []}
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
          <SentenceBuilder
            sentence={sentence}
            currentWord={currentWord}
            onSpace={() => {
              if (currentWord) {
                setSentence((prev) => [...prev, currentWord]);
                setCurrentWord("");
                setLastStaticLabel(null);
              }
            }}
            onBackspace={() => {
              setCurrentWord("");
              setLastStaticLabel(null);
            }}
            onClearDraft={() => {
              setSentence([]);
              setCurrentWord("");
              setLastStaticLabel(null);
              fetch(`${API_BASE}/api/clear-sentence`, { method: "POST" }).catch(() => {});
            }}
            onSendMessage={() => {
              if (sentence.length > 0 || currentWord) {
                const finalSentence = [...sentence, currentWord]
                  .filter(Boolean)
                  .join(" ");
                if (finalSentence) {
                  if (!isConnected) {
                    toast.error("Not connected. Cannot send message.");
                    return;
                  }
                  // Push to unified timeline via WebSocket
                  sendChatMessage({
                    id: Math.random().toString(36).substring(2, 9),
                    roomId: roomId,
                    senderRole: "signer",
                    senderName: sessionState.displayName,
                    inputType: "gesture",
                    originalText: finalSentence,
                    originalLocale: "en", // Gestures are mapped to English first
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  });
                }
              }
              setSentence([]);
              setCurrentWord("");
              setLastStaticLabel(null);
              fetch(`${API_BASE}/api/clear-sentence`, { method: "POST" }).catch(() => {});
            }}
          />

          {/* Unified Timeline Container */}
          <div className="flex-1 overflow-hidden flex flex-col relative h-full">
            <UnifiedTimeline
              messages={messages}
              currentUserRole="signer"
              currentLocale={targetLocale}
              onClearConversation={clearConversation}
            />
            {/* Presence Indicator */}
            {presence?.listener && (
              <div className="absolute bottom-2 right-4 text-xs font-bold text-[#14b8a5] bg-[#14b8a5]/10 px-3 py-1.5 rounded-full animate-pulse border border-[#14b8a5]/30 flex items-center gap-2 backdrop-blur-md">
                <span className="material-symbols-outlined text-[14px]">
                  keyboard
                </span>
                Listener is typing...
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
