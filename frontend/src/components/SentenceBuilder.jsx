import { useState } from "react";

/**
 * SentenceBuilder — displays the sentence built from detected gestures.
 * Matches Stitch reference: pill badges for each word, format_quote icon, copy/delete icons.
 */
export default function SentenceBuilder({ sentence }) {
  const [copied, setCopied] = useState(false);
  const words = sentence ? sentence.trim().split(" ").filter(Boolean) : [];

  const glassPanel =
    "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]";

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
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy Text"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? "check" : "content_copy"}
            </span>
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
            Hold a gesture for ~1.5s to add a letter...
          </span>
        ) : (
          words.map((word, i) => {
            const isLast = i === words.length - 1;
            return (
              <span
                key={`${word}-${i}`}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium
                  ${
                    isLast
                      ? "bg-purple-500/10 border border-purple-500/20 text-purple-200 animate-pulse"
                      : "bg-[#14b8a5]/10 border border-[#14b8a5]/20 text-[#14b8a5]"
                  }`}
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
