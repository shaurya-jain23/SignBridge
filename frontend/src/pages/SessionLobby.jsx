import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { saveSession } from "../hooks/useSessionStorage";
import { API_BASE } from "../config";

export default function SessionLobby() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("create"); // 'create' | 'join'
  const [roomId, setRoomId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("signer");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!displayName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (mode === "join" && !roomId.trim()) {
      toast.error("Please enter a room code to join");
      return;
    }
    if (!role) {
      toast.error("Please select a role (Signer or Listener)");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "create") {
        const finalRoomId = Math.random().toString(36).substring(2, 8);

        // Register room on backend
        const res = await fetch(`${API_BASE}/api/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_id: finalRoomId }),
        });

        if (!res.ok) throw new Error("Failed to create room on server");

        // Save to localStorage before navigating
        saveSession({
          roomId: finalRoomId,
          role,
          displayName: displayName.trim(),
          language,
        });

        toast.success(`Room ${finalRoomId} created!`);

        // Navigate to the respective dashboard
        navigate(`/app/${finalRoomId}/${role}`, {
          state: { displayName: displayName.trim(), language },
        });
      } else {
        const trimmedRoomId = roomId.trim();

        // Validate room on backend
        const res = await fetch(`${API_BASE}/api/rooms/${trimmedRoomId}`);
        const data = await res.json();

        if (!data.exists) {
          toast.error("Room not found. Check the code or create a new room.");
          setIsLoading(false);
          return;
        }

        // Save to localStorage before navigating
        saveSession({
          roomId: trimmedRoomId,
          role,
          displayName: displayName.trim(),
          language,
        });

        toast.success(`Joined room ${trimmedRoomId}!`);

        // Navigate to the respective dashboard
        navigate(`/app/${trimmedRoomId}/${role}`, {
          state: { displayName: displayName.trim(), language },
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.message === "Failed to fetch"
          ? "Cannot reach the server. Is the backend running?"
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const glassPanel =
    "bg-[linear-gradient(180deg,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[12px] border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)]";

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6">
      <div className={`${glassPanel} p-8 rounded-3xl w-full max-w-md`}>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#14b8a5] to-[#a855f7]">
            Session Lobby
          </h2>
          <p className="text-slate-400 mt-2">
            Join or create a conversation room
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Action Toggle */}
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "create" ? "bg-[#14b8a5] text-[#0f172a] shadow-md shadow-[#14b8a5]/20" : "text-slate-400 hover:text-white"}`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "join" ? "bg-[#14b8a5] text-[#0f172a] shadow-md shadow-[#14b8a5]/20" : "text-slate-400 hover:text-white"}`}
            >
              Join Room
            </button>
          </div>

          {/* Room ID Input (Only if joining) */}
          {mode === "join" && (
            <div className="flex flex-col gap-1.5 animate-fade-in-up">
              <label className="text-sm font-medium text-slate-300">
                Room Code
              </label>
              <input
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. xyz123"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#14b8a5]/50 transition-colors"
              />
            </div>
          )}

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">
              Your Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#14b8a5]/50 transition-colors"
            />
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">
              Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("signer")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${role === "signer" ? "bg-[#14b8a5]/10 border-[#14b8a5]/50 text-[#14b8a5]" : "bg-black/40 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  sign_language
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Signer
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("listener")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${role === "listener" ? "bg-[#a855f7]/10 border-[#a855f7]/50 text-[#a855f7]" : "bg-black/40 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  hearing
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Listener
                </span>
              </button>
            </div>
          </div>

          {/* Preferred Language */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">
              Display Language
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#14b8a5]/50 transition-colors appearance-none"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="bn">Bengali</option>
                <option value="ur">Urdu</option>
                <option value="te">Telugu</option>
                <option value="mr">Marathi</option>
                <option value="ta">Tamil</option>
                <option value="gu">Gujarati</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="pa">Punjabi</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#14b8a5] text-[#0f172a] font-bold py-4 rounded-xl shadow-[0_0_20px_-5px_rgba(20,184,165,0.4)] hover:shadow-[0_0_30px_-5px_rgba(20,184,165,0.6)] hover:scale-[1.02] transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined">
                {mode === "create" ? "add_circle" : "login"}
              </span>
            )}
            {isLoading
              ? "Connecting..."
              : mode === "create"
                ? "Create & Enter Room"
                : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
