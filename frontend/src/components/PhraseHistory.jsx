import React, { useRef, useEffect } from "react";

/**
 * PhraseHistory - Displays a chronological list of completed sentences and phrases.
 * Autoscrolls to the bottom when new phrases are added.
 */
export default function PhraseHistory({ history = [] }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col min-h-[200px] shadow-2xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="material-symbols-outlined text-purple-400 text-lg">
          history
        </span>
        <h3 className="text-sm font-semibold text-white/90 tracking-wide">
          Conversation History
        </h3>
        <div className="ml-auto text-xs font-mono text-white/40 bg-black/40 px-2 py-0.5 rounded-full">
          {history.length}
        </div>
      </div>

      {/* History List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar flex flex-col pt-1"
      >
        {history.length === 0 ? (
          <div className="m-auto text-center text-white/30 text-sm font-medium italic flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl opacity-50">
              forum
            </span>
            <p>Your conversation history will appear here.</p>
          </div>
        ) : (
          history.map((phrase, idx) => (
            <div
              key={idx}
              className="bg-black/40 border border-white/5 rounded-lg px-4 py-3 flex items-start gap-3 group transition-colors hover:bg-black/60 hover:border-white/10 animate-fade-in-up"
            >
              <div className="mt-1 shrink-0 bg-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">
                {idx + 1}
              </div>
              <p className="text-white/80 text-sm leading-relaxed font-medium">
                {phrase}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
