// ---------------------------------------------------------------------------
// Session Service — QR-less Reconnection
// ---------------------------------------------------------------------------
// Remembers the last room connection so users can reconnect without scanning
// the QR code again.
// ---------------------------------------------------------------------------

const SESSION_KEY = "airpaste_session";
const MAX_SESSION_AGE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Creates a Session service instance.
 * @returns {Object} Frozen service interface
 */
export const createSessionService = () => {
  /**
   * Save current session to localStorage.
   * @param {string} roomId
   * @param {string} [encryptionKey] - Optional encryption key
   */
  const saveSession = (roomId, encryptionKey = null) => {
    try {
      const session = {
        roomId,
        encryptionKey,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("[SessionService] Failed to save session:", error);
    }
  };

  /**
   * Get the last saved session if it's still valid.
   * @returns {{roomId: string, encryptionKey: string|null, timestamp: number}|null}
   */
  const getLastSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;

      const session = JSON.parse(raw);
      const age = Date.now() - session.timestamp;

      // Session expired
      if (age > MAX_SESSION_AGE_MS) {
        clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error("[SessionService] Failed to read session:", error);
      return null;
    }
  };

  /**
   * Clear saved session.
   */
  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("[SessionService] Failed to clear session:", error);
    }
  };

  /**
   * Get human-readable time ago string.
   * @param {number} timestamp
   * @returns {string}
   */
  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min ago`;
  };

  return Object.freeze({ saveSession, getLastSession, clearSession, getTimeAgo });
};
