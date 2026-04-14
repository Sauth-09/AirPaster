// ---------------------------------------------------------------------------
// URL Service — URL Parsing for Room ID and Encryption Key
// ---------------------------------------------------------------------------

import { ROOM_ID_REGEX } from "../utils/constants.js";

export const createUrlService = () => {
  /**
   * Extract the room ID from the current URL query parameters.
   * @returns {string|null}
   */
  const getRoomIdFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomId = params.get("room");
      if (roomId && ROOM_ID_REGEX.test(roomId)) {
        return roomId;
      }
      return null;
    } catch (error) {
      console.error("[UrlService] Failed to parse URL:", error);
      return null;
    }
  };

  /**
   * Extract the encryption key from the URL hash fragment.
   * Hash format: #key=abc123...
   * @returns {string|null}
   */
  const getEncryptionKeyFromUrl = () => {
    try {
      const hash = window.location.hash;
      if (!hash || !hash.includes("key=")) return null;

      const keyMatch = hash.match(/key=([A-Za-z0-9_-]+)/);
      return keyMatch ? keyMatch[1] : null;
    } catch (error) {
      console.error("[UrlService] Failed to parse encryption key:", error);
      return null;
    }
  };

  return Object.freeze({ getRoomIdFromUrl, getEncryptionKeyFromUrl });
};
