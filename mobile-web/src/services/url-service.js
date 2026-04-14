// ---------------------------------------------------------------------------
// URL Service — URL Parameter Parsing & Validation
// ---------------------------------------------------------------------------
// Pure functions for extracting and validating room IDs from URLs.
// ---------------------------------------------------------------------------

import { ROOM_ID_REGEX } from "../utils/constants.js";

/**
 * @typedef {Object} UrlService
 * @property {() => string|null} getRoomIdFromUrl
 * @property {(roomId: string) => boolean} validateRoomId
 */

/**
 * Creates a URL service instance.
 * @returns {UrlService}
 */
export const createUrlService = () => {
  /**
   * Extract the room ID from the current page URL's query parameters.
   * @returns {string|null} The room ID, or null if not found
   */
  const getRoomIdFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomId = params.get("room");
      return roomId && validateRoomId(roomId) ? roomId : null;
    } catch (error) {
      console.error("[UrlService] Failed to parse URL:", error);
      return null;
    }
  };

  /**
   * Validate a room ID against the expected format (XXXX-XXX).
   * @param {string} roomId
   * @returns {boolean}
   */
  const validateRoomId = (roomId) => {
    if (!roomId || typeof roomId !== "string") return false;
    return ROOM_ID_REGEX.test(roomId);
  };

  return Object.freeze({ getRoomIdFromUrl, validateRoomId });
};
