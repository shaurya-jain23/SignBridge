import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { saveMessages, loadMessages } from "./useSessionStorage";
import { WS_BASE, API_BASE } from "../config";

const CLIENT_ID_STORAGE_KEY = "signbridge_client_id";

function getOrCreateClientId() {
  const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
  return generated;
}

function buildPresenceSummary(presenceMembers, selfId) {
  const others = Object.values(presenceMembers).filter(
    (m) => m && m.participantId && m.participantId !== selfId,
  );

  const signersActive = others.filter((m) => m.role === "signer" && m.isActive)
    .length;
  const listenersActive = others.filter(
    (m) => m.role === "listener" && m.isActive,
  ).length;

  return {
    signer: signersActive > 0,
    listener: listenersActive > 0,
    signersActive,
    listenersActive,
  };
}

/**
 * Custom hook for WebSocket connection to the SignBridge backend.
 * Handles room-based connections, sending frames, and real-time chat sync.
 * Persists messages to localStorage so they survive page refreshes.
 */
export function useWebSocket(roomId, participant = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [messages, setMessages] = useState(() => loadMessages(roomId));
  const [memberCount, setMemberCount] = useState(1);
  const [presence, setPresence] = useState({
    signer: false,
    listener: false,
    signersActive: 0,
    listenersActive: 0,
  });
  const [presenceMembers, setPresenceMembers] = useState({});
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;
  const wasConnectedRef = useRef(false);
  const clientIdRef = useRef(getOrCreateClientId());

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (roomId && messages.length > 0) {
      saveMessages(roomId, messages);
    }
  }, [messages, roomId]);

  const connect = useCallback(() => {
    if (!roomId) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }

    try {
      const url = `${WS_BASE}/ws/${roomId}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setPresenceMembers({});
        setPresence({
          signer: false,
          listener: false,
          signersActive: 0,
          listenersActive: 0,
        });
        console.log(`[WS] Connected to SignBridge Room: ${roomId}`);

        // Show reconnection toast if this was a reconnect
        if (wasConnectedRef.current && reconnectAttempts.current > 0) {
          toast.success("Reconnected to server", { id: "ws-reconnect" });
        }
        reconnectAttempts.current = 0;
        wasConnectedRef.current = true;

        ws.send(
          JSON.stringify({
            type: "join",
            payload: {
              participantId: clientIdRef.current,
              participantName: participant.name || "Guest",
              role: participant.role || "listener",
            },
          }),
        );

        // Sync message history from server (catches messages sent while disconnected)
        fetch(`${API_BASE}/api/rooms/${roomId}/messages`)
          .then((r) => r.json())
          .then((data) => {
            if (data.messages?.length) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const newFromServer = data.messages.filter(
                  (m) => !existingIds.has(m.id),
                );
                if (newFromServer.length === 0) return prev;
                const merged = [...prev, ...newFromServer].sort(
                  (a, b) =>
                    new Date(a.timestamp || 0) - new Date(b.timestamp || 0),
                );
                return merged;
              });
            }
          })
          .catch(() => {
            // Silent — local cache is the fallback
          });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "prediction") {
            setPrediction(data.data);
          } else if (data.type === "chat_sync") {
            // Check if we already have this message for optimistic UI
            setMessages((prev) => {
              const existingIndex = prev.findIndex(
                (m) => m.id === data.data.id,
              );
              if (existingIndex !== -1) {
                const newMsgs = [...prev];
                newMsgs[existingIndex] = data.data; // Server version overrides with translations and "sent" status
                return newMsgs;
              }
              return [...prev, data.data];
            });
          } else if (data.type === "presence_sync") {
            const payload = data.data || {};
            if (!payload.participantId || !payload.role) return;

            setPresenceMembers((prev) => {
              return {
                ...prev,
                [payload.participantId]: {
                  participantId: payload.participantId,
                  participantName: payload.participantName || "Guest",
                  role: payload.role,
                  isActive: Boolean(payload.isActive),
                  updatedAt: Date.now(),
                },
              };
            });
          } else if (data.type === "room_state") {
            setMemberCount(Math.max(1, Number(data?.data?.memberCount || 1)));
          } else if (data.type === "room_event") {
            const action = data?.data?.action;
            const eventParticipant = data?.data?.participant || {};
            const count = Math.max(1, Number(data?.data?.memberCount || 1));

            setMemberCount(count);

            if (eventParticipant.participantId === clientIdRef.current) return;

            const name = eventParticipant.participantName || "Someone";
            if (action === "joined") {
              toast.success(`${name} joined the room`, {
                id: `room-join-${eventParticipant.participantId}-${Date.now()}`,
              });
            } else if (action === "left") {
              toast(`${name} left the room`, {
                id: `room-left-${eventParticipant.participantId}-${Date.now()}`,
              });
            }
          } else if (data.error) {
            setError(data.error);
            toast.error(`Server error: ${data.error}`, { id: "ws-error" });
          }
        } catch (e) {
          console.error("[WS] Failed to parse message:", e);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);

        // Room not found — don't reconnect
        if (event.code === 4004) {
          const msg = "Room not found. It may have expired.";
          setError(msg);
          toast.error(msg, { id: "ws-room-not-found" });
          return;
        }

        console.log("[WS] Disconnected — reconnecting...");

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          const delay = Math.min(2000 * reconnectAttempts.current, 10000);

          if (wasConnectedRef.current && reconnectAttempts.current === 1) {
            toast.error("Connection lost. Reconnecting...", {
              id: "ws-disconnect",
              duration: 3000,
            });
          }

          reconnectTimerRef.current = setTimeout(connect, delay);
        } else {
          const msg = "Unable to reconnect. Please refresh the page.";
          setError(msg);
          toast.error(msg, { id: "ws-max-retries", duration: 10000 });
        }
      };

      ws.onerror = (e) => {
        console.error("[WS] Error:", e);
        // Don't toast here — onclose will fire immediately after and handle it
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("[WS] Failed to create WebSocket:", e);
      setError("Failed to connect");
      toast.error("Failed to connect to server", { id: "ws-connect-fail" });
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimerRef.current = setTimeout(connect, 2000);
      }
    }
  }, [roomId, participant.name, participant.role]);

  useEffect(() => {
    setPresence(buildPresenceSummary(presenceMembers, clientIdRef.current));
  }, [presenceMembers]);

  // Send a video frame to the backend with the current mode
  const sendFrame = useCallback((base64Frame, mode = "hybrid") => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "frame", frame: base64Frame, mode }),
      );
    }
  }, []);

  // Send a completed chat message payload
  const sendChatMessage = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const finalPayload = {
        ...payload,
        senderId: payload.senderId || clientIdRef.current,
      };

      // Optimistic UI Update
      setMessages((prev) => [...prev, { ...finalPayload, status: "sending" }]);
      wsRef.current.send(JSON.stringify({ type: "chat", payload: finalPayload }));
    } else {
      toast.error("Not connected. Message not sent.", { id: "ws-send-fail" });
    }
  }, []);

  // Send a typing/signing presence update
  const sendPresence = useCallback((role, isActive, participantName = "Guest") => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "presence",
          payload: {
            role,
            isActive,
            participantName,
            participantId: clientIdRef.current,
          },
        }),
      );
    }
  }, []);

  // Clear messages (e.g., user action)
  const clearConversation = useCallback(() => {
    setMessages([]);
    if (roomId) {
      saveMessages(roomId, []);
    }
    toast.success("Conversation cleared");
  }, [roomId]);

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    participantId: clientIdRef.current,
    isConnected,
    prediction,
    messages,
    memberCount,
    presence,
    presenceMembers,
    error,
    sendFrame,
    sendChatMessage,
    sendPresence,
    clearConversation,
  };
}
