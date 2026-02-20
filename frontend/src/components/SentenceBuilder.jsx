import { useState } from "react";

/**
 * SentenceBuilder — displays the sentence built from detected gestures.
 * Built words using glowing pills with animations.
 */
export default function SentenceBuilder({ sentence }) {
  const [copied, setCopied] = useState(false);
  const words = sentence ? sentence.trim().split(" ").filter(Boolean) : [];

  const handleCopy = () => {
    if (sentence) {
      navigator.clipboard.writeText(sentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleClear = async () => {
    try {
      await fetch("/api/clear-sentence", { method: "POST" });
    } catch (e) {
      console.error("Failed to clear sentence:", e);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl p-5 bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-colors duration-300 hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#14b8a5] text-sm">
            format_quote
          </span>
          Active Sentence
        </h3>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy Text"
          >
            {copied ? (
              <span className="text-emerald-400 text-xs font-bold leading-5">
                Copied
              </span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                content_copy
              </span>
            )}
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Clear"
          >
            <span className="material-symbols-outlined text-[18px]">
              delete
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[80px] items-start content-start">
        {words.length === 0 ? (
          <span className="text-slate-500 text-sm italic py-1.5 w-full text-center">
            Sentence buffer empty...
          </span>
        ) : (
          words.map((word, i) => {
            const isLast = i === words.length - 1;
            return (
              <span
                key={`${word}-${i}`}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium animate-[word-pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]
                  ${
                    isLast
                      ? "bg-purple-500/10 border-purple-500/20 text-purple-200 animate-pulse"
                      : "bg-[#14b8a5]/10 border-[#14b8a5]/20 text-teal-200"
                  }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {word}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
