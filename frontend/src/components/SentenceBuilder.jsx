import { useState } from "react";

/**
 * SentenceBuilder — displays the sentence built from detected gestures.
 * Displays completed words (from 'sentence' array) and the ongoing 'currentWord'.
 */
export default function SentenceBuilder({
  sentence = [],
  currentWord = "",
  onSpace,
  onClearWord,
  onClearSentence,
}) {
  const [copied, setCopied] = useState(false);

  const glassPanel =
    "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]";

  const handleCopy = () => {
    const fullText = [...sentence, currentWord].filter(Boolean).join(" ");
    if (fullText) {
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className={`${glassPanel} p-5 rounded-2xl flex flex-col gap-4`}>
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#14b8a5] text-sm">
            format_quote
          </span>
          Active Sentence
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onSpace}
            disabled={!currentWord}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add Space (Push Word)"
          >
            <span className="material-symbols-outlined text-[18px]">
              space_bar
            </span>
          </button>
          <button
            onClick={onClearWord}
            disabled={!currentWord}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-orange-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear Current Word"
          >
            <span className="material-symbols-outlined text-[18px]">
              backspace
            </span>
          </button>
          <button
            onClick={onClearSentence}
            disabled={sentence.length === 0 && !currentWord}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear Entire Sentence"
          >
            <span className="material-symbols-outlined text-[18px]">
              delete
            </span>
          </button>
          <div className="w-px h-5 bg-white/10 mx-1 my-auto"></div>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-[#14b8a5] transition-colors cursor-pointer"
            title="Copy Text"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? "check" : "content_copy"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[80px] items-start content-start">
        {sentence.length === 0 && !currentWord ? (
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
    </div>
  );
}
