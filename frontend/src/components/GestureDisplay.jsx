/**
 * GestureDisplay — shows the currently detected gesture with confidence bar.
 * Fully styled with Tailwind utility classes.
 */
export default function GestureDisplay({ label, word, confidence }) {
  const confidencePercent = Math.round((confidence || 0) * 100);

  if (!label || label === "Unknown" || confidence < 0) {
    return (
      <div className="flex items-center justify-between gap-6 relative overflow-hidden transition-all duration-300 rounded-2xl p-5 bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 absolute top-5">
          Detected Gesture
        </h3>
        <div className="flex items-center gap-3 text-slate-400 mt-6">
          <span className="text-3xl">✋</span>
          <span className="text-sm">Show a hand gesture to start...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-6 relative overflow-hidden transition-[all,box-shadow,border] duration-300 rounded-2xl p-5 bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)] animate-[gesture-flash_0.25s_ease-out_forwards]"
      key={label}
    >
      <div className="absolute right-0 top-0 w-32 h-32 bg-[#14b8a5]/10 rounded-full blur-[50px] pointer-events-none"></div>

      <div className="flex flex-col gap-1 z-10 w-1/3 min-w-[100px]">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Current Gesture
        </span>
        <h2 className="text-[min(4rem,15vw)] font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(20,184,165,0.5)]">
          {label}
        </h2>
      </div>

      <div className="flex-1 flex flex-col gap-2 z-10 max-w-[200px] w-2/3 ml-auto">
        <div className="flex justify-between items-end">
          <span className="text-xs text-slate-400 font-medium tracking-tight">
            Confidence
          </span>
          <span className="text-xl font-bold text-[#14b8a5]">
            {confidencePercent}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#14b8a5] to-emerald-400 rounded-full shadow-[0_0_10px_rgba(20,184,165,0.5)] transition-[width] duration-300 ease-out"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1 text-right block">
          Score: {confidence.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
