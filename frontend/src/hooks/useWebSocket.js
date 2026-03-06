import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { saveMessages, loadMessages } from "./useSessionStorage";
import { WS_BASE, API_BASE } from "../config";

/**
 * Custom hook for WebSocket connection to the SignBridge backend.
 * Handles room-based connections, sending frames, and real-time chat sync.
 * Persists messages to localStorage so they survive page refreshes.
 */
export function useWebSocket(roomId) {
  const [isConnected, setIsConnected] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [messages, setMessages] = useState(() => loadMessages(roomId));
  const [presence, setPresence] = useState({ signer: false, listener: false });
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;
  const wasConnectedRef = useRef(false);

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
        console.log(`[WS] Connected to SignBridge Room: ${roomId}`);

        // Show reconnection toast if this was a reconnect
        if (wasConnectedRef.current && reconnectAttempts.current > 0) {
          toast.success("Reconnected to server", { id: "ws-reconnect" });
        }
        reconnectAttempts.current = 0;
        wasConnectedRef.current = true;

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
            setPresence((prev) => ({
              ...prev,
              [data.data.role]: data.data.isActive,
            }));
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
  }, [roomId]);

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
      // Optimistic UI Update
      setMessages((prev) => [...prev, { ...payload, status: "sending" }]);
      wsRef.current.send(JSON.stringify({ type: "chat", payload }));
    } else {
      toast.error("Not connected. Message not sent.", { id: "ws-send-fail" });
    }
  }, []);

  // Send a typing/signing presence update
  const sendPresence = useCallback((role, isActive) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "presence", payload: { role, isActive } }),
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
    isConnected,
    prediction,
    messages,
    presence,
    error,
    sendFrame,
    sendChatMessage,
    sendPresence,
    clearConversation,
  };
}
