import React, { useRef, useEffect, useState } from "react";

/**
 * UnifiedTimeline - Displays the conversational stream of messages.
 * Messages have: id, senderRole, senderName, inputType, originalText,
 * originalLocale, translations (map), timestamp, status, confidenceScore.
 */
export default function UnifiedTimeline({
  messages = [],
  currentUserRole = "signer",
  currentLocale = "en",
  onClearConversation,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speakText = (text, lang) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    // Set best effort language code, map basic locales to TTS strings
    const langMap = {
      en: "en-US",
      hi: "hi-IN",
      es: "es-ES",
      fr: "fr-FR",
      ur: "ur-IN",
      bn: "bn-IN",
    };
    utterance.lang = langMap[lang] || lang;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col min-h-[300px] shadow-2xl overflow-hidden relative">
      <div className="flex items-center gap-3 mb-4 shrink-0 pb-4 border-b border-white/5">
        <span className="material-symbols-outlined text-[#14b8a5] text-xl">
          forum
        </span>
        <h3 className="text-base font-bold text-white tracking-wide">
          Conversation
        </h3>
        <div
          className="ml-auto text-xs font-mono text-slate-400 bg-black/40 px-2.5 py-1 rounded-full border border-white/5"
          aria-live="polite"
        >
          {messages.length} messages
        </div>
        {onClearConversation && messages.length > 0 && (
          <button
            onClick={onClearConversation}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10"
            title="Clear conversation"
          >
            <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
            Clear
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar flex flex-col pt-1"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="m-auto text-center text-slate-500 text-sm font-medium flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-3xl opacity-50">
                waving_hand
              </span>
            </div>
            <p>The conversation is empty.</p>
            <p className="text-xs">Start signing or speaking to begin.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderRole === currentUserRole;
            const displayText =
              msg.translations?.[currentLocale] || msg.originalText;

            // Check consecutive to hide redundant sender names
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const isConsecutive =
              prevMsg && prevMsg.senderName === msg.senderName;

            return (
              <TimelineMessage
                key={msg.id || idx}
                msg={msg}
                isMe={isMe}
                isConsecutive={isConsecutive}
                displayText={displayText}
                onSpeak={() => speakText(displayText, currentLocale)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function TimelineMessage({ msg, isMe, isConsecutive, displayText, onSpeak }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`flex flex-col ${isMe ? "items-end" : "items-start"} w-full animate-fade-in-up`}
    >
      {/* Sender Name + Status (Only if not consecutive) */}
      {!isConsecutive && (
        <div
          className={`flex items-center gap-2 mb-1 drop-shadow-sm ${isMe ? "flex-row-reverse" : "flex-row"} px-1`}
        >
          <span className="text-xs font-bold text-slate-300">
            {msg.senderName ||
              (msg.senderRole === "signer" ? "Signer" : "Listener")}
          </span>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            {msg.timestamp}
            {msg.inputType === "gesture" && (
              <span className="material-symbols-outlined text-[12px] opacity-70">
                sign_language
              </span>
            )}
            {msg.inputType === "mic" && (
              <span className="material-symbols-outlined text-[12px] opacity-70">
                mic
              </span>
            )}
            {msg.inputType === "typed" && (
              <span className="material-symbols-outlined text-[12px] opacity-70">
                keyboard
              </span>
            )}
          </span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 group shadow-lg border ${
          isMe
            ? "bg-gradient-to-br from-[#14b8a5]/20 to-[#14b8a5]/10 border-[#14b8a5]/20 text-white rounded-tr-sm"
            : "bg-white/5 border-white/10 text-slate-100 rounded-tl-sm backdrop-blur-sm"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm md:text-base leading-relaxed font-medium">
            {displayText}
          </p>

          {/* Controls side */}
          <div className="flex flex-col gap-1 items-end shrink-0">
            <button
              onClick={onSpeak}
              className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#14b8a5]/50"
              aria-label="Read message aloud"
              title="Read aloud"
            >
              <span className="material-symbols-outlined text-[16px]">
                volume_up
              </span>
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-1 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#14b8a5]/50 ${expanded ? "text-[#14b8a5] bg-white/10" : "text-slate-500 hover:bg-white/10 hover:text-white"}`}
              aria-label={
                expanded ? "Hide message details" : "Show message details"
              }
              aria-expanded={expanded}
              title="Show details"
            >
              <span className="material-symbols-outlined text-[16px]">
                info
              </span>
            </button>
          </div>
        </div>

        {/* Expanded Metadata Footer */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1 text-[11px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Original ({msg.originalLocale}):</span>
              <span className="text-white text-right">{msg.originalText}</span>
            </div>
            {msg.confidenceScore && (
              <div className="flex justify-between mt-1">
                <span>ML Confidence:</span>
                <span
                  className={
                    msg.confidenceScore > 0.8
                      ? "text-emerald-400"
                      : "text-orange-400"
                  }
                >
                  {(msg.confidenceScore * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {msg.status === "sending" && (
              <span className="text-[#14b8a5] mt-1 italic w-full text-right animate-pulse">
                Sending...
              </span>
            )}
            {msg.status === "failed" && (
              <span className="text-red-400 mt-1 italic w-full text-right">
                Delivery failed
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
