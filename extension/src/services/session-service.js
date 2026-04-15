// ---------------------------------------------------------------------------
// Session Service (Extension)
// ---------------------------------------------------------------------------
// Uses localStorage to persist the room connection across popup closes.
// ---------------------------------------------------------------------------

const SESSION_KEY = "airpaste_session";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const createSessionService = () => {
  const saveSession = (roomId, encryptionKeyBase64) => {
    const session = {
      roomId,
      encryptionKeyBase64,
      timestamp: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const getSession = () => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);
      // Expire old sessions
      if (Date.now() - session.timestamp > SESSION_EXPIRY_MS) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
  };

  return Object.freeze({
    saveSession,
    getSession,
    clearSession
  });
};
