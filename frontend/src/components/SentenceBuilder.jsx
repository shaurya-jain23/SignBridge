import { useState } from "react";

/**
 * SentenceBuilder — displays the sentence built from detected gestures.
 * Displays completed words (from 'sentence' array) and the ongoing 'currentWord'.
 */
export default function SentenceBuilder({
  sentence = [],
  currentWord = "",
  onSpace,
  onBackspace,
  onClearDraft,
  onSendMessage,
}) {
  const glassPanel =
    "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300";

  const hasContent = sentence.length > 0 || currentWord.length > 0;

  return (
    <div className={`${glassPanel} p-5 rounded-2xl flex flex-col gap-4`}>
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#14b8a5] text-sm">
            edit_document
          </span>
          Composer
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[80px] items-start content-start">
        {!hasContent ? (
          <span className="text-slate-500 text-sm italic py-1.5 w-full text-center">
            Form static letters or perform dynamic gestures...
          </span>
        ) : (
          <>
            {/* Render completed words */}
            {sentence.map((word, i) => (
              <span
                key={`sentence-word-${i}`}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[#14b8a5]/10 border border-[#14b8a5]/20 text-[#14b8a5]"
              >
                {word}
              </span>
            ))}

            {/* Render active current word building up */}
            {currentWord && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-purple-500/20 border border-purple-500/40 text-purple-200 animate-pulse tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                {currentWord}
                <span className="w-1.5 h-4 ml-1 bg-purple-400/80 animate-ping rounded-sm"></span>
              </span>
            )}
          </>
        )}
      </div>

      {/* Primary Accessible Action Buttons */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        <button
          onClick={onBackspace}
          disabled={!currentWord}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-white/10 hover:border-orange-500/50 text-slate-300 hover:text-orange-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Backspace (Remove last letter)"
        >
          <span className="material-symbols-outlined text-2xl">backspace</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Back
          </span>
        </button>

        <button
          onClick={onSpace}
          disabled={!currentWord}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-white/10 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Space (Complete word)"
        >
          <span className="material-symbols-outlined text-2xl">space_bar</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Space
          </span>
        </button>

        <button
          onClick={onClearDraft}
          disabled={!hasContent}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-red-500/20 hover:border-red-500/50 text-slate-300 hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Clear Entire Draft"
        >
          <span className="material-symbols-outlined text-2xl">delete</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Clear
          </span>
        </button>

        <button
          onClick={onSendMessage}
          disabled={!hasContent}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-[#14b8a5] text-[#0f172a] shadow-[0_0_20px_rgba(20,184,165,0.3)] hover:shadow-[0_0_30px_rgba(20,184,165,0.5)] hover:bg-[#10b19f] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none font-bold"
          title="Send & Speak Message"
        >
          <span className="material-symbols-outlined text-2xl">send</span>
          <span className="text-[10px] font-bold uppercase tracking-wider w-full truncate">
            Send
          </span>
        </button>
      </div>
    </div>
  );
}
