/**
 * useSessionStorage — Persist session state (room, role, name, language) to localStorage
 * so page refreshes don't lose everything.
 */

const SESSION_KEY = "signbridge_session";
const MESSAGES_KEY = "signbridge_messages";

/**
 * Save the current session to localStorage.
 */
export function saveSession({ roomId, role, displayName, language }) {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ roomId, role, displayName, language, savedAt: Date.now() })
    );
  } catch (e) {
    console.warn("[Storage] Failed to save session:", e);
  }
}

/**
 * Load the session from localStorage. Returns null if expired or missing.
 * Sessions expire after 4 hours of inactivity.
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Expire sessions after 4 hours
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    if (Date.now() - session.savedAt > FOUR_HOURS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch (e) {
    console.warn("[Storage] Failed to load session:", e);
    return null;
  }
}

/**
 * Clear the stored session (e.g., on leave/logout).
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MESSAGES_KEY);
  } catch (e) {
    console.warn("[Storage] Failed to clear session:", e);
  }
}

/**
 * Save messages to localStorage (scoped by roomId).
 */
export function saveMessages(roomId, messages) {
  if (!roomId || !messages) return;
  try {
    const key = `${MESSAGES_KEY}_${roomId}`;
    // Only keep the last 200 messages to avoid storage limits
    const toSave = messages.slice(-200);
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch (e) {
    console.warn("[Storage] Failed to save messages:", e);
  }
}

/**
 * Load messages from localStorage for a given room.
 */
export function loadMessages(roomId) {
  if (!roomId) return [];
  try {
    const key = `${MESSAGES_KEY}_${roomId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("[Storage] Failed to load messages:", e);
    return [];
  }
}

/**
 * Clear messages for a specific room.
 */
export function clearMessages(roomId) {
  if (!roomId) return;
  try {
    localStorage.removeItem(`${MESSAGES_KEY}_${roomId}`);
  } catch (e) {
    console.warn("[Storage] Failed to clear messages:", e);
  }
}
