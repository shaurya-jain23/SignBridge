import { useParams, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import toast from "react-hot-toast";
import SignerDashboard from "./SignerDashboard";
import ListenerDashboard from "./ListenerDashboard";
import { saveSession, loadSession } from "../hooks/useSessionStorage";

export default function AppPage() {
  const { roomId, role } = useParams();
  const location = useLocation();

  // Try location.state first (coming from lobby), then localStorage (page refresh)
  const storedSession = loadSession();
  const state = location.state ||
    (storedSession && storedSession.roomId === roomId
      ? { displayName: storedSession.displayName, language: storedSession.language }
      : null);

  // Redirect to lobby if no session data at all
  if (!roomId || !role || !state) {
    return <Navigate to="/session" replace />;
  }

  // Persist session to localStorage whenever we mount with valid state
  useEffect(() => {
    saveSession({
      roomId,
      role,
      displayName: state.displayName,
      language: state.language,
    });
  }, [roomId, role, state.displayName, state.language]);

  // Show connection toast on first load
  useEffect(() => {
    toast.success(`Joined room ${roomId} as ${role}`, { id: "join-room" });
  }, [roomId, role]);

  if (role === "listener") {
    return <ListenerDashboard roomId={roomId} sessionState={state} />;
  }

  // Default to Signer Dashboard
  return <SignerDashboard roomId={roomId} sessionState={state} />;
}
