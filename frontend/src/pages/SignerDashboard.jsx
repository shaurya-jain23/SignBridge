import { useState, useEffect, useRef } from "react";
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

const STATIC_HOLD_MS = 2000;

export default function SignerDashboard({ roomId, sessionState }) {
  const navigate = useNavigate();
  const {
    participantId,
    isConnected,
    prediction,
    messages,
    memberCount,
    presence,
    error,
    sendFrame,
    sendChatMessage,
    sendPresence,
    clearConversation,
  } = useWebSocket(roomId, {
    role: "signer",
    name: sessionState.displayName,
  });
  const [targetLocale, setTargetLocale] = useState(
    sessionState.language || "en",
  );

  // Mode & Sentence Pipeline State
  const [mode, setMode] = useState("hybrid");
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(true);
  const [currentWord, setCurrentWord] = useState("");
  const [sentence, setSentence] = useState([]);
  const staticHoldRef = useRef({ label: null, startAt: 0 });
  const committedStaticLabelRef = useRef(null);

  // Broadcast presence
  const isSigning = sentence.length > 0 || currentWord.length > 0;
  useEffect(() => {
    sendPresence("signer", isSigning, sessionState.displayName);
  }, [isSigning, sendPresence, sessionState.displayName]);

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
    if (!prediction || !isCaptureEnabled) return;

    if (
      prediction.type === "static" &&
      prediction.label &&
      prediction.label !== "Unknown"
    ) {
      const detectedLabel = prediction.label;
      const now = Date.now();

      // Prevent repeated commits while the same held sign stays in frame.
      if (committedStaticLabelRef.current === detectedLabel) {
        return;
      }

      if (staticHoldRef.current.label !== detectedLabel) {
        staticHoldRef.current = { label: detectedLabel, startAt: now };
        return;
      }

      if (now - staticHoldRef.current.startAt >= STATIC_HOLD_MS) {
        setCurrentWord((prev) => prev + detectedLabel);
        committedStaticLabelRef.current = detectedLabel;
        staticHoldRef.current = { label: null, startAt: 0 };
      }
    } else if (prediction.type === "dynamic" && prediction.word) {
      setSentence((prev) => [...prev, prediction.word]);
      committedStaticLabelRef.current = null;
      staticHoldRef.current = { label: null, startAt: 0 };
    } else {
      // Reset when no valid static gesture is detected to allow next hold commit.
      committedStaticLabelRef.current = null;
      staticHoldRef.current = { label: null, startAt: 0 };
    }
  }, [prediction, isCaptureEnabled]);

  // If capture is paused, clear static hold state.
  useEffect(() => {
    if (isCaptureEnabled) return;
    committedStaticLabelRef.current = null;
    staticHoldRef.current = { label: null, startAt: 0 };
  }, [isCaptureEnabled]);

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* ─── App Header Bar ─── */}
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between px-4 md:px-6 py-3 border-b border-white/5 bg-[#0a0a1a]/60 backdrop-blur-sm shrink-0 gap-3">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
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

          {/* Detection Toggle */}
          <button
            onClick={() => setIsCaptureEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wide ${
              isCaptureEnabled
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
            }`}
            title={isCaptureEnabled ? "Pause camera and detection" : "Resume camera and detection"}
          >
            <span className="material-symbols-outlined text-[14px]">
              {isCaptureEnabled ? "videocam" : "videocam_off"}
            </span>
            {isCaptureEnabled ? "Detection On" : "Detection Paused"}
          </button>

          <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">
              sign_language
            </span>
            Signer View
          </div>

          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">group</span>
            {memberCount} {memberCount === 1 ? "Member" : "Members"}
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
        <div className="self-end xl:self-auto">
          <LanguageSwitcher
            locale={targetLocale}
            onLocaleChange={setTargetLocale}
          />
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] p-4 md:p-6 gap-4 md:gap-6 overflow-hidden">
        {/* Left Column: Camera + ML Controls */}
        <section className="min-h-0 flex flex-col gap-4">
          <section
            className={`relative rounded-2xl overflow-hidden min-h-[280px] h-[46vh] md:h-[50vh] xl:h-[52vh] max-h-[620px] group ${glassPanel}`}
          >
            <WebcamFeed
              sendFrame={(f) => sendFrame(f, mode)}
              landmarks={prediction?.landmarks || []}
              poseLandmarks={prediction?.pose_landmarks || []}
              isConnected={isConnected}
              isActive={isCaptureEnabled}
            />
            {error && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-md border border-red-500/50 rounded-xl p-4 text-red-400 font-mono text-sm text-center">
                System Error
                <br />
                {error}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GestureDisplay
              label={isCaptureEnabled ? prediction?.label : null}
              word={isCaptureEnabled ? prediction?.word : null}
              confidence={isCaptureEnabled ? prediction?.confidence : 0}
              type={isCaptureEnabled ? prediction?.type : null}
            />

            <SentenceBuilder
              sentence={sentence}
              currentWord={currentWord}
              onSpace={() => {
                if (currentWord) {
                  setSentence((prev) => [...prev, currentWord]);
                  setCurrentWord("");
                  committedStaticLabelRef.current = null;
                  staticHoldRef.current = { label: null, startAt: 0 };
                }
              }}
              onBackspace={() => {
                setCurrentWord("");
                committedStaticLabelRef.current = null;
                staticHoldRef.current = { label: null, startAt: 0 };
              }}
              onClearDraft={() => {
                setSentence([]);
                setCurrentWord("");
                committedStaticLabelRef.current = null;
                staticHoldRef.current = { label: null, startAt: 0 };
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
                    sendChatMessage({
                      id: Math.random().toString(36).substring(2, 9),
                      roomId: roomId,
                      senderId: participantId,
                      senderRole: "signer",
                      senderName: sessionState.displayName,
                      inputType: "gesture",
                      originalText: finalSentence,
                      originalLocale: "en",
                      timestamp: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    });
                  }
                }
                setSentence([]);
                setCurrentWord("");
                committedStaticLabelRef.current = null;
                staticHoldRef.current = { label: null, startAt: 0 };
                fetch(`${API_BASE}/api/clear-sentence`, { method: "POST" }).catch(() => {});
              }}
            />
          </div>
        </section>

        {/* Right Column: Larger Conversation Panel */}
        <aside className="min-h-[360px] xl:min-h-0 h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
            <UnifiedTimeline
              messages={messages}
              currentUserRole="signer"
              currentUserId={participantId}
              currentUserName={sessionState.displayName}
              currentLocale={targetLocale}
              onClearConversation={clearConversation}
            />
            {presence?.listener && (
              <div className="absolute bottom-2 right-4 text-xs font-bold text-[#14b8a5] bg-[#14b8a5]/10 px-3 py-1.5 rounded-full animate-pulse border border-[#14b8a5]/30 flex items-center gap-2 backdrop-blur-md">
                <span className="material-symbols-outlined text-[14px]">
                  keyboard
                </span>
                {presence.listenersActive > 1
                  ? `${presence.listenersActive} listeners are typing...`
                  : "Listener is typing..."}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
