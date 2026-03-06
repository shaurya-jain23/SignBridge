import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useWebSocket } from "../hooks/useWebSocket";
import { clearSession } from "../hooks/useSessionStorage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import UnifiedTimeline from "../components/UnifiedTimeline";

const glassPanel =
  "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300";

export default function ListenerDashboard({ roomId, sessionState }) {
  const navigate = useNavigate();
  const {
    isConnected,
    messages,
    presence,
    error,
    sendChatMessage,
    sendPresence,
    clearConversation,
  } = useWebSocket(roomId);
  const [targetLocale, setTargetLocale] = useState(
    sessionState.language || "en",
  );
  const [autoTTS, setAutoTTS] = useState(false);

  // Auto-read incoming messages
  const lastMessageCount = useRef(messages.length);
  useEffect(() => {
    if (autoTTS && messages.length > lastMessageCount.current) {
      const newMsgs = messages.slice(lastMessageCount.current);
      newMsgs.forEach((msg) => {
        // Only read messages from the other person
        if (msg.senderRole !== "listener") {
          const text = msg.translations?.[targetLocale] || msg.originalText;
          if (text) {
            const utterance = new SpeechSynthesisUtterance(text);
            const langMap = {
              en: "en-US",
              hi: "hi-IN",
              es: "es-ES",
              fr: "fr-FR",
            };
            utterance.lang = langMap[targetLocale] || targetLocale;
            window.speechSynthesis.speak(utterance);
          }
        }
      });
    }
    lastMessageCount.current = messages.length;
  }, [messages, autoTTS, targetLocale]);

  const handleSend = (text, inputType = "typed") => {
    if (!text.trim()) return;

    if (!isConnected) {
      toast.error("Not connected. Cannot send message.");
      return;
    }

    sendChatMessage({
      id: Math.random().toString(36).substring(2, 9),
      roomId: roomId,
      senderRole: "listener",
      senderName: sessionState.displayName,
      inputType: inputType,
      originalText: text,
      originalLocale: targetLocale,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-[#0f172a]">
      {/* ─── App Header Bar ─── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0a0a1a]/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
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
              className={`text-xs font-semibold uppercase tracking-wider hidden sm:inline-block ${
                isConnected ? "text-[#14b8a5]" : "text-red-500"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">
              hearing
            </span>
            Listener View
          </div>

          <button
            onClick={() => setAutoTTS(!autoTTS)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wide ${
              autoTTS
                ? "bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            title="Auto-read new messages out loud"
          >
            <span className="material-symbols-outlined text-[14px]">
              {autoTTS ? "volume_up" : "volume_off"}
            </span>
            Auto-Read
          </button>

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

        <LanguageSwitcher
          locale={targetLocale}
          onLocaleChange={setTargetLocale}
        />
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden max-w-5xl mx-auto w-full">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center flex items-center justify-center gap-2 mb-2 shrink-0">
            <span className="material-symbols-outlined shrink-0 text-[18px]">
              error
            </span>
            {error}
          </div>
        )}

        {/* Timeline Dominates View */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <UnifiedTimeline
            messages={messages}
            currentUserRole="listener"
            currentLocale={targetLocale}
            onClearConversation={clearConversation}
          />

          {/* Presence Indicator */}
          {presence?.signer && (
            <div className="absolute bottom-2 left-4 text-xs font-bold text-[#14b8a5] bg-[#14b8a5]/10 px-3 py-1.5 rounded-full animate-pulse border border-[#14b8a5]/30 flex items-center gap-2 backdrop-blur-md">
              <span className="material-symbols-outlined text-[14px]">
                sign_language
              </span>
              Signer is drafting a message...
            </div>
          )}
        </div>

        {/* Bottom Reply Bar */}
        <ReplyBar
          onSend={handleSend}
          currentLocale={targetLocale}
          onPresenceChange={(isActive) => sendPresence("listener", isActive)}
        />
      </main>
    </div>
  );
}

function ReplyBar({ onSend, currentLocale, onPresenceChange }) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sttError, setSttError] = useState("");
  const recognitionRef = useRef(null);

  // Broadcast presence
  const isActive = text.length > 0 || isListening;
  useEffect(() => {
    onPresenceChange?.(isActive);
  }, [isActive, onPresenceChange]);

  const LOCALE_VOICE_MAP = {
    en: "en-US",
    hi: "hi-IN",
    es: "es-ES",
    fr: "fr-FR",
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = LOCALE_VOICE_MAP[currentLocale] || "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setSttError("");
    };

    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setText(currentTranscript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setSttError(
        event.error === "network"
          ? "Chrome requires HTTPS for STT."
          : "Mic access denied.",
      );
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [currentLocale]);

  const toggleMic = () => {
    if (!recognitionRef.current)
      return alert("Speech Recognition not supported in this browser.");
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setText(""); // clear previous draft before speaking
      recognitionRef.current.start();
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text, isListening ? "mic" : "typed");
    setText("");
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl flex flex-col gap-3 bg-black/40 border border-white/10 shadow-xl shrink-0`}
    >
      {sttError && (
        <div className="text-xs text-red-400 italic">
          <span className="material-symbols-outlined text-[12px] align-middle mr-1">
            warning
          </span>
          {sttError}
        </div>
      )}

      <div className="flex items-end gap-3 rounded-xl">
        <button
          onClick={toggleMic}
          className={`flex shrink-0 items-center justify-center w-12 h-12 rounded-full transition-all active:scale-95 shadow-lg ${
            isListening
              ? "bg-red-500 shadow-red-500/30 animate-pulse text-white"
              : "bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
          }`}
          title={isListening ? "Stop listening" : "Start speaking"}
        >
          <span className="material-symbols-outlined text-2xl">
            {isListening ? "mic_off" : "mic"}
          </span>
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Listening..."
              : "Type a message or tap the mic to speak..."
          }
          className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#14b8a5]/50 transition-colors resize-none overflow-hidden min-h-[50px] max-h-[120px] ${isListening ? "italic text-emerald-300 border-red-500/30 bg-red-500/5" : ""}`}
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex shrink-0 items-center justify-center h-12 px-6 rounded-xl bg-[#14b8a5] text-[#0f172a] font-bold shadow-[0_0_20px_rgba(20,184,165,0.2)] hover:shadow-[0_0_30px_rgba(20,184,165,0.4)] hover:scale-[1.02] transition-all disabled:opacity-30 disabled:scale-100 disabled:shadow-none"
        >
          <span className="material-symbols-outlined mr-2">send</span>
          Send
        </button>
      </div>
    </div>
  );
}
