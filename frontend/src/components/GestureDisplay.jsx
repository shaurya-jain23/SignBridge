/**
 * GestureDisplay — shows the currently detected gesture with confidence bar.
 * Matches Stitch reference: large glowing letter + confidence bar on the right.
 */
export default function GestureDisplay({ label, word, confidence }) {
  const confidencePercent = Math.round((confidence || 0) * 100);

  // Glass panel classes (reusable)
  const glassPanel =
    "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-[#14b8a5]/30 hover:shadow-[0_0_15px_rgba(20,184,165,0.1)]";

  if (!label || label === "Unknown" || confidence < 0) {
    return (
      <div
        className={`${glassPanel} p-5 rounded-2xl flex items-center justify-between gap-6 relative overflow-hidden`}
      >
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#14b8a5]/10 rounded-full blur-[50px] pointer-events-none"></div>
        <div className="flex flex-col gap-1 z-10">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Current Gesture
          </span>
          <h2 className="text-5xl font-black text-white/20 tracking-tighter">
            —
          </h2>
        </div>
        <div className="flex-1 flex flex-col gap-2 z-10 max-w-[180px]">
          <div className="flex justify-between items-end">
            <span className="text-xs text-slate-400 font-medium">
              Confidence Score
            </span>
            <span className="text-lg font-bold text-slate-600">0%</span>
          </div>
          <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#14b8a5] to-emerald-400 rounded-full w-0"></div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            Waiting for gesture...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${glassPanel} p-5 rounded-2xl flex items-center justify-between gap-6 relative overflow-hidden hover:scale-[1.01]`}
      key={label}
    >
      <div className="absolute right-0 top-0 w-32 h-32 bg-[#14b8a5]/10 rounded-full blur-[50px] pointer-events-none"></div>

      <div className="flex flex-col gap-1 z-10">
        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Current Gesture
        </span>
        <h2
          className="text-6xl font-black text-white tracking-tighter"
          style={{ textShadow: "0 0 20px rgba(20, 184, 165, 0.5)" }}
        >
          {label}
        </h2>
      </div>

      <div className="flex-1 flex flex-col gap-2 z-10 max-w-[180px]">
        <div className="flex justify-between items-end">
          <span className="text-xs text-slate-400 font-medium">
            Confidence Score
          </span>
          <span className="text-lg font-bold text-[#14b8a5]">
            {confidencePercent}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#14b8a5] to-emerald-400 rounded-full shadow-[0_0_10px_rgba(20,184,165,0.5)] transition-[width] duration-300 ease-out"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1">
          Latency: ~12ms
        </span>
      </div>
    </div>
  );
}
