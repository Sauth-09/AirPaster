// ---------------------------------------------------------------------------
// Room Service — Room ID Generation, URL Building, Encryption Key
// ---------------------------------------------------------------------------

import {
  ROOM_ID_LENGTH_LEFT,
  ROOM_ID_LENGTH_RIGHT,
  MOBILE_WEB_BASE_URL,
} from "../utils/constants.js";

const randomDigits = (length) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

/**
 * Creates a Room service instance.
 * @param {Object} [options]
 * @param {string} [options.baseUrl] - Override the default mobile web base URL
 * @returns {Object} Frozen service interface
 */
export const createRoomService = (options = {}) => {
  const baseUrl = options.baseUrl || MOBILE_WEB_BASE_URL;

  /**
   * Generate a random room ID in format XXXX-XXX.
   * @returns {string}
   */
  const generateRoomId = () => {
    const left = randomDigits(ROOM_ID_LENGTH_LEFT);
    const right = randomDigits(ROOM_ID_LENGTH_RIGHT);
    return `${left}-${right}`;
  };

  /**
   * Build the full mobile web URL with room ID and optional encryption key.
   * The encryption key is placed in the URL hash fragment so it never
   * reaches the server.
   * @param {string} roomId
   * @param {string} [encryptionKey] - URL-safe base64 encoded key
   * @returns {string}
   */
  const buildMobileUrl = (roomId, encryptionKey = null) => {
    const url = new URL(baseUrl);
    url.searchParams.set("room", roomId);

    let fullUrl = url.toString();
    if (encryptionKey) {
      fullUrl += `#key=${encryptionKey}`;
    }
    return fullUrl;
  };

  return Object.freeze({ generateRoomId, buildMobileUrl });
};
